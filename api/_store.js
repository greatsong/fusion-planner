/**
 * Vercel Serverless용 인메모리 데이터 저장소
 * Cold start 시 한 번만 초기화되고 같은 Lambda 인스턴스에서 재사용
 */
import crypto from 'crypto'
import { ALL_STANDARDS } from '../server/data/standards.js'
import { SOCIAL_STANDARDS } from '../server/data/standards_social.js'
import { GENERATED_LINKS } from '../server/data/generatedLinks.js'

let initialized = false
const standards = new Map()
const standardLinks = new Map()

function uuid() { return crypto.randomUUID() }

function ensureInit() {
  if (initialized) return
  initialized = true

  const seenCodes = new Set()
  const socialFixed = SOCIAL_STANDARDS.map(s => ({ ...s, subject_group: '사회' }))
  const mergedStandards = [...ALL_STANDARDS, ...socialFixed]

  for (const s of mergedStandards) {
    if (seenCodes.has(s.code)) continue
    seenCodes.add(s.code)
    const id = uuid()
    standards.set(id, { id, ...s, created_at: new Date().toISOString() })
  }

  const codeToStd = new Map()
  for (const [, s] of standards) codeToStd.set(s.code, s)

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
        id, source_id: sourceStd.id, target_id: targetStd.id,
        source_code: src, target_code: tgt, link_type: lt,
        rationale: rationale || '',
        similarity: lt === 'same_concept' ? 0.9 : lt === 'prerequisite' ? 0.85 : 0.7,
        created_at: now,
      })
    }
  }
}

export function getStandards() {
  ensureInit()
  return standards
}

export function getStandardLinks() {
  ensureInit()
  return standardLinks
}

export function searchStandards({ q, subject, grade, domain, school_level }) {
  ensureInit()
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
}

export function getGraph() {
  ensureInit()
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
}
