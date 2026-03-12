/**
 * 검색 상태 관리 (Zustand)
 */
import { create } from 'zustand'
import { API_BASE } from '../lib/api.js'

export const useSearchStore = create((set, get) => ({
  // 검색 상태
  query: '',
  filters: {},
  results: [],        // flat 결과 배열
  grouped: {},        // 교과군별 그룹 결과
  totalResults: 0,
  searchMode: '',     // 'vector' or 'keyword'
  elapsed: '',
  isSearching: false,
  error: null,

  // 검색 실행
  search: async (query, filters = {}) => {
    if (!query?.trim()) {
      set({ results: [], grouped: {}, totalResults: 0, error: null, query: '' })
      return
    }

    set({ isSearching: true, error: null, query: query.trim(), filters })

    try {
      const res = await fetch(`${API_BASE}/api/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), filters, limit: 50 }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `검색 오류: ${res.status}`)
      }

      const data = await res.json()
      set({
        results: data.results || [],
        grouped: data.grouped || {},
        totalResults: data.totalResults || 0,
        searchMode: data.mode || '',
        elapsed: data.elapsed || '',
        isSearching: false,
      })
    } catch (err) {
      set({
        error: err.message || '검색 중 오류가 발생했습니다.',
        isSearching: false,
      })
    }
  },

  // 이웃 탐색
  neighbors: null,
  neighborsLoading: false,

  fetchNeighbors: async (code) => {
    set({ neighborsLoading: true })
    try {
      const res = await fetch(`${API_BASE}/api/search/neighbors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, limit: 20, cross_subject_only: true }),
      })

      if (!res.ok) throw new Error('이웃 탐색 실패')
      const data = await res.json()
      set({ neighbors: data, neighborsLoading: false })
    } catch (err) {
      set({ neighborsLoading: false })
    }
  },

  clearNeighbors: () => set({ neighbors: null }),

  // 필터 업데이트
  setFilter: (key, value) => {
    const filters = { ...get().filters }
    if (value) filters[key] = value
    else delete filters[key]
    set({ filters })
    // 자동 재검색
    const q = get().query
    if (q) get().search(q, filters)
  },

  // 초기화
  clear: () => set({
    query: '', filters: {}, results: [], grouped: {},
    totalResults: 0, error: null, neighbors: null,
  }),
}))
