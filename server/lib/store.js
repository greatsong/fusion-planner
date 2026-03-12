/**
 * 인메모리 데이터 저장소 (읽기 전용)
 * curriculum-weaver 데이터를 로드하여 성취기준 + 연결만 제공
 */
import crypto from 'crypto'
import { ALL_STANDARDS } from '../data/standards.js'
import { SOCIAL_STANDARDS } from '../data/standards_social.js'
import { COMMON_STANDARDS } from '../data/standards_common.js'
import { GENERATED_LINKS } from '../data/generatedLinks.js'

function uuid() { return crypto.randomUUID() }

const standards = new Map()
const standardLinks = new Map()

export function initStore() {
  // 성취기준 로드 (중복 코드 제거 + 사회 데이터 통합)
  const seenCodes = new Set()
  const socialFixed = SOCIAL_STANDARDS.map(s => ({ ...s, subject_group: '사회' }))
  const mergedStandards = [...ALL_STANDARDS, ...socialFixed, ...COMMON_STANDARDS]

  for (const s of mergedStandards) {
    if (seenCodes.has(s.code)) continue
    seenCodes.add(s.code)
    const id = uuid()
    standards.set(id, { id, ...s, created_at: new Date().toISOString() })
  }

  // 성취기준 간 연결 로드
  const codeToStd = new Map()
  for (const [id, s] of standards) codeToStd.set(s.code, s)

  const ltMap = { cs: 'cross_subject', sc: 'same_concept', ap: 'application', pr: 'prerequisite' }
  const now = new Date().toISOString()

  for (const link of GENERATED_LINKS) {
    const [src, tgt, ltShort, rationale] = Array.isArray(link)
      ? link
      : [link.source, link.target, link.link_type, link.rationale]
    const sourceStd = codeToStd.get(src)
    const targetStd = codeToStd.get(tgt)
    if (sourceStd && targetStd) {
      const id = uuid()
      const lt = ltMap[ltShort] || ltShort
      standardLinks.set(id, {
        id,
        source_id: sourceStd.id,
        target_id: targetStd.id,
        source_code: src,
        target_code: tgt,
        link_type: lt,
        rationale: rationale || '',
        similarity: lt === 'same_concept' ? 0.9 : lt === 'prerequisite' ? 0.85 : 0.7,
        created_at: now,
      })
    }
  }

  console.log(`  데이터 로드 완료: 성취기준 ${standards.size}개, 연결 ${standardLinks.size}개`)
}

// ─── 성취기준 ───
export const Standards = {
  list: () => [...standards.values()],

  search: ({ q, subject, grade, domain, school_level }) => {
    let results = [...standards.values()]
    if (subject) results = results.filter(s => s.subject === subject)
    if (grade) results = results.filter(s => s.grade_group === grade)
    if (domain) results = results.filter(s => s.domain === domain)
    if (school_level) results = results.filter(s => s.school_level === school_level)
    if (q) {
      const query = q.toLowerCase()
      results = results.filter(s =>
        s.content.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        (s.keywords || []).some(k => k.toLowerCase().includes(query)) ||
        s.area.toLowerCase().includes(query) ||
        (s.explanation || '').toLowerCase().includes(query)
      )
    }
    return results.slice(0, 50)
  },

  get: (id) => standards.get(id) || null,
  getByCode: (code) => [...standards.values()].find(s => s.code === code) || null,
  subjects: () => [...new Set([...standards.values()].map(s => s.subject))].sort(),
  gradeGroups: () => [...new Set([...standards.values()].map(s => s.grade_group))].sort(),
  schoolLevels: () => [...new Set([...standards.values()].map(s => s.school_level).filter(Boolean))].sort(),
}

// ─── 성취기준 연결(그래프) ───
export const StandardLinks = {
  list: () => [...standardLinks.values()],

  getByStandard: (standardId) =>
    [...standardLinks.values()].filter(l => l.source_id === standardId || l.target_id === standardId),

  getGraph: () => {
    const nodes = [...standards.values()].map(s => ({
      id: s.id, code: s.code, subject: s.subject,
      subject_group: s.subject_group || s.subject,
      grade_group: s.grade_group, area: s.area,
      content: s.content, domain: s.domain || '',
      school_level: s.school_level || '',
      curriculum_category: s.curriculum_category || '',
      explanation: s.explanation || '',
    }))
    const links = [...standardLinks.values()].map(l => ({
      source: l.source_id, target: l.target_id,
      link_type: l.link_type, rationale: l.rationale,
    }))
    return { nodes, links }
  },
}
