/**
 * 검색 결과 컴포넌트
 * 교과군별 그룹으로 결과를 표시 (관련도 순)
 */
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { SUBJECT_COLORS, sortByGroupOrder } from '../../../shared/constants.js'
import StandardCard from './StandardCard.jsx'

function GroupSection({ group, items, color, onSelectStandard }) {
  const [expanded, setExpanded] = useState(false)
  const INITIAL_COUNT = 5
  const hasMore = items.length > INITIAL_COUNT
  const visibleItems = expanded ? items : items.slice(0, INITIAL_COUNT)
  const remaining = items.length - INITIAL_COUNT

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="font-semibold text-gray-700">{group}</h3>
        <span className="text-xs text-gray-400">{items.length}건</span>
      </div>
      <div className="space-y-2 ml-5">
        {visibleItems.map(item => (
          <StandardCard
            key={item.code}
            standard={item}
            similarity={item.similarity}
            onSelect={onSelectStandard}
            compact
          />
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 pl-2 py-1 transition-colors">
            {expanded ? (
              <><ChevronUp size={14} /> 접기</>
            ) : (
              <><ChevronDown size={14} /> +{remaining}건 더 보기</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SearchResults({ grouped, totalResults, elapsed, searchMode, onSelectStandard }) {
  if (!grouped || Object.keys(grouped).length === 0) return null

  // 그룹 내 항목을 유사도 내림차순 정렬 + 교과군을 관련성 순으로 정렬
  // 관련성 점수 = 상위 3개 평균 유사도 (한 건만 높은 것보다 여러 건 높은 교과가 위로)
  const groupScore = (items) => {
    const sorted = [...items].sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    const top = sorted.slice(0, 3)
    return top.reduce((sum, item) => sum + (item.similarity || 0), 0) / top.length
  }

  // 각 그룹 내 항목 정렬
  for (const group of Object.keys(grouped)) {
    grouped[group].sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  }

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const scoreA = groupScore(grouped[a])
    const scoreB = groupScore(grouped[b])
    if (scoreB !== scoreA) return scoreB - scoreA
    return sortByGroupOrder(a, b)
  })

  return (
    <div className="space-y-6">
      {/* 검색 결과 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{totalResults}개</span> 성취기준 발견
          {elapsed && <span className="ml-1 text-gray-400">({elapsed})</span>}
        </p>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
          {searchMode === 'hybrid' ? '🔮🔍 하이브리드' : searchMode === 'vector' ? '🔮 벡터 검색' : '🔍 키워드 검색'}
        </span>
      </div>

      {/* 교과군별 그룹 */}
      {sortedGroups.map(group => (
        <GroupSection
          key={group}
          group={group}
          items={grouped[group]}
          color={SUBJECT_COLORS[group] || '#64748b'}
          onSelectStandard={onSelectStandard}
        />
      ))}
    </div>
  )
}
