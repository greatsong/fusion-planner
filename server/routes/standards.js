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

/**
 * AI 융합 소재 추천 (SSE 스트리밍)
 */
standardsRouter.post('/recommend-topics', async (req, res) => {
  const { selectedSubjects = [], crossLinks = [] } = req.body
  if (!selectedSubjects || selectedSubjects.length < 2) {
    return res.status(400).json({ error: '2개 이상의 과목을 선택해주세요.' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const subjectInfo = selectedSubjects.map(s => {
      const samples = (s.sampleStandards || []).slice(0, 5)
        .map(st => `    - ${st.code}: ${st.content}`)
        .join('\n')
      return `### ${s.subjectGroup} > ${s.subject} (${s.curriculumCategory || ''})\n  성취기준 ${s.standardsCount}개\n  대표 성취기준:\n${samples}`
    }).join('\n\n')

    const linkInfo = crossLinks.slice(0, 20).map(l =>
      `  • ${l.source} ↔ ${l.target} [${l.type}] — ${l.rationale || ''}`
    ).join('\n')

    const subjectNames = selectedSubjects.map(s => s.subject).join(', ')

    const systemPrompt = `당신은 2022 개정 교육과정의 융합교육 전문가입니다.

교사가 여러 과목을 선택했습니다. 이 과목들 사이에서 교육적으로 의미 있는 **융합 수업 소재**를 추천하세요.

## 작성 가이드
1. **과목 간 접점 분석**: 선택된 과목들의 성취기준을 분석하여 공통 주제, 개념, 역량을 파악합니다.
2. **융합 수업 소재 추천**: 3~5개의 구체적인 융합 수업 소재를 제안합니다.
3. 각 소재에 대해:
   - **소재 제목**: 학생에게 흥미를 유발하는 프로젝트/수업 제목
   - **관련 과목 및 성취기준**: 어떤 과목의 어떤 내용이 연결되는지 (성취기준 코드 포함)
   - **교육적 근거**: 왜 이 융합이 의미 있는지
   - **수업 구성 방향**: 2~3문장으로 수업 흐름 제안

## 유의사항
- 단순한 키워드 일치가 아닌, 실질적인 교육적 연계를 제안합니다.
- 학생의 실생활과 연결될 수 있는 소재를 우선합니다.
- 교과 간 위계를 고려하여 적절한 난이도를 제시합니다.
- 기존 교과 연결 데이터(아래)를 참고하되 이에 국한되지 마세요.

## 형식
- 한국어 존댓말
- 마크다운 형식 (##, -, **굵은 글씨** 등)
- 성취기준 코드는 반드시 포함
- 분량: 각 소재당 200~400자

## 선택된 과목 정보
${subjectInfo}

## 과목 간 기존 연결 (참고용)
${linkInfo || '(교차 연결 데이터 없음)'}
`

    console.log(`[recommend-topics] 과목 ${selectedSubjects.length}개: ${subjectNames}`)

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `선택한 ${selectedSubjects.length}개 과목(${subjectNames})의 융합 수업 소재를 추천해주세요.`,
      }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`)
      }
    }

    res.write(`data: [DONE]\n\n`)
    res.end()
  } catch (error) {
    console.error('융합 소재 추천 오류:', error?.message || error)
    const errMsg = error?.status === 401 ? 'API 키가 유효하지 않습니다.'
      : error?.status === 429 ? 'API 요청 한도를 초과했습니다.'
      : `추천 생성 중 오류: ${error?.message || '알 수 없는 오류'}`
    res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`)
    res.write(`data: [DONE]\n\n`)
    res.end()
  }
})
