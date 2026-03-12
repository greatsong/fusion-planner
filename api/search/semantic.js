/**
 * Vercel 서버리스: 의미 검색
 * POST /api/search/semantic
 */
import { getStandards } from '../_store.js'
import { initVectorSearch, searchSemantic, getSearchStatus } from '../../server/services/vectorSearch.js'

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

    const { query, filters = {}, limit = 30 } = req.body
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' })
    }

    const startTime = Date.now()
    const results = await searchSemantic(query.trim(), {
      limit: Math.min(limit, 100),
      filters,
    })

    // 교과군별 그룹핑
    const grouped = {}
    for (const r of results) {
      const group = r.standard.subject_group || '기타'
      if (!grouped[group]) grouped[group] = []
      grouped[group].push({
        code: r.standard.code,
        subject: r.standard.subject,
        subject_group: r.standard.subject_group,
        grade_group: r.standard.grade_group,
        school_level: r.standard.school_level,
        area: r.standard.area,
        domain: r.standard.domain,
        content: r.standard.content,
        keywords: r.standard.keywords,
        curriculum_category: r.standard.curriculum_category,
        similarity: Math.round(r.similarity * 1000) / 1000,
      })
    }

    const elapsed = Date.now() - startTime
    const status = getSearchStatus()

    res.json({
      query: query.trim(),
      mode: status.mode,
      totalResults: results.length,
      elapsed: `${elapsed}ms`,
      grouped,
      results: results.map((r, i) => ({
        rank: i + 1,
        code: r.standard.code,
        subject: r.standard.subject,
        subject_group: r.standard.subject_group,
        grade_group: r.standard.grade_group,
        school_level: r.standard.school_level,
        area: r.standard.area,
        domain: r.standard.domain,
        content: r.standard.content,
        keywords: r.standard.keywords,
        explanation: r.standard.explanation,
        curriculum_category: r.standard.curriculum_category,
        similarity: Math.round(r.similarity * 1000) / 1000,
      })),
    })
  } catch (err) {
    console.error('의미 검색 오류:', err)
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' })
  }
}
