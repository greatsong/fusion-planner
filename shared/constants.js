export const LINK_TYPES = {
  cross_subject: { label: '교과연계', color: '#f59e0b' },
  same_concept: { label: '동일개념', color: '#3b82f6' },
  prerequisite: { label: '선수학습', color: '#ef4444' },
  application: { label: '적용', color: '#22c55e' },
  extension: { label: '확장', color: '#a855f7' },
}

// 한국 교육과정 표준 교과 순서
export const GROUP_ORDER = [
  '국어', '수학', '영어', '사회', '도덕', '과학',
  '체육', '음악', '미술', '기술·가정', '실과(기술·가정)/정보', '실과',
  '정보', '제2외국어', '한문', '교양',
]

export const SUBJECT_COLORS = {
  '국어': '#ef4444', '수학': '#3b82f6', '영어': '#6366f1',
  '사회': '#eab308', '도덕': '#f97316', '과학': '#22c55e',
  '체육': '#84cc16', '음악': '#8b5cf6', '미술': '#ec4899',
  '기술·가정': '#a855f7', '실과(기술·가정)/정보': '#a855f7', '실과': '#14b8a6',
  '정보': '#06b6d4', '제2외국어': '#0891b2', '한문': '#14b8a6',
  '교양': '#64748b',
}

// 교과군 정렬 유틸리티
export function sortByGroupOrder(a, b) {
  const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b)
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
}
