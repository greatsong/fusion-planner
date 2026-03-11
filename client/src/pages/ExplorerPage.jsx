import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, X, ChevronRight, ChevronDown, ChevronUp,
  ArrowLeft, Home, Link2, Filter, BookOpen, Sparkles, Loader2, RotateCcw, Grid3X3
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { apiGet, API_BASE } from '../lib/api'

const SUBJECT_COLORS = {
  '과학': '#22c55e', '수학': '#3b82f6', '국어': '#ef4444',
  '사회': '#eab308', '도덕': '#f97316', '기술·가정': '#a855f7',
  '정보': '#06b6d4', '실과(기술·가정)/정보': '#a855f7', '실과': '#14b8a6',
  '미술': '#ec4899', '체육': '#84cc16', '음악': '#8b5cf6',
  '영어': '#6366f1', '제2외국어': '#0891b2', '한문': '#14b8a6',
}

const LINK_TYPE_COLORS = {
  cross_subject: '#f59e0b', same_concept: '#3b82f6', prerequisite: '#ef4444',
  application: '#22c55e', extension: '#a855f7',
}

const LINK_TYPE_LABELS = {
  cross_subject: '교과연계', same_concept: '동일개념', prerequisite: '선수학습',
  application: '적용', extension: '확장',
}

