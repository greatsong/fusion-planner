import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Grid3X3, Search, ArrowRight, Link2, Layers, BarChart3 } from 'lucide-react'
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
      color: 'var(--color-primary)',
      colorLight: 'var(--color-primary-light)',
      badge: 'AI 내러티브',
    },
    {
      icon: Grid3X3,
      title: '연계 매트릭스',
      description: '교과 간 연결을 히트맵 매트릭스로 한눈에 파악합니다. CSV 내보내기와 인쇄를 지원합니다.',
      path: '/matrix',
      color: 'var(--color-success)',
      colorLight: '#34d399',
      badge: '인쇄·내보내기',
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)]">
      {/* 히어로 */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] via-indigo-600 to-[var(--color-primary-dark)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.10),transparent_50%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm mb-5">
              <Link2 size={14} />
              2022 개정 교육과정 기반
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              AI 융합교육 설계 도구
            </h1>
            <p className="text-lg text-white/65 max-w-2xl mx-auto leading-relaxed">
              교과 간 연결을 탐색하고, AI와 함께 융합 수업을 설계하세요
            </p>

            {/* 통계 */}
            {!loading && (
              <div className="mt-10 flex justify-center gap-8 sm:gap-12">
                {[
                  { label: '성취기준', value: stats.standards.toLocaleString(), icon: Layers },
                  { label: '교과 연결', value: stats.links.toLocaleString(), icon: Link2 },
                  { label: '교과군', value: stats.subjects, icon: BarChart3 },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <item.icon size={16} className="text-white/40" />
                      <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{item.value}</span>
                    </div>
                    <span className="text-xs text-white/45 tracking-wide">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 도구 카드 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {tools.map(tool => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="group bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${tool.color}, ${tool.colorLight})` }}>
                  <tool.icon size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition">
                      {tool.title}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-[var(--color-primary)] rounded-full">
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{tool.description}</p>
                </div>
                <ArrowRight size={20} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all mt-1 shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {/* 빠른 검색 */}
        <div className="mt-10 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Search size={18} className="text-[var(--color-text-muted)]" />
            <h3 className="font-semibold text-[var(--color-text-secondary)]">빠른 검색</h3>
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
        className="w-full px-4 py-3 bg-[var(--color-surface-dim)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-[var(--color-surface)] text-sm transition"
      />
      {results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s.code)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-indigo-50 transition text-left group"
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
