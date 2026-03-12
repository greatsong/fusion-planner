import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Grid3X3, Printer, Download, BookOpen, X, ChevronRight } from 'lucide-react'
import { apiGet } from '../lib/api'

import { SUBJECT_COLORS, sortByGroupOrder } from '../../../shared/constants.js'

const LINK_TYPE_LABELS = {
  cross_subject: '교과연계', same_concept: '동일개념', prerequisite: '선수학습',
  application: '적용', extension: '확장',
}

const LINK_TYPE_COLORS = {
  cross_subject: '#f59e0b', same_concept: '#3b82f6', prerequisite: '#ef4444',
  application: '#22c55e', extension: '#a855f7',
}

function heatColor(count, max) {
  if (count === 0) return 'transparent'
  const ratio = Math.min(count / Math.max(max * 0.6, 1), 1)
  // Teal-based heatmap
  const r = Math.round(240 + (13 - 240) * ratio)
  const g = Math.round(253 + (148 - 253) * ratio)
  const b = Math.round(250 + (136 - 250) * ratio)
  const a = 0.25 + ratio * 0.6
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export default function MatrixPage() {
  const navigate = useNavigate()
  const [allStandards, setAllStandards] = useState([])
  const [allLinks, setAllLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState(null)
  const [filterSchoolLevel, setFilterSchoolLevel] = useState('')
  const [filterLinkType, setFilterLinkType] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const graph = await apiGet('/api/standards/graph')
        setAllStandards(graph.nodes || [])
        setAllLinks(graph.links || [])
      } catch (err) { console.error('데이터 로드 실패:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const schoolLevels = useMemo(() => [...new Set(allStandards.map(s => s.school_level).filter(Boolean))].sort(), [allStandards])

  const filteredStandards = useMemo(() => {
    if (!filterSchoolLevel) return allStandards
    return allStandards.filter(s => s.school_level === filterSchoolLevel)
  }, [allStandards, filterSchoolLevel])

  const filteredLinks = useMemo(() => {
    const stdIds = new Set(filteredStandards.map(s => s.id))
    let links = allLinks.filter(l => {
      const sid = typeof l.source === 'object' ? l.source?.id : l.source
      const tid = typeof l.target === 'object' ? l.target?.id : l.target
      return stdIds.has(sid) && stdIds.has(tid)
    })
    if (filterLinkType) links = links.filter(l => l.link_type === filterLinkType)
    return links
  }, [allLinks, filteredStandards, filterLinkType])

  const subjectGroups = useMemo(() => [...new Set(filteredStandards.map(s => s.subject_group).filter(Boolean))].sort(sortByGroupOrder), [filteredStandards])

  const subjectCounts = useMemo(() => {
    const counts = {}
    for (const s of filteredStandards) counts[s.subject_group || '기타'] = (counts[s.subject_group || '기타'] || 0) + 1
    return counts
  }, [filteredStandards])

  const { matrix, maxCount } = useMemo(() => {
    const stdMap = new Map(filteredStandards.map(s => [s.id, s]))
    const mat = {}
    let max = 0
    for (const sg of subjectGroups) { mat[sg] = {}; for (const sg2 of subjectGroups) mat[sg][sg2] = { count: 0, links: [] } }
    for (const link of filteredLinks) {
      const sid = typeof link.source === 'object' ? link.source?.id : link.source
      const tid = typeof link.target === 'object' ? link.target?.id : link.target
      const s1 = stdMap.get(sid), s2 = stdMap.get(tid)
      if (!s1 || !s2) continue
      const sg1 = s1.subject_group || '기타', sg2 = s2.subject_group || '기타'
      if (!mat[sg1]?.[sg2]) continue
      mat[sg1][sg2].count++; mat[sg1][sg2].links.push({ link, s1, s2 })
      if (sg1 !== sg2) { mat[sg2][sg1].count++; mat[sg2][sg1].links.push({ link, s1: s2, s2: s1 }) }
      max = Math.max(max, mat[sg1][sg2].count, sg1 !== sg2 ? mat[sg2][sg1].count : 0)
    }
    return { matrix: mat, maxCount: max }
  }, [filteredLinks, filteredStandards, subjectGroups])

  const linkTypeStats = useMemo(() => {
    const stats = {}
    for (const link of filteredLinks) stats[link.link_type || 'cross_subject'] = (stats[link.link_type || 'cross_subject'] || 0) + 1
    return Object.entries(stats).sort((a, b) => b[1] - a[1])
  }, [filteredLinks])

  const handleCellClick = useCallback((row, col) => {
    if (row === col) return
    const cell = matrix[row]?.[col]
    if (!cell || cell.count === 0) return
    setSelectedCell({ row, col, ...cell })
  }, [matrix])

  const handleExportCSV = useCallback(() => {
    const header = ['교과', ...subjectGroups].join(',')
    const rows = subjectGroups.map(sg => [sg, ...subjectGroups.map(sg2 => matrix[sg]?.[sg2]?.count || 0)].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `교과연계_매트릭스_${filterSchoolLevel || '전체'}.csv`; a.click()
    URL.revokeObjectURL(url)
  }, [subjectGroups, matrix, filterSchoolLevel])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-dim)] flex items-center justify-center">
        <div className="text-center">
          <Grid3X3 size={48} className="mx-auto mb-4 text-[var(--color-accent)] animate-pulse" />
          <p className="text-[var(--color-text-muted)]">교육과정 데이터 로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)]">
      {/* 헤더 */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-dim)] rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-1 h-6 rounded-full bg-[var(--color-accent)] shrink-0" />
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] truncate tracking-[-0.015em]">교과 연계 매트릭스</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-dim)] transition">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface-dim)] transition">
              <Printer size={14} /> 인쇄
            </button>
            <button onClick={() => navigate('/explorer')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-text-primary)] text-white rounded-lg hover:opacity-90 transition">
              <BookOpen size={14} /> 탐색기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 필터 */}
        <div className="flex items-center gap-4 mb-6 flex-wrap print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)] font-medium">학교급</span>
            <div className="flex gap-1">
              <button onClick={() => setFilterSchoolLevel('')}
                className={`px-2.5 py-1 text-xs rounded-full transition ${!filterSchoolLevel ? 'bg-[var(--color-text-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]'}`}>전체</button>
              {schoolLevels.map(level => (
                <button key={level} onClick={() => setFilterSchoolLevel(filterSchoolLevel === level ? '' : level)}
                  className={`px-2.5 py-1 text-xs rounded-full transition ${filterSchoolLevel === level ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]'}`}>{level}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)] font-medium">유형</span>
            <div className="flex gap-1">
              <button onClick={() => setFilterLinkType('')}
                className={`px-2.5 py-1 text-xs rounded-full transition ${!filterLinkType ? 'bg-[var(--color-text-primary)] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-dim)]'}`}>전체</button>
              {Object.entries(LINK_TYPE_LABELS).map(([type, label]) => (
                <button key={type} onClick={() => setFilterLinkType(filterLinkType === type ? '' : type)}
                  className={`px-2.5 py-1 text-xs rounded-full transition ${filterLinkType === type ? 'text-white' : 'bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface-dim)]'}`}
                  style={filterLinkType === type ? { backgroundColor: LINK_TYPE_COLORS[type] } : { color: LINK_TYPE_COLORS[type] }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 인쇄용 타이틀 */}
        <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold">교과 연계 매트릭스</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{filterSchoolLevel || '전체 학교급'} · 성취기준 {filteredStandards.length}개 · 연결 {filteredLinks.length}개</p>
        </div>

        {/* 통계 카드 — 컴팩트 인라인 */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {[
            { value: subjectGroups.length, label: '교과군', color: 'var(--color-text-primary)' },
            { value: filteredStandards.length, label: '성취기준', color: 'var(--color-primary)' },
            { value: filteredLinks.length, label: '연결', color: 'var(--color-accent)' },
            { value: linkTypeStats.length, label: '연결 유형', color: 'var(--color-text-secondary)' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 bg-white rounded-lg border border-[var(--color-border)] px-3 py-2 shadow-sm">
              <span className="text-lg font-bold tabular-nums leading-none" style={{ color: item.color }}>{item.value}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{item.label}</span>
            </div>
          ))}
        </div>

        {/* 매트릭스 테이블 */}
        <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-[var(--color-surface-dim)] border-b border-r border-[var(--color-border)] px-3 py-2 text-left font-semibold text-[var(--color-text-secondary)] min-w-[100px]">교과</th>
                  {subjectGroups.map(sg => (
                    <th key={sg} className="border-b border-[var(--color-border)] px-2 py-2 font-semibold text-center whitespace-nowrap" style={{ color: SUBJECT_COLORS[sg] || '#6b7280' }}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[sg] || '#6b7280' }} />
                        <span className="text-[10px] leading-tight">{sg}</span>
                        <span className="text-[9px] text-[var(--color-text-muted)] font-normal">{subjectCounts[sg] || 0}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjectGroups.map(row => (
                  <tr key={row} className="hover:bg-[var(--color-surface-dim)]/50">
                    <td className="sticky left-0 z-10 bg-white border-r border-b border-[var(--color-border)] px-3 py-2 font-semibold whitespace-nowrap" style={{ color: SUBJECT_COLORS[row] || '#6b7280' }}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[row] || '#6b7280' }} />{row}
                      </div>
                    </td>
                    {subjectGroups.map(col => {
                      const count = matrix[row]?.[col]?.count || 0
                      const isDiagonal = row === col
                      const isSelected = selectedCell?.row === row && selectedCell?.col === col
                      return (
                        <td key={col}
                          className={`border-b border-[var(--color-surface-bright)] text-center py-2 px-1 transition cursor-pointer ${isDiagonal ? 'bg-[var(--color-surface-dim)]' : ''} ${isSelected ? 'ring-2 ring-[var(--color-primary)] ring-inset' : ''}`}
                          style={!isDiagonal && count > 0 ? { backgroundColor: heatColor(count, maxCount) } : {}}
                          onClick={() => handleCellClick(row, col)}
                          title={isDiagonal ? `${row} 내부` : `${row} ↔ ${col}: ${count}개`}>
                          {isDiagonal ? <span className="text-[var(--color-text-muted)]">--</span> : count > 0 ? <span className="font-bold text-[var(--color-text-primary)]">{count}</span> : <span className="text-[var(--color-surface-bright)]">0</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 차트 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* 연결 유형 분포 */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 tracking-[-0.01em]">연결 유형 분포</h3>
            <div className="space-y-2.5">
              {linkTypeStats.map(([type, count]) => {
                const pct = filteredLinks.length > 0 ? (count / filteredLinks.length * 100) : 0
                return (
                  <div key={type} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: LINK_TYPE_COLORS[type] }} />
                    <span className="text-xs text-[var(--color-text-secondary)] w-16">{LINK_TYPE_LABELS[type] || type}</span>
                    <div className="flex-1 h-2.5 bg-[var(--color-surface-dim)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: LINK_TYPE_COLORS[type] }} />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] w-12 text-right tabular-nums">{count}개</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] w-10 text-right tabular-nums">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 교과별 교차 연결 수 */}
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 tracking-[-0.01em]">교과별 교차 연결 수</h3>
            <div className="space-y-2.5">
              {(() => {
                const crossCounts = subjectGroups.map(sg => ({
                  sg, count: subjectGroups.reduce((sum, sg2) => sg === sg2 ? sum : sum + (matrix[sg]?.[sg2]?.count || 0), 0)
                })).sort((a, b) => b.count - a.count)
                const maxCross = crossCounts[0]?.count || 1
                return crossCounts.map(({ sg, count }) => (
                  <div key={sg} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SUBJECT_COLORS[sg] || '#6b7280' }} />
                    <span className="text-xs w-20 truncate" style={{ color: SUBJECT_COLORS[sg] || '#6b7280' }}>{sg}</span>
                    <div className="flex-1 h-2.5 bg-[var(--color-surface-dim)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${count / maxCross * 100}%`, backgroundColor: SUBJECT_COLORS[sg] || '#6b7280', opacity: 0.7 }} />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)] w-10 text-right tabular-nums">{count}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>

        {/* 셀 상세 모달 */}
        {selectedCell && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 print:hidden" onClick={() => setSelectedCell(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-dim)]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ backgroundColor: SUBJECT_COLORS[selectedCell.row] || '#6b7280' }}>{selectedCell.row}</span>
                  <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                  <span className="px-2 py-0.5 text-xs font-bold text-white rounded" style={{ backgroundColor: SUBJECT_COLORS[selectedCell.col] || '#6b7280' }}>{selectedCell.col}</span>
                  <span className="text-sm text-[var(--color-text-muted)] ml-2">{selectedCell.count}개 연결</span>
                </div>
                <button onClick={() => setSelectedCell(null)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] rounded"><X size={16} /></button>
              </div>
              <div className="overflow-auto max-h-[60vh] p-4 space-y-2">
                {selectedCell.links.slice(0, 30).map(({ link, s1, s2 }, i) => (
                  <button key={i} onClick={() => navigate(`/explorer?code=${s1.code}`)}
                    className="w-full text-left p-3 rounded-xl border border-[var(--color-border)] hover:bg-teal-50 hover:border-[var(--color-primary)] transition group">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="font-mono font-bold text-[var(--color-primary)]">{s1.code}</span>
                      <span className="text-[var(--color-text-muted)]">--</span>
                      <span className="font-mono font-bold text-[var(--color-primary)]">{s2.code}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white ml-auto"
                        style={{ backgroundColor: LINK_TYPE_COLORS[link.link_type] || '#6b7280' }}>{LINK_TYPE_LABELS[link.link_type] || link.link_type}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{s1.content}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1 mt-0.5">{s2.content}</p>
                    {link.rationale && <p className="text-[10px] text-[var(--color-accent)] mt-1 line-clamp-1">* {link.rationale}</p>}
                  </button>
                ))}
                {selectedCell.links.length > 30 && <p className="text-xs text-[var(--color-text-muted)] text-center py-2">외 {selectedCell.links.length - 30}개 더...</p>}
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-[var(--color-text-muted)] mt-4">
          <p>셀을 클릭하면 교과 간 구체적 연결을 확인할 수 있습니다</p>
          <p className="mt-1">성취기준 {filteredStandards.length}개 · 연결 {filteredLinks.length}개{filterSchoolLevel && ` · ${filterSchoolLevel}`}</p>
        </div>
      </main>

      <style>{`@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print\\:hidden { display: none !important; } .print\\:block { display: block !important; } }`}</style>
    </div>
  )
}
