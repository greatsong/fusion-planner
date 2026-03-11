import Anthropic from '@anthropic-ai/sdk'

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

  const { selectedSubjects = [], crossLinks = [] } = req.body
  if (!selectedSubjects || selectedSubjects.length < 2) {
    return res.status(400).json({ error: '2개 이상의 과목을 선택해주세요.' })
  }

  // SSE 설정
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')

  try {
    // 선택 과목 정보 구성
    const subjectInfo = selectedSubjects.map(s => {
      const samples = (s.sampleStandards || []).slice(0, 5)
        .map(st => `    - ${st.code}: ${st.content}`)
        .join('\n')
      return `### ${s.subjectGroup} > ${s.subject} (${s.curriculumCategory || ''})\n  성취기준 ${s.standardsCount}개\n  대표 성취기준:\n${samples}`
    }).join('\n\n')

    // 교차 링크 정보 구성
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

    const client = new Anthropic({ apiKey })
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
}
