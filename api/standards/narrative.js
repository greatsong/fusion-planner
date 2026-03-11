import Anthropic from '@anthropic-ai/sdk'
import { getStandards } from '../_store.js'

export const config = {
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' })
  }

  const { standardCode, connections = [] } = req.body
  if (!standardCode) {
    return res.status(400).json({ error: 'standardCode가 필요합니다.' })
  }

  // SSE 설정
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    const standards = getStandards()
    const allStandards = [...standards.values()]
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

    const client = new Anthropic({ apiKey })
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
}
