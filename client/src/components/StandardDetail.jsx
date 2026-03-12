/**
 * 성취기준 상세 + 의미 이웃 패널
 * 특정 성취기준을 선택했을 때 오른쪽에 표시
 */
import { useEffect } from 'react'
import { X, Loader2, Link2, Plus, Check } from 'lucide-react'
import { SUBJECT_COLORS, sortByGroupOrder } from '../../../shared/constants.js'
import { useSearchStore } from '../stores/searchStore.js'
import { useBasketStore } from '../stores/basketStore.js'
import StandardCard from './StandardCard.jsx'

export default function StandardDetail({ standard, onClose, onSelectNeighbor }) {
  const { neighbors, neighborsLoading, fetchNeighbors, clearNeighbors } = useSearchStore()
  const { add, remove, has } = useBasketStore()
  const inBasket = has(standard.code)
  const color = SUBJECT_COLORS[standard.subject_group] || '#64748b'

  useEffect(() => {
    fetchNeighbors(standard.code)
    return () => clearNeighbors()
  }, [standard.code])

  const toggleBasket = () => {
    if (inBasket) remove(standard.code)
    else add(standard)
  }

  // 이웃 교과군별 그룹
  const neighborGroups = neighbors?.grouped || {}
  const sortedNeighborGroups = Object.keys(neighborGroups).sort(sortByGroupOrder)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100" style={{ borderTopColor: color, borderTopWidth: 3 }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium text-white"
                style={{ backgroundColor: color }}>
                {standard.subject_group}
              </span>
              <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {standard.code}
              </code>
              <span className="text-xs text-gray-400">{standard.subject}</span>
            </div>
            <div className="flex gap-2 text-xs text-gray-400 mb-3">
              {standard.grade_group && <span>{standard.grade_group}</span>}
              {standard.school_level && <span>· {standard.school_level}</span>}
              {standard.curriculum_category && <span>· {standard.curriculum_category}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 본문 */}
        <p className="text-sm text-gray-700 leading-relaxed">{standard.content}</p>

        {/* 메타 */}
        {standard.area && (
          <div className="mt-3 text-xs text-gray-400">
            영역: {[standard.domain, standard.area].filter(Boolean).join(' > ')}
          </div>
        )}
        {standard.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {standard.keywords.map(k => (
              <span key={k} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{k}</span>
            ))}
          </div>
        )}

        {/* 해설 */}
        {standard.explanation && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-medium">해설:</span> {standard.explanation.substring(0, 400)}
              {standard.explanation.length > 400 ? '...' : ''}
            </p>
          </div>
        )}

        {/* 바구니 추가 */}
        <button onClick={toggleBasket}
          className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full justify-center ${inBasket
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
          {inBasket ? <><Check size={16} /> 바구니에 추가됨</> : <><Plus size={16} /> 바구니에 추가</>}
        </button>
      </div>

      {/* 의미 이웃 */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link2 size={16} className="text-purple-500" />
          <h3 className="font-semibold text-gray-700 text-sm">의미 연결 — 다른 교과의 유사 성취기준</h3>
        </div>

        {neighborsLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">이웃 탐색 중...</span>
          </div>
        ) : sortedNeighborGroups.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">유사한 다른 교과 성취기준이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {sortedNeighborGroups.map(group => {
              const items = neighborGroups[group]
              const groupColor = SUBJECT_COLORS[group] || '#64748b'
              return (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: groupColor }} />
                    <span className="text-xs font-medium text-gray-500">{group} ({items.length}건)</span>
                  </div>
                  <div className="space-y-1.5 ml-4">
                    {items.slice(0, 5).map(item => (
                      <StandardCard
                        key={item.code}
                        standard={item}
                        similarity={item.similarity}
                        onSelect={onSelectNeighbor}
                        compact
                      />
                    ))}
                    {items.length > 5 && (
                      <p className="text-xs text-gray-400 pl-2">+{items.length - 5}건 더</p>
                    )}
                  </div>
                </div>
              )
            })}
            {neighbors && (
              <p className="text-xs text-gray-400 text-center mt-2">
                {neighbors.mode === 'hybrid' ? '🔮🔍 하이브리드 유사도' : neighbors.mode === 'vector' ? '🔮 벡터 유사도' : '🔍 키워드 유사도'} 기반
                · {neighbors.elapsed}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
