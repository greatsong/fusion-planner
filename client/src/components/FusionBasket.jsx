/**
 * 융합 바구니 컴포넌트
 * 우하단 플로팅 패널 — 선택된 성취기준 표시 + AI 설계 트리거
 */
import { useState } from 'react'
import { ShoppingBag, X, ChevronUp, ChevronDown, Sparkles, Trash2 } from 'lucide-react'
import { SUBJECT_COLORS } from '../../../shared/constants.js'
import { useBasketStore } from '../stores/basketStore.js'

export default function FusionBasket({ onDesign }) {
  const { items, remove, clear, canDesign, subjectGroupCount } = useBasketStore()
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const groups = {}
  for (const item of items) {
    const g = item.subject_group || '기타'
    if (!groups[g]) groups[g] = []
    groups[g].push(item)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingBag size={20} className="text-blue-600" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {items.length}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">융합 바구니</p>
              <p className="text-xs text-gray-400">{subjectGroupCount()}개 교과</p>
            </div>
          </div>
          {expanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
        </button>

        {/* 펼침 영역 */}
        {expanded && (
          <div className="border-t border-gray-100">
            <div className="p-3 max-h-64 overflow-y-auto space-y-2">
              {Object.entries(groups).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[group] || '#64748b' }} />
                    <span className="text-xs font-medium text-gray-400">{group}</span>
                  </div>
                  {groupItems.map(item => (
                    <div key={item.code}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group">
                      <code className="text-xs text-blue-600 font-mono flex-shrink-0">{item.code}</code>
                      <p className="text-xs text-gray-600 line-clamp-1 flex-1">{item.content}</p>
                      <button onClick={() => remove(item.code)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* 액션 */}
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <button onClick={clear}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> 비우기
              </button>
              <button onClick={onDesign}
                disabled={!canDesign()}
                className="flex-1 flex items-center gap-2 justify-center px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
                <Sparkles size={16} />
                AI 융합 수업 설계
              </button>
            </div>
            {!canDesign() && items.length > 0 && (
              <p className="px-3 pb-3 text-xs text-amber-600">
                💡 2개 이상 교과의 성취기준을 추가하면 AI 설계가 가능합니다
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
