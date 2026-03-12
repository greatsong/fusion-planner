import { ALL_STANDARDS } from '../server/data/standards.js'
import { COMMON_STANDARDS } from '../server/data/standards_common.js'
import { SOCIAL_STANDARDS } from '../server/data/standards_social.js'

const all = [...ALL_STANDARDS, ...SOCIAL_STANDARDS.map(s => ({...s, subject_group: '사회'})), ...COMMON_STANDARDS]
const seen = new Set()
const unique = []
for (const s of all) {
  if (!seen.has(s.code)) { seen.add(s.code); unique.push(s) }
}

const query = '인공지능'
const results = unique.filter(s =>
  s.content.toLowerCase().includes(query) ||
  s.code.toLowerCase().includes(query) ||
  (s.keywords || []).some(k => k.toLowerCase().includes(query)) ||
  (s.area || '').toLowerCase().includes(query) ||
  (s.explanation || '').toLowerCase().includes(query)
)

console.log(`"${query}" 검색 결과: ${results.length}개`)
console.log('')
for (const r of results) {
  console.log(`${r.code} | ${r.subject_group} | ${r.subject} | ${r.content.substring(0, 80)}`)
}

// 정보 과목만 필터
console.log('\n\n=== 정보 과목 중 인공지능 포함 ===')
const infoAI = unique.filter(s =>
  s.subject === '정보' && (
    s.content.includes('인공지능') ||
    (s.keywords || []).some(k => k.includes('인공지능')) ||
    (s.explanation || '').includes('인공지능')
  )
)
for (const r of infoAI) {
  console.log(`${r.code} | ${r.subject} | ${r.content.substring(0, 100)}`)
}
console.log(`정보 인공지능: ${infoAI.length}개`)
