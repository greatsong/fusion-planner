/**
 * 의미 검색 API 라우터
 *
 * POST /api/search/semantic — 자연어 의미 검색
 * POST /api/search/neighbors — 특정 성취기준의 유사 이웃
 * GET  /api/search/status — 검색 엔진 상태
 */
import { Router } from 'express'
import { searchSemantic, findNeighbors, getSearchStatus } from '../services/vectorSearch.js'

export const searchRouter = Router()

// 의미 검색
searchRouter.post('/semantic', async (req, res) => {
  try {
    const { query, filters = {}, limit = 30 } = req.body
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' })
    }

    const startTime = Date.now()
    const { results, mode } = await searchSemantic(query.trim(), {
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

    res.json({
      query: query.trim(),
      mode,
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
    console.error('의미 검색 오류:', err.message)
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' })
  }
})

// 이웃 탐색
searchRouter.post('/neighbors', async (req, res) => {
  try {
    const { code, limit = 20, cross_subject_only = true } = req.body
    if (!code) {
      return res.status(400).json({ error: '성취기준 코드가 필요합니다.' })
    }

    const startTime = Date.now()
    const { standard, neighbors, mode } = await findNeighbors(code, {
      limit: Math.min(limit, 50),
      crossSubjectOnly: cross_subject_only,
    })

    if (!standard) {
      return res.status(404).json({ error: `성취기준 ${code}를 찾을 수 없습니다.` })
    }

    const elapsed = Date.now() - startTime

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
      mode,
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
    console.error('이웃 탐색 오류:', err.message)
    res.status(500).json({ error: '이웃 탐색 중 오류가 발생했습니다.' })
  }
})

// 검색 엔진 상태
searchRouter.get('/status', (req, res) => {
  res.json(getSearchStatus())
})
