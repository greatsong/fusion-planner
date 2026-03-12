/**
 * 검색 홈 페이지
 * 첫 화면 = 검색. 자연어 검색 → 교과군별 결과 → 상세 → 바구니 → AI 설계
 */
import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, BookOpen, Grid3x3, Sparkles, Zap, BarChart3, ArrowRight, HelpCircle } from 'lucide-react'
import SearchBar from '../components/SearchBar.jsx'
import SearchResults from '../components/SearchResults.jsx'
import StandardDetail from '../components/StandardDetail.jsx'
import FusionBasket from '../components/FusionBasket.jsx'
import DesignPanel from '../components/DesignPanel.jsx'
import { useSearchStore } from '../stores/searchStore.js'
import { useBasketStore } from '../stores/basketStore.js'
import { SUBJECT_COLORS, GROUP_ORDER } from '../../../shared/constants.js'

const POPULAR_QUERIES = [
  '인공지능과 윤리',
  '기후변화와 환경',
  '데이터 분석과 통계',
  '민주주의와 시민 참여',
  '생명과학과 생명윤리',
  '에너지와 지속가능한 발전',
]

export default function SearchPage() {
  const {
    query, filters, grouped, totalResults, elapsed, searchMode,
    isSearching, error, search, setFilter
  } = useSearchStore()

  const [selectedStandard, setSelectedStandard] = useState(null)
  const [designOpen, setDesignOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = useCallback((q) => {
    search(q, filters)
    setSelectedStandard(null)
  }, [filters])

  const handleFilterChange = useCallback((key, value) => {
    setFilter(key, value)
  }, [])

  const handleSelectStandard = useCallback((standard) => {
    setSelectedStandard(standard)
  }, [])

  const hasResults = totalResults > 0
  const isEmpty = !isSearching && !hasResults && query

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-700">융합교육 설계도구</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              <HelpCircle size={16} />
              사용안내
            </Link>
            <Link to="/matrix"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors">
              <Grid3x3 size={16} />
              매트릭스
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4">
        {/* 검색 영역 */}
        <div className={`transition-all duration-500 ${hasResults || isEmpty ? 'pt-6' : 'pt-20 md:pt-32'}`}>
          {/* 타이틀 (검색 전만 표시) */}
          {!hasResults && !isEmpty && !isSearching && (
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                어떤 수업을 설계하고 싶으세요?
              </h1>
              <p className="text-gray-500 text-lg">
                2,796개 성취기준에서 교과를 넘나드는 융합 수업 아이디어를 발견하세요
              </p>
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            <SearchBar
              query={query}
              filters={filters}
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              isSearching={isSearching}
            />
          </div>

          {/* 추천 검색어 (검색 전만 표시) */}
          {!hasResults && !isEmpty && !isSearching && (
            <div className="max-w-3xl mx-auto mt-6">
              <p className="text-xs text-gray-400 mb-2">추천 검색어</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_QUERIES.map(q => (
                  <button key={q}
                    onClick={() => handleSearch(q)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors">
                    {q}
                  </button>
                ))}
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-3 gap-4 mt-12">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-700">2,796</p>
                  <p className="text-xs text-gray-400">성취기준</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} className="text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-700">14</p>
                  <p className="text-xs text-gray-400">교과군</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Zap size={20} className="text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-700">AI</p>
                  <p className="text-xs text-gray-400">융합 설계</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="max-w-3xl mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 검색 결과 + 상세 패널 */}
        {(hasResults || isSearching) && (
          <div className={`mt-6 ${selectedStandard ? 'grid grid-cols-[1fr_420px] gap-6' : ''}`}>
            {/* 결과 목록 */}
            <div className={`${!selectedStandard ? 'max-w-4xl mx-auto' : 'min-w-0'}`}>
              {isSearching ? (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-400">
                    <div className="w-5 h-5 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                    <span>검색 중...</span>
                  </div>
                </div>
              ) : (
                <SearchResults
                  grouped={grouped}
                  totalResults={totalResults}
                  elapsed={elapsed}
                  searchMode={searchMode}
                  onSelectStandard={handleSelectStandard}
                />
              )}
            </div>

            {/* 상세 패널 */}
            {selectedStandard && (
              <div className="sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
                <StandardDetail
                  standard={selectedStandard}
                  onClose={() => setSelectedStandard(null)}
                  onSelectNeighbor={(s) => setSelectedStandard(s)}
                />
              </div>
            )}
          </div>
        )}

        {/* 빈 결과 */}
        {isEmpty && (
          <div className="max-w-3xl mx-auto mt-8 text-center py-12">
            <Search size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 text-lg mb-2">"{query}"에 대한 결과가 없습니다</p>
            <p className="text-gray-400 text-sm">다른 키워드로 검색해보세요</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {POPULAR_QUERIES.slice(0, 3).map(q => (
                <button key={q} onClick={() => handleSearch(q)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-500 hover:border-blue-200 hover:text-blue-600 transition-colors">
                  {q} <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 융합 바구니 */}
      <FusionBasket onDesign={() => setDesignOpen(true)} />

      {/* AI 설계 패널 */}
      <DesignPanel open={designOpen} onClose={() => setDesignOpen(false)} />

      {/* 푸터 */}
      {!hasResults && !isEmpty && !isSearching && (
        <footer className="max-w-7xl mx-auto px-4 py-8 mt-12 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            2022 개정 교육과정 기반 · AI 융합교육 설계 도구
          </p>
        </footer>
      )}
    </div>
  )
}
