/**
 * Vercel 서버리스: AI 융합 수업 설계 (SSE 스트리밍)
 * POST /api/ai/fusion-design
 */
import Anthropic from '@anthropic-ai/sdk'
import { getStandards } from '../_store.js'
import { initVectorSearch, searchSemantic } from '../../server/services/vectorSearch.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

let searchReady = false
function ensureSearch() {
  if (searchReady) return
  const stds = [...getStandards().values()]
  initVectorSearch(stds)
  searchReady = true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 지원합니다.' })
  }

  const { prompt, standards = [] } = req.body
  if (!standards.length) {
    return res.status(400).json({ error: '성취기준을 선택해주세요.' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    ensureSearch()

    // RAG: 추가 맥락 검색
    const searchQuery = standards.map(s => s.content).join(' ').substring(0, 200)
    let additionalContext = ''
    try {
      const related = await searchSemantic(searchQuery, { limit: 10 })
      const relatedCodes = new Set(standards.map(s => s.code))
      const extra = related.filter(r => !relatedCodes.has(r.standard.code)).slice(0, 5)
      if (extra.length > 0) {
        additionalContext = `\n\n## 참고: 관련 성취기준\n`
        for (const r of extra) {
          additionalContext += `- ${r.standard.code} [${r.standard.subject_group}/${r.standard.subject}] ${r.standard.content}\n`
        }
      }
    } catch (e) {}

    const subjectGroups = [...new Set(standards.map(s => s.subject_group))]
    const standardsDetail = standards.map(s =>
      `### ${s.code} [${s.subject_group} > ${s.subject}] (${s.grade_group})\n${s.content}\n` +
      (s.area ? `영역: ${s.area}\n` : '') +
      (s.explanation ? `해설: ${s.explanation.substring(0, 300)}\n` : '') +
      (s.keywords?.length ? `키워드: ${s.keywords.join(', ')}\n` : '')
    ).join('\n')

    const systemPrompt = `당신은 2022 개정 교육과정의 융합교육 설계 전문가입니다.

교사가 여러 교과의 성취기준을 선택했습니다. 이 성취기준들을 유기적으로 연결하는 **구체적인 융합 프로젝트 수업**을 설계하세요.

## 설계 가이드
1. **프로젝트명**: 매력적인 제목
2. **수업 개요**: 2~3문장
3. **관련 성취기준 연계표**: 각 성취기준이 프로젝트에서 어떻게 다뤄지는지
4. **차시별 수업 흐름**: 4~8차시 구성
5. **학생 산출물**: 최종 결과물 형태
6. **평가 방법**: 과정 중심 평가

## 형식
- 한국어 존댓말, 마크다운, 성취기준 코드 포함, 800~1500자

## 선택된 성취기준 (${standards.length}개, 교과: ${subjectGroups.join(', ')})
${standardsDetail}
${additionalContext}`

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`)
      }
    }

    res.write(`data: [DONE]\n\n`)
    res.end()
  } catch (error) {
    console.error('융합 설계 오류:', error?.message || error)
    const errMsg = error?.status === 401 ? 'API 키가 유효하지 않습니다.'
      : error?.status === 429 ? 'API 요청 한도를 초과했습니다.'
      : `설계 생성 중 오류: ${error?.message || '알 수 없는 오류'}`
    res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`)
    res.write(`data: [DONE]\n\n`)
    res.end()
  }
}