export default function ExplorerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [allStandards, setAllStandards] = useState([])
  const [allLinks, setAllLinks] = useState([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedStandard, setSelectedStandard] = useState(null)
  const [breadcrumb, setBreadcrumb] = useState([])
  const [expandedTypes, setExpandedTypes] = useState(new Set(['cross_subject', 'same_concept']))
  const [filterSubject, setFilterSubject] = useState('')
  const [filterLinkType, setFilterLinkType] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // AI 내러티브
  const [narrative, setNarrative] = useState('')
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError, setNarrativeError] = useState('')
  const [showNarrative, setShowNarrative] = useState(false)
  const [narrativeForCode, setNarrativeForCode] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const graph = await apiGet('/api/standards/graph')
        setAllStandards(graph.nodes || [])
        setAllLinks(graph.links || [])
        const codeParam = searchParams.get('code')
        if (codeParam && graph.nodes) {
          const found = graph.nodes.find(n => n.code === codeParam)
          if (found) { setSelectedStandard(found); setBreadcrumb([found]) }
        }
      } catch (err) { console.error('데이터 로드 실패:', err) }
      finally { setLoading(false) }
    }
    load()
  }, []) // eslint-disable-line

  const subjectGroups = useMemo(() => {
    return [...new Set(allStandards.map(s => s.subject_group).filter(Boolean))].sort()
  }, [allStandards])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(allStandards.filter(s =>
      s.code?.toLowerCase().includes(q) || s.content?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q) || s.area?.toLowerCase().includes(q)
    ).slice(0, 20))
  }, [searchQuery, allStandards])

  const connectionsByType = useMemo(() => {
    if (!selectedStandard) return {}
    const nodeId = selectedStandard.id
    const connected = allLinks.filter(l => {
      const sid = typeof l.source === 'object' ? l.source?.id : l.source
      const tid = typeof l.target === 'object' ? l.target?.id : l.target
      return sid === nodeId || tid === nodeId
    })
    const groups = {}
    for (const link of connected) {
      const sid = typeof link.source === 'object' ? link.source?.id : link.source
      const tid = typeof link.target === 'object' ? link.target?.id : link.target
      const neighborId = sid === nodeId ? tid : sid
      const neighbor = allStandards.find(s => s.id === neighborId)
      if (!neighbor) continue
      if (filterSubject && neighbor.subject_group !== filterSubject) continue
      if (filterLinkType && link.link_type !== filterLinkType) continue
      const type = link.link_type || 'cross_subject'
      if (!groups[type]) groups[type] = []
      groups[type].push({ link, neighbor })
    }
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => {
        const subCmp = (a.neighbor.subject_group || '').localeCompare(b.neighbor.subject_group || '')
        return subCmp !== 0 ? subCmp : (a.neighbor.code || '').localeCompare(b.neighbor.code || '')
      })
    }
    return groups
  }, [selectedStandard, allLinks, allStandards, filterSubject, filterLinkType])

  const totalConnections = useMemo(() =>
    Object.values(connectionsByType).reduce((sum, arr) => sum + arr.length, 0),
    [connectionsByType]
  )

  const subjectStats = useMemo(() => {
    const stats = {}
    for (const items of Object.values(connectionsByType))
      for (const { neighbor } of items) stats[neighbor.subject_group || '기타'] = (stats[neighbor.subject_group || '기타'] || 0) + 1
    return Object.entries(stats).sort((a, b) => b[1] - a[1])
  }, [connectionsByType])

  const selectStandard = useCallback((standard) => {
    setSelectedStandard(standard)
    setBreadcrumb(prev => {
      const idx = prev.findIndex(s => s.id === standard.id)
      if (idx >= 0) return prev.slice(0, idx + 1)
      return [...prev, standard]
    })
    setSearchQuery(''); setSearchResults([])
    setSearchParams({ code: standard.code })
    setExpandedTypes(new Set(['cross_subject', 'same_concept']))
    setShowNarrative(false); setNarrative(''); setNarrativeError('')
  }, [setSearchParams])

  const navigateBreadcrumb = useCallback((index) => {
    const target = breadcrumb[index]
    setSelectedStandard(target)
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setSearchParams({ code: target.code })
  }, [breadcrumb, setSearchParams])

  const toggleType = useCallback((type) => {
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type); else next.add(type)
      return next
    })
  }, [])

  const generateNarrative = useCallback(async () => {
    if (!selectedStandard || narrativeLoading) return
    setNarrativeLoading(true); setNarrativeError(''); setNarrative('')
    setShowNarrative(true); setNarrativeForCode(selectedStandard.code)

    const connections = []
    for (const [type, items] of Object.entries(connectionsByType))
      for (const { link, neighbor } of items)
        connections.push({ neighborCode: neighbor.code, subjectGroup: neighbor.subject_group, linkType: type, rationale: link.rationale || '' })

    try {
      const res = await fetch(`${API_BASE}/api/standards/narrative`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardCode: selectedStandard.code, connections }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setNarrativeError(err.error || '알 수 없는 오류'); setNarrativeLoading(false); return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') { setNarrativeLoading(false); return }
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text') setNarrative(prev => prev + parsed.content)
            else if (parsed.type === 'error') setNarrativeError(parsed.message)
          } catch {}
        }
      }
      setNarrativeLoading(false)
    } catch { setNarrativeError('네트워크 연결을 확인해주세요.'); setNarrativeLoading(false) }
  }, [selectedStandard, connectionsByType, narrativeLoading])

  const typeOrder = ['cross_subject', 'same_concept', 'prerequisite', 'application', 'extension']

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-dim)] flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-[var(--color-primary)] animate-pulse" />
          <p className="text-[var(--color-text-muted)]">교육과정 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)]">
      {/* 헤더 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dim)] rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-1 h-6 rounded-full bg-[var(--color-primary)] shrink-0" />
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] truncate tracking-[-0.015em]">교육과정 연계 탐색기</h1>
          </div>
          <button onClick={() => navigate('/matrix')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-text-primary)] text-white rounded-lg hover:opacity-90 transition">
            <Grid3X3 size={14} /> 매트릭스
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* 검색 */}
        <div className="mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="성취기준 코드, 내용, 교과명으로 검색 (예: 과학, [4과11-03], 생태계)"
              className="w-full pl-10 pr-10 py-3 bg-white border border-[var(--color-border)] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm transition"
              autoFocus={!selectedStandard}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"><X size={18} /></button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg max-h-80 overflow-auto">
              {searchResults.map(s => (
                <button key={s.id} onClick={() => selectStandard(s)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-teal-50 transition text-left border-b border-[var(--color-surface-bright)] last:border-0">
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded shrink-0 mt-0.5"
                    style={{ backgroundColor: SUBJECT_COLORS[s.subject_group] || '#6b7280' }}>{s.subject_group}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono font-bold text-[var(--color-primary)]">{s.code}</p>
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">{s.content}</p>
                    {s.area && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.area}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택 전 안내 */}
        {!selectedStandard && searchResults.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[var(--color-border)] mt-4 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-dim)] border-2 border-[var(--color-border)] flex items-center justify-center">
              <BookOpen size={28} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-[var(--color-text-secondary)] mb-1 font-medium">탐색할 성취기준을 검색하세요</p>
            <p className="text-sm text-[var(--color-text-muted)]">성취기준을 선택하면 교과 간 연계를 아코디언 형태로 탐색할 수 있습니다</p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {['과학', '수학', '국어', '사회', '정보', '미술'].map(subject => (
                <button key={subject} onClick={() => setSearchQuery(subject)}
                  className="px-3 py-1.5 text-sm rounded-full border border-[var(--color-border)] hover:bg-teal-50 hover:border-[var(--color-primary-light)] transition"
                  style={{ color: SUBJECT_COLORS[subject] || '#6b7280' }}>{subject}</button>
              ))}
            </div>
          </div>
        )}

        {/* 탐색 영역 */}
        {selectedStandard && (
          <div className="space-y-4">
            {/* 브레드크럼 */}
            {breadcrumb.length > 0 && (
              <nav className="flex items-center gap-1 text-sm overflow-x-auto pb-1">
                <button onClick={() => { setSelectedStandard(null); setBreadcrumb([]); setSearchParams({}) }}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-teal-50 rounded transition shrink-0"><Home size={14} /></button>
                {breadcrumb.map((item, i) => (
                  <span key={item.id} className="flex items-center gap-1 shrink-0">
                    <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                    <button onClick={() => navigateBreadcrumb(i)}
                      className={`px-2 py-0.5 rounded transition whitespace-nowrap ${
                        i === breadcrumb.length - 1 ? 'bg-teal-100 text-[var(--color-primary-dark)] font-medium' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-teal-50'
                      }`}>{item.code}</button>
                  </span>
                ))}
              </nav>
            )}

            {/* 선택 성취기준 카드 */}
            <div className="bg-white rounded-xl border-l-4 p-5 shadow-sm ring-1 ring-[var(--color-border)]"
              style={{ borderLeftColor: SUBJECT_COLORS[selectedStandard.subject_group] || '#6b7280' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-lg font-mono font-bold text-[var(--color-text-primary)]">{selectedStandard.code}</span>
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded"
                    style={{ backgroundColor: SUBJECT_COLORS[selectedStandard.subject_group] || '#6b7280' }}>{selectedStandard.subject_group}</span>
                  {selectedStandard.grade_group && <span className="px-2 py-0.5 text-xs bg-[var(--color-surface-bright)] text-[var(--color-text-secondary)] rounded">{selectedStandard.grade_group}</span>}
                  {selectedStandard.school_level && <span className="px-2 py-0.5 text-xs bg-[var(--color-surface-bright)] text-[var(--color-text-secondary)] rounded">{selectedStandard.school_level}</span>}
                </div>
                <p className="text-[var(--color-text-primary)] leading-relaxed edu-content">{selectedStandard.content}</p>
                {selectedStandard.area && <p className="text-sm text-[var(--color-text-muted)] mt-1">영역: {selectedStandard.area}</p>}
                {selectedStandard.explanation && <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-3">{selectedStandard.explanation}</p>}
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link2 size={14} className="text-[var(--color-text-muted)]" />
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">연결 {totalConnections}개</span>
                  <span className="text-[var(--color-text-muted)]">|</span>
                  {subjectStats.map(([subject, count]) => (
                    <span key={subject} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${SUBJECT_COLORS[subject] || '#6b7280'}15`, color: SUBJECT_COLORS[subject] || '#6b7280' }}>
                      {subject} {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition ${
                  showFilters || filterSubject || filterLinkType ? 'bg-teal-50 border-[var(--color-primary-light)] text-[var(--color-primary)]' : 'bg-white border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]'
                }`}><Filter size={14} />필터{(filterSubject || filterLinkType) && <span className="w-2 h-2 bg-[var(--color-primary)] rounded-full" />}</button>
              <button onClick={() => setExpandedTypes(new Set(typeOrder))} className="px-3 py-1.5 text-xs bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-dim)] transition">모두 펼치기</button>
              <button onClick={() => setExpandedTypes(new Set())} className="px-3 py-1.5 text-xs bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-dim)] transition">모두 접기</button>
            </div>

            {showFilters && (
              <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 space-y-3 shadow-sm">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5 block">교과 필터</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterSubject('')}
                      className={`px-2.5 py-1 text-xs rounded-full transition ${!filterSubject ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-surface-bright)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]'}`}>전체</button>
                    {subjectGroups.map(sg => (
                      <button key={sg} onClick={() => setFilterSubject(filterSubject === sg ? '' : sg)}
                        className={`px-2.5 py-1 text-xs rounded-full transition ${filterSubject === sg ? 'text-white' : 'bg-[var(--color-surface-bright)] hover:opacity-80'}`}
                        style={filterSubject === sg ? { backgroundColor: SUBJECT_COLORS[sg] || '#6b7280' } : { color: SUBJECT_COLORS[sg] || '#6b7280' }}>{sg}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5 block">연결 유형</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setFilterLinkType('')}
                      className={`px-2.5 py-1 text-xs rounded-full transition ${!filterLinkType ? 'bg-[var(--color-text-primary)] text-white' : 'bg-[var(--color-surface-bright)] text-[var(--color-text-secondary)] hover:opacity-80'}`}>전체</button>
                    {typeOrder.map(type => (
                      <button key={type} onClick={() => setFilterLinkType(filterLinkType === type ? '' : type)}
                        className={`px-2.5 py-1 text-xs rounded-full transition ${filterLinkType === type ? 'text-white' : 'bg-[var(--color-surface-bright)] hover:opacity-80'}`}
                        style={filterLinkType === type ? { backgroundColor: LINK_TYPE_COLORS[type] } : { color: LINK_TYPE_COLORS[type] }}>{LINK_TYPE_LABELS[type]}</button>
                    ))}
                  </div>
                </div>
                {(filterSubject || filterLinkType) && (
                  <button onClick={() => { setFilterSubject(''); setFilterLinkType('') }}
                    className="text-xs text-[var(--color-error)] hover:opacity-80 transition">필터 초기화</button>
                )}
              </div>
            )}

            {/* 아코디언 */}
            <div className="space-y-2">
              {typeOrder.map(type => {
                const items = connectionsByType[type]
                if (!items || items.length === 0) return null
                const isExpanded = expandedTypes.has(type)
                const bySubject = {}
                for (const item of items) { const sg = item.neighbor.subject_group || '기타'; if (!bySubject[sg]) bySubject[sg] = []; bySubject[sg].push(item) }

                return (
                  <div key={type} className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                    <button onClick={() => toggleType(type)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-dim)] transition text-left">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: LINK_TYPE_COLORS[type] }} />
                      <span className="font-medium text-[var(--color-text-primary)] flex-1">{LINK_TYPE_LABELS[type] || type}</span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ backgroundColor: `${LINK_TYPE_COLORS[type]}20`, color: LINK_TYPE_COLORS[type] }}>{items.length}</span>
                      {isExpanded ? <ChevronUp size={16} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-text-muted)]" />}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-[var(--color-border)]">
                        {Object.entries(bySubject).map(([subject, subItems]) => (
                          <div key={subject}>
                            {Object.keys(bySubject).length > 1 && (
                              <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                                style={{ backgroundColor: `${SUBJECT_COLORS[subject] || '#6b7280'}08`, color: SUBJECT_COLORS[subject] || '#6b7280' }}>
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[subject] || '#6b7280' }} />
                                {subject} ({subItems.length})
                              </div>
                            )}
                            {subItems.map(({ link, neighbor }) => (
                              <button key={neighbor.id} onClick={() => selectStandard(neighbor)}
                                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-teal-50 transition text-left border-b border-[var(--color-surface-dim)] last:border-0 group">
                                <span className="w-1 self-stretch rounded-full shrink-0 mt-1" style={{ backgroundColor: SUBJECT_COLORS[neighbor.subject_group] || '#6b7280' }} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="text-sm font-mono font-bold text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)]">{neighbor.code}</span>
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-white rounded"
                                      style={{ backgroundColor: SUBJECT_COLORS[neighbor.subject_group] || '#6b7280' }}>{neighbor.subject_group}</span>
                                    {neighbor.grade_group && <span className="text-[10px] text-[var(--color-text-muted)]">{neighbor.grade_group}</span>}
                                  </div>
                                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{neighbor.content}</p>
                                  {link.rationale && (
                                    <p className="text-xs text-[var(--color-accent)] mt-1 flex items-start gap-1">
                                      <span className="shrink-0">*</span><span className="line-clamp-2">{link.rationale}</span>
                                    </p>
                                  )}
                                </div>
                                <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] mt-1 shrink-0 transition" />
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {totalConnections === 0 && (
              <div className="text-center py-8 bg-white rounded-xl border border-[var(--color-border)]">
                <Link2 size={32} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
                <p className="text-[var(--color-text-muted)]">{filterSubject || filterLinkType ? '필터 조건에 맞는 연결이 없습니다' : '이 성취기준에 연결된 항목이 없습니다'}</p>
              </div>
            )}

            {/* AI 내러티브 — 프리미엄 디자인 */}
            {totalConnections > 0 && (
              <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                {!showNarrative ? (
                  <button onClick={generateNarrative} disabled={narrativeLoading}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-4 hover:bg-teal-50 transition text-sm font-semibold text-[var(--color-primary)] group">
                    <div className="w-7 h-7 rounded-md bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition">
                      <Sparkles size={14} className="text-[var(--color-primary)]" />
                    </div>
                    AI 융합 수업 내러티브 생성
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-surface-dim)] border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-primary)]">
                        <div className="w-6 h-6 rounded-md bg-teal-100 flex items-center justify-center">
                          <Sparkles size={12} className="text-[var(--color-primary)]" />
                        </div>
                        AI 융합 수업 내러티브
                        {narrativeForCode && <span className="text-xs text-[var(--color-text-muted)] font-normal">({narrativeForCode})</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {!narrativeLoading && <button onClick={generateNarrative} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-teal-100 rounded transition" title="다시 생성"><RotateCcw size={14} /></button>}
                        <button onClick={() => setShowNarrative(false)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bright)] rounded transition" title="닫기"><X size={14} /></button>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      {narrativeLoading && !narrative && (
                        <div className="flex items-center gap-2 text-sm text-[var(--color-primary)] py-4 justify-center">
                          <Loader2 size={16} className="animate-spin" /> AI가 연결을 분석하고 있습니다...
                        </div>
                      )}
                      {narrative && (
                        <div className="prose prose-sm max-w-none prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-li:text-[var(--color-text-secondary)] prose-strong:text-[var(--color-text-primary)] edu-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{narrative}</ReactMarkdown>
                          {narrativeLoading && <span className="inline-block w-2 h-4 bg-[var(--color-primary-light)] animate-pulse rounded-sm ml-0.5" />}
                        </div>
                      )}
                      {narrativeError && <div className="text-sm text-[var(--color-error)] bg-red-50 rounded-lg px-3 py-2 mt-2">{narrativeError}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">교육과정 성취기준 {allStandards.length}개 · 연결 {allLinks.length}개</p>
        </div>
      </main>
    </div>
  )
}
