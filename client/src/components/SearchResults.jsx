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

  // 교과군을 최고 유사도 순으로 정렬 (가장 관련 높은 교과군이 위로)
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const maxA = Math.max(...grouped[a].map(item => item.similarity || 0))
    const maxB = Math.max(...grouped[b].map(item => item.similarity || 0))
    if (maxB !== maxA) return maxB - maxA
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
          {searchMode === 'vector' ? '🔮 벡터 검색' : '🔍 키워드 검색'}
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
