/**
 * Vercel 서버리스: 이웃 탐색
 * POST /api/search/neighbors
 */
import { getStandards } from '../_store.js'
import { initVectorSearch, findNeighbors, getSearchStatus } from '../../server/services/vectorSearch.js'

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

  try {
    ensureSearch()

    const { code, limit = 20, cross_subject_only = true } = req.body
    if (!code) {
      return res.status(400).json({ error: '성취기준 코드가 필요합니다.' })
    }

    const startTime = Date.now()
    const { standard, neighbors } = await findNeighbors(code, {
      limit: Math.min(limit, 50),
      crossSubjectOnly: cross_subject_only,
    })

    if (!standard) {
      return res.status(404).json({ error: `성취기준 ${code}를 찾을 수 없습니다.` })
    }

    const elapsed = Date.now() - startTime
    const status = getSearchStatus()

    // 교과군별 그룹핑
    const grouped = {}
    for (const n of neighbors) {
      const group = n.standard.subject_group || '기타'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push({
        code: n.standard.code,
        subject: n.standard.subject,
        subject_group: n.standard.subject_group,
        grade_group: n.standard.grade_group,
        school_level: n.standard.school_level,
        content: n.standard.content,
        similarity: Math.round(n.similarity * 1000) / 1000,
      })
    }

    res.json({
      mode: status.mode,
      elapsed: `${elapsed}ms`,
      standard: {
        code: standard.code,
        subject: standard.subject,
        subject_group: standard.subject_group,
        grade_group: standard.grade_group,
        school_level: standard.school_level,
        area: standard.area,
        domain: standard.domain,
        content: standard.content,
        keywords: standard.keywords,
        explanation: standard.explanation,
        curriculum_category: standard.curriculum_category,
      },
      totalNeighbors: neighbors.length,
      grouped,
    })
  } catch (err) {
    console.error('이웃 탐색 오류:', err)
    res.status(500).json({ error: '이웃 탐색 중 오류가 발생했습니다.' })
  }
}
