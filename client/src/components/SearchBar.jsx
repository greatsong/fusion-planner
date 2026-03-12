/**
 * 검색 입력 컴포넌트
 * 자연어 검색 입력 + 필터 칩
 */
import { useState, useRef, useEffect } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { GROUP_ORDER, SUBJECT_COLORS } from '../../../shared/constants.js'

const SCHOOL_LEVELS = ['초등학교', '중학교', '고등학교']

export default function SearchBar({ query, filters, onSearch, onFilterChange, isSearching }) {
  const [input, setInput] = useState(query || '')
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { setInput(query || '') }, [query])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(input.trim())
  }

  const handleClear = () => {
    setInput('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="w-full">
      {/* 검색 입력 */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 pointer-events-none" size={22} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="어떤 수업을 설계하고 싶으세요? (예: 인공지능과 환경, 기후변화)"
            className="w-full pl-12 pr-28 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white shadow-sm"
            autoFocus
          />
          <div className="absolute right-3 flex items-center gap-2">
            {input && (
              <button type="button" onClick={handleClear}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            )}
            <button type="button" onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}>
              <SlidersHorizontal size={18} />
            </button>
            <button type="submit" disabled={isSearching || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm">
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      </form>

      {/* 필터 영역 */}
      {showFilters && (
        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
          {/* 학교급 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">학교급</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onFilterChange('school_level', '')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!filters.school_level ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                전체
              </button>
              {SCHOOL_LEVELS.map(level => (
                <button key={level}
                  onClick={() => onFilterChange('school_level', level === filters.school_level ? '' : level)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filters.school_level === level ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                  {level}
                </button>
              ))}
            </div>
          </div>
          {/* 교과군 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">교과군</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onFilterChange('subject_group', '')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!filters.subject_group ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                전체
              </button>
              {GROUP_ORDER.slice(0, 13).map(group => (
                <button key={group}
                  onClick={() => onFilterChange('subject_group', group === filters.subject_group ? '' : group)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors border`}
                  style={filters.subject_group === group
                    ? { backgroundColor: SUBJECT_COLORS[group] || '#64748b', color: 'white', borderColor: 'transparent' }
                    : { backgroundColor: 'white', borderColor: '#e5e7eb', color: '#4b5563' }}>
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
