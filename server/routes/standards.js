import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { Standards, StandardLinks } from '../lib/store.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const standardsRouter = Router()

// 성취기준 검색
standardsRouter.get('/search', (req, res) => {
  const { q, subject, grade, domain, school_level } = req.query
  res.json(Standards.search({ q, subject, grade, domain, school_level }))
})

// 교과 목록
standardsRouter.get('/subjects', (req, res) => res.json(Standards.subjects()))

// 학년군 목록
standardsRouter.get('/grades', (req, res) => res.json(Standards.gradeGroups()))

// 학교급 목록
standardsRouter.get('/school-levels', (req, res) => res.json(Standards.schoolLevels()))

// 그래프 데이터
standardsRouter.get('/graph', (req, res) => {
  res.json(StandardLinks.getGraph())
})

// 특정 성취기준의 연결
standardsRouter.get('/:id/links', (req, res) => {
  res.json(StandardLinks.getByStandard(req.params.id))
})

/**
 * AI 내러티브 생성 (SSE 스트리밍)
 */
standardsRouter.post('/narrative', async (req, res) => {
  const { standardCode, connections = [] } = req.body
  if (!standardCode) {
    return res.status(400).json({ error: '성취기준 코드가 필요합니다.' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const allStandards = Standards.list()
    const center = allStandards.find(s => s.code === standardCode)
    if (!center) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: '해당 성취기준을 찾을 수 없습니다.' })}\n\n`)
      res.write(`data: [DONE]\n\n`)
      res.end()
      return
    }

    const connectionDetails = connections.slice(0, 15).map(c => {
      const neighbor = allStandards.find(s => s.code === c.neighborCode)
      return neighbor
        ? `  • ${neighbor.code} [${neighbor.subject_group}/${neighbor.grade_group}] — ${neighbor.content}\n    연결유형: ${c.linkType || 'cross_subject'}, 근거: ${c.rationale || '없음'}`
        : null
    }).filter(Boolean).join('\n')

    const subjectSet = new Set(connections.map(c => c.subjectGroup).filter(Boolean))
    const subjectList = [...subjectSet].join(', ')

    const systemPrompt = `당신은 2022 개정 교육과정의 융합 수업 설계 전문가입니다.

교사가 선택한 성취기준과 그 연결을 분석하여, 교육적으로 의미 있는 **융합 수업 내러티브**를 작성하세요.

## 작성 가이드
1. **연결 해석**: 각 연결이 왜 교육적으로 의미 있는지 설명합니다.
2. **융합 수업 아이디어**: 이 연결들을 활용한 구체적 수업 시나리오를 1~2개 제안합니다.
3. **학생 역량**: 이 융합 수업으로 키울 수 있는 핵심 역량을 언급합니다.
4. **실천 팁**: 교사가 바로 활용할 수 있는 실천적 조언을 제공합니다.

## 형식
- 한국어 존댓말 사용
- 마크다운 형식 (##, -, **굵은 글씨** 등)
- 성취기준 코드는 반드시 포함
- 분량: 400~800자 내외로 간결하게

## 중심 성취기준
${center.code} [${center.subject_group}/${center.grade_group}/${center.area || ''}]
${center.content}
${center.explanation ? `해설: ${center.explanation}` : ''}

## 연결된 성취기준 (${connections.length}개, 교과: ${subjectList})
${connectionDetails}
`

    console.log(`[narrative] ${standardCode}: 연결 ${connections.length}개, 교과 ${subjectList}`)

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: `${center.code} 성취기준의 교과 간 연결을 분석하고, 이를 활용한 융합 수업 내러티브를 작성해주세요.` }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`)
      }
    }

    res.write(`data: [DONE]\n\n`)
    res.end()
  } catch (error) {
    console.error('내러티브 생성 오류:', error?.message || error)
    const errMsg = error?.status === 401 ? 'API 키가 유효하지 않습니다.'
      : error?.status === 429 ? 'API 요청 한도를 초과했습니다.'
      : `내러티브 생성 중 오류: ${error?.message || '알 수 없는 오류'}`
    res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`)
    res.write(`data: [DONE]\n\n`)
    res.end()
  }
})
