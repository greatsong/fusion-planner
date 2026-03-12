/**
 * 성취기준 카드 컴포넌트
 * 검색 결과와 이웃 목록에서 재사용
 */
import { ChevronDown, ChevronUp, Plus, Check, Link2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { SUBJECT_COLORS } from '../../../shared/constants.js'
import { useBasketStore } from '../stores/basketStore.js'

export default function StandardCard({ standard, similarity, onSelect, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  const { add, remove, has } = useBasketStore()
  const inBasket = has(standard.code)

  const color = SUBJECT_COLORS[standard.subject_group] || '#64748b'

  const toggleBasket = (e) => {
    e.stopPropagation()
    if (inBasket) remove(standard.code)
    else add(standard)
  }

  const handleClick = () => {
    if (onSelect) onSelect(standard)
    else setExpanded(!expanded)
  }

  return (
    <div className={`group bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all ${expanded ? 'ring-1 ring-blue-200' : ''}`}>
      <div className="p-3 cursor-pointer" onClick={handleClick}>
        {/* 상단: 코드 + 메타 + 유사도 + 액션 */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <code className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex-shrink-0">
              {standard.code}
            </code>
            <span className="text-xs text-gray-400 truncate">{standard.subject}</span>
            {standard.grade_group && (
              <span className="text-xs text-gray-400 flex-shrink-0">· {standard.grade_group}</span>
            )}
            {similarity !== undefined && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium flex-shrink-0">
                {(similarity * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={toggleBasket}
              className={`p-1.5 rounded-lg transition-colors ${inBasket ? 'bg-blue-100 text-blue-600' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-400'}`}
              title={inBasket ? '바구니에서 제거' : '바구니에 추가'}>
              {inBasket ? <Check size={16} /> : <Plus size={16} />}
            </button>
            {onSelect && (
              <button onClick={(e) => { e.stopPropagation(); onSelect(standard) }}
                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-400 transition-all"
                title="연결 탐색">
                <Link2 size={16} />
              </button>
            )}
            {!onSelect && (
              <button onClick={handleClick} className="p-1 text-gray-400">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>
        {/* 본문 */}
        <p className={`text-sm text-gray-700 leading-relaxed ${compact && !expanded ? 'line-clamp-2' : ''}`}>
          {standard.content}
        </p>
      </div>

      {/* 확장된 상세 */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100 mt-0">
          <div className="pt-3 space-y-2">
            {standard.area && (
              <div className="flex gap-2 text-xs">
                <span className="text-gray-400 w-14">영역</span>
                <span className="text-gray-600">{[standard.domain, standard.area].filter(Boolean).join(' > ')}</span>
              </div>
            )}
            {standard.school_level && (
              <div className="flex gap-2 text-xs">
                <span className="text-gray-400 w-14">학교급</span>
                <span className="text-gray-600">{standard.school_level} · {standard.curriculum_category || ''}</span>
              </div>
            )}
            {standard.keywords?.length > 0 && (
              <div className="flex gap-2 text-xs">
                <span className="text-gray-400 w-14">키워드</span>
                <div className="flex flex-wrap gap-1">
                  {standard.keywords.map(k => (
                    <span key={k} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{k}</span>
                  ))}
                </div>
              </div>
            )}
            {standard.explanation && (
              <div className="text-xs mt-2">
                <span className="text-gray-400">해설</span>
                <p className="text-gray-600 mt-1 leading-relaxed">{standard.explanation.substring(0, 300)}{standard.explanation.length > 300 ? '...' : ''}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
