import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Grid3X3, Search, ArrowRight, Link2, Layers, BarChart3, Map } from 'lucide-react'
import { apiGet } from '../lib/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ standards: 0, links: 0, subjects: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const graph = await apiGet('/api/standards/graph')
        const subjects = new Set((graph.nodes || []).map(n => n.subject_group).filter(Boolean))
        setStats({
          standards: graph.nodes?.length || 0,
          links: graph.links?.length || 0,
          subjects: subjects.size,
        })
      } catch (err) {
        console.error('통계 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tools = [
    {
      icon: BookOpen,
      title: '연계 탐색기',
      description: '성취기준을 검색하고, 교과 간 연결을 아코디언으로 드릴다운 탐색합니다. AI가 융합 수업 내러티브를 생성합니다.',
      path: '/explorer',
      color: '#0d9488',
      badge: 'AI 내러티브',
      badgeBg: '#f0fdfa',
      badgeText: '#0d9488',
      borderColor: '#0d9488',
    },
    {
      icon: Grid3X3,
      title: '연계 매트릭스',
      description: '교과 간 연결을 히트맵 매트릭스로 한눈에 파악합니다. CSV 내보내기와 인쇄를 지원합니다.',
      path: '/matrix',
      color: '#f97316',
      badge: '인쇄·내보내기',
      badgeBg: '#fff7ed',
      badgeText: '#ea580c',
      borderColor: '#f97316',
    },
    {
      icon: Map,
      title: '교과 지도',
      description: '교과군별 선택과목 위계를 한눈에 보고, AI가 융합 수업 소재를 추천합니다.',
      path: '/subject-map',
      color: '#8b5cf6',
      badge: 'AI 추천',
      badgeBg: '#f5f3ff',
      badgeText: '#7c3aed',
      borderColor: '#8b5cf6',
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)]">
      {/* 헤더 — 가볍고 깔끔한 디자인 */}
      <header className="bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            {/* 좌측: 타이틀 */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-1.5 h-8 rounded-full bg-[var(--color-primary)]" />
                <span className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">2022 개정 교육과정</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">
                AI 융합교육 설계 도구
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-1.5 text-[15px]">
                교과 간 연결을 탐색하고, AI와 함께 융합 수업을 설계하세요
              </p>
            </div>

            {/* 우측: 통계 인라인 */}
            {!loading && (
              <div className="flex items-center gap-3 sm:gap-4">
                {[
                  { label: '성취기준', value: stats.standards.toLocaleString(), icon: Layers },
                  { label: '교과 연결', value: stats.links.toLocaleString(), icon: Link2 },
                  { label: '교과군', value: stats.subjects, icon: BarChart3 },
                ].map(item => (
                  <div key={item.label}
                    className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface-dim)] rounded-lg border border-[var(--color-border)]">
                    <item.icon size={14} className="text-[var(--color-primary)] shrink-0" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums leading-none">{item.value}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)] hidden sm:inline">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 도구 카드 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map(tool => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="group bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left overflow-hidden"
            >
              {/* 상단 컬러 바 */}
              <div className="h-1" style={{ backgroundColor: tool.borderColor }} />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border-2 transition-colors duration-200"
                    style={{ borderColor: tool.color, color: tool.color }}>
                    <tool.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-[17px] font-bold text-[var(--color-text-primary)] tracking-[-0.015em]">
                        {tool.title}
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                        style={{ backgroundColor: tool.badgeBg, color: tool.badgeText }}>
                        {tool.badge}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{tool.description}</p>
                  </div>
                  <ArrowRight size={18} className="text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform mt-1 shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 빠른 검색 */}
        <div className="mt-8 bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-md bg-[var(--color-surface-dim)] flex items-center justify-center">
              <Search size={14} className="text-[var(--color-text-muted)]" />
            </div>
            <h3 className="font-semibold text-[var(--color-text-primary)] text-[15px]">빠른 검색</h3>
          </div>
          <QuickSearch onSelect={(code) => navigate(`/explorer?code=${code}`)} />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="text-center py-8 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
        AI 융합교육 설계 도구 · 2022 개정 교육과정 · Built with Claude Code
      </footer>
    </div>
  )
}

// 빠른 검색 컴포넌트
function QuickSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const SUBJECT_COLORS = {
    '과학': '#22c55e', '수학': '#3b82f6', '국어': '#ef4444',
    '사회': '#eab308', '도덕': '#f97316', '기술·가정': '#a855f7',
    '정보': '#06b6d4', '미술': '#ec4899', '체육': '#84cc16',
    '음악': '#8b5cf6', '영어': '#6366f1', '한문': '#14b8a6',
  }

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await apiGet('/api/standards/search', { q: query })
        setResults(data.slice(0, 8))
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="성취기준 코드, 내용, 교과명으로 검색 (예: 과학, 생태계, [4과11-03])"
        className="w-full px-4 py-3 bg-[var(--color-surface-dim)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] focus:bg-white text-sm transition"
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {results.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.code)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-teal-50 transition text-left group"
            >
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded shrink-0"
                style={{ backgroundColor: SUBJECT_COLORS[s.subject_group] || '#6b7280' }}
              >
                {s.subject_group}
              </span>
              <span className="text-xs font-mono font-bold text-[var(--color-primary)] shrink-0">{s.code}</span>
              <span className="text-xs text-[var(--color-text-secondary)] truncate flex-1">{s.content}</span>
              <ArrowRight size={12} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
