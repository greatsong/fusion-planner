import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Grid3X3, ChevronDown, ChevronUp, Check, X, Sparkles, RefreshCw, Loader2, Link2 } from 'lucide-react'
import { apiGet } from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const API_BASE = import.meta.env.VITE_API_URL || ''

import { SUBJECT_COLORS, GROUP_ORDER, sortByGroupOrder } from '../../../shared/constants.js'

const CATEGORY_STYLES = {
  '공통': { bg: '#f3f4f6', text: '#4b5563' },
  '일반선택': { bg: '#dbeafe', text: '#1d4ed8' },
  '융합선택': { bg: '#ccfbf1', text: '#0d9488' },
  '진로선택': { bg: '#ede9fe', text: '#7c3aed' },
  '전문공통': { bg: '#fef3c7', text: '#d97706' },
}

export default function SubjectMapPage() {
  const navigate = useNavigate()
  const [allStandards, setAllStandards] = useState([])
  const [allLinks, setAllLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSchoolLevel, setActiveSchoolLevel] = useState('고등학교')
  const [selectedSubjects, setSelectedSubjects] = useState(new Set())
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // AI 추천 상태
  const [recommendation, setRecommendation] = useState('')
  const [recLoading, setRecLoading] = useState(false)
  const [recError, setRecError] = useState('')
  const [showRecommendation, setShowRecommendation] = useState(false)

  // 데이터 로드
  useEffect(() => {
    async function load() {
      try {
        const graph = await apiGet('/api/standards/graph')
        setAllStandards(graph.nodes || [])
        setAllLinks(graph.links || [])
      } catch (err) {
        console.error('데이터 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // 학교급 목록
  const schoolLevels = useMemo(() => {
    const levels = new Set(allStandards.map(s => s.school_level).filter(Boolean))
    return ['초등학교', '중학교', '고등학교'].filter(l => levels.has(l))
  }, [allStandards])

  // 교과군 → 과목 위계 계산
  const subjectHierarchy = useMemo(() => {
    const filtered = activeSchoolLevel
      ? allStandards.filter(s => s.school_level === activeSchoolLevel)
      : allStandards

    // subject_group → subject별 집계
    const map = new Map()
    for (const s of filtered) {
      const group = s.subject_group || '기타'
      if (!map.has(group)) map.set(group, new Map())
      const subjectMap = map.get(group)
      const subj = s.subject || group
      if (!subjectMap.has(subj)) {
        subjectMap.set(subj, { subject: subj, count: 0, categories: new Set(), standards: [] })
      }
      const entry = subjectMap.get(subj)
      entry.count++
      if (s.curriculum_category) entry.categories.add(s.curriculum_category)
      // 대표 성취기준 최대 5개 저장 (area 다양하게)
      if (entry.standards.length < 5) {
        const areas = new Set(entry.standards.map(st => st.area))
        if (entry.standards.length === 0 || !areas.has(s.area)) {
          entry.standards.push({ code: s.code, content: s.content, area: s.area || '' })
        }
      }
    }

    // 정렬 — 공통과목이 각 그룹 맨 위에 오도록
    const result = []
    const sortedGroups = [...map.keys()].sort(sortByGroupOrder)

    for (const group of sortedGroups) {
      const subjects = [...map.get(group).values()].sort((a, b) => {
        // 공통과목 먼저, 그 다음 성취기준 수 내림차순
        const aIsCommon = a.categories.has('공통') ? 0 : 1
        const bIsCommon = b.categories.has('공통') ? 0 : 1
        if (aIsCommon !== bIsCommon) return aIsCommon - bIsCommon
        return b.count - a.count
      })
      const totalCount = subjects.reduce((sum, s) => sum + s.count, 0)
      result.push({ group, totalCount, subjects })
    }
    return result
  }, [allStandards, activeSchoolLevel])

  // 선택된 과목 간 교차 링크 수
  const crossLinkCount = useMemo(() => {
    if (selectedSubjects.size < 2) return 0
    // 선택된 과목명에 해당하는 성취기준 코드들
    const selectedCodes = new Set()
    for (const s of allStandards) {
      if (selectedSubjects.has(s.subject)) selectedCodes.add(s.code)
    }
    let count = 0
    for (const link of allLinks) {
      const src = typeof link.source === 'string' ? link.source : link.source?.code
      const tgt = typeof link.target === 'string' ? link.target : link.target?.code
      if (selectedCodes.has(src) && selectedCodes.has(tgt)) count++
    }
    return count
  }, [selectedSubjects, allStandards, allLinks])

  // 과목 토글
  const toggleSubject = useCallback((subject) => {
    setSelectedSubjects(prev => {
      const next = new Set(prev)
      if (next.has(subject)) next.delete(subject)
      else next.add(subject)
      return next
    })
    // 추천 결과 리셋
    setShowRecommendation(false)
    setRecommendation('')
    setRecError('')
  }, [])

  // 교과군 더보기 토글
  const toggleGroupExpand = useCallback((group) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }, [])

  // 전체 선택 해제
  const clearSelection = useCallback(() => {
    setSelectedSubjects(new Set())
    setShowRecommendation(false)
    setRecommendation('')
    setRecError('')
  }, [])

  // AI 융합 소재 추천 생성
  const generateRecommendation = useCallback(async () => {
    if (selectedSubjects.size < 2 || recLoading) return
    setRecLoading(true)
    setRecError('')
    setRecommendation('')
    setShowRecommendation(true)

    // 선택 과목 데이터 구성
    const subjectData = []
    const subjectCodeMap = new Map() // subject → standards[]
    for (const s of allStandards) {
      if (!selectedSubjects.has(s.subject)) continue
      if (!subjectCodeMap.has(s.subject)) subjectCodeMap.set(s.subject, [])
      subjectCodeMap.get(s.subject).push(s)
    }

    for (const [subj, standards] of subjectCodeMap) {
      const first = standards[0]
      // 대표 성취기준 선택 (area 다양하게)
      const areas = new Set()
      const samples = []
      for (const st of standards) {
        if (samples.length >= 5) break
        if (!areas.has(st.area)) {
          areas.add(st.area)
          samples.push({ code: st.code, content: st.content, area: st.area || '' })
        }
      }
      for (const st of standards) {
        if (samples.length >= 5) break
        if (!samples.find(s => s.code === st.code)) {
          samples.push({ code: st.code, content: st.content, area: st.area || '' })
        }
      }

      subjectData.push({
        subject: subj,
        subjectGroup: first.subject_group,
        curriculumCategory: first.curriculum_category || '',
        standardsCount: standards.length,
        sampleStandards: samples,
      })
    }

    // 교차 링크 수집
    const selectedCodes = new Set()
    for (const s of allStandards) {
      if (selectedSubjects.has(s.subject)) selectedCodes.add(s.code)
    }
    const crossLinksData = []
    for (const link of allLinks) {
      if (crossLinksData.length >= 20) break
      const src = typeof link.source === 'string' ? link.source : link.source?.code
      const tgt = typeof link.target === 'string' ? link.target : link.target?.code
      if (selectedCodes.has(src) && selectedCodes.has(tgt)) {
        crossLinksData.push({
          source: src,
          target: tgt,
          type: link.type || 'cross_subject',
          rationale: link.rationale || '',
        })
      }
    }
    // rationale 긴 순 정렬
    crossLinksData.sort((a, b) => (b.rationale?.length || 0) - (a.rationale?.length || 0))

    try {
      const res = await fetch(`${API_BASE}/api/standards/recommend-topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedSubjects: subjectData,
          crossLinks: crossLinksData.slice(0, 20),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setRecError(err.error || '알 수 없는 오류')
        setRecLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') { setRecLoading(false); return }
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text') setRecommendation(prev => prev + parsed.content)
            else if (parsed.type === 'error') setRecError(parsed.message)
          } catch {}
        }
      }
    } catch (err) {
      setRecError(err.message || '네트워크 오류')
    } finally {
      setRecLoading(false)
    }
  }, [selectedSubjects, allStandards, allLinks, recLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-dim)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--color-text-muted)]">
          <Loader2 className="animate-spin" size={20} />
          <span>교과 데이터 로딩 중...</span>
        </div>
      </div>
    )
  }

  const VISIBLE_LIMIT = 6

  return (
    <div className="min-h-screen bg-[var(--color-surface-dim)]">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-[var(--color-surface-dim)] transition">
              <ArrowLeft size={18} className="text-[var(--color-text-secondary)]" />
            </button>
            <div className="w-1 h-5 rounded-full bg-[#8b5cf6]" />
            <h1 className="text-[15px] font-bold text-[var(--color-text-primary)]">교과 지도</h1>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate('/explorer')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--color-surface-dim)] transition text-[var(--color-text-secondary)]">
              <BookOpen size={14} /> 탐색기
            </button>
            <button onClick={() => navigate('/matrix')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-[var(--color-surface-dim)] transition text-[var(--color-text-secondary)]">
              <Grid3X3 size={14} /> 매트릭스
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* 학교급 탭 + 안내 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              교과군별 선택과목을 확인하고, 과목을 선택하여 AI 융합 소재를 추천받으세요
            </p>
          </div>
          <div className="flex items-center bg-white rounded-lg border border-[var(--color-border)] p-0.5">
            {schoolLevels.map(level => (
              <button
                key={level}
                onClick={() => {
                  setActiveSchoolLevel(level)
                  setSelectedSubjects(new Set())
                  setShowRecommendation(false)
                  setRecommendation('')
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  activeSchoolLevel === level
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* 교과군 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subjectHierarchy.map(({ group, totalCount, subjects }) => {
            const color = SUBJECT_COLORS[group] || '#6b7280'
            const isExpanded = expandedGroups.has(group)
            const visibleSubjects = isExpanded ? subjects : subjects.slice(0, VISIBLE_LIMIT)
            const hasMore = subjects.length > VISIBLE_LIMIT

            return (
              <div key={group} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden shadow-sm">
                {/* 교과군 헤더 */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-dim)]">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex-1">{group}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '18', color }}>
                    {totalCount}개 기준
                  </span>
                </div>

                {/* 과목 리스트 */}
                <div className="p-2">
                  {visibleSubjects.map(({ subject, count, categories }) => {
                    const isSelected = selectedSubjects.has(subject)
                    const catArr = [...categories]
                    const mainCat = catArr[0] || ''
                    const catStyle = CATEGORY_STYLES[mainCat] || CATEGORY_STYLES['공통']

                    return (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition group ${
                          isSelected
                            ? 'bg-[var(--color-primary)]/8 ring-1 ring-[var(--color-primary)]/30'
                            : 'hover:bg-[var(--color-surface-dim)]'
                        }`}
                      >
                        {/* 체크박스 */}
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition ${
                          isSelected
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'border border-[var(--color-border)] group-hover:border-[var(--color-primary)]/50'
                        }`}>
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>

                        {/* 과목명 */}
                        <span className={`text-xs flex-1 truncate ${
                          isSelected ? 'font-semibold text-[var(--color-primary-dark)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}>
                          {subject}
                        </span>

                        {/* 카테고리 뱃지 */}
                        {mainCat && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: catStyle.bg, color: catStyle.text }}>
                            {mainCat}
                          </span>
                        )}

                        {/* 성취기준 수 */}
                        <span className="text-[10px] tabular-nums text-[var(--color-text-muted)] shrink-0 w-6 text-right">
                          {count}
                        </span>
                      </button>
                    )
                  })}

                  {/* 더 보기 토글 */}
                  {hasMore && (
                    <button
                      onClick={() => toggleGroupExpand(group)}
                      className="w-full flex items-center justify-center gap-1 py-2 text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition"
                    >
                      {isExpanded ? (
                        <>접기 <ChevronUp size={12} /></>
                      ) : (
                        <>+{subjects.length - VISIBLE_LIMIT}개 더 보기 <ChevronDown size={12} /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* AI 추천 결과 */}
        {showRecommendation && (
          <div className="mt-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-gradient-to-r from-violet-50 to-white">
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-[#8b5cf6]" />
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI 융합 소재 추천</h3>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {[...selectedSubjects].join(' + ')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!recLoading && recommendation && (
                  <button onClick={generateRecommendation}
                    className="p-1.5 rounded-md hover:bg-[var(--color-surface-dim)] transition"
                    title="다시 생성">
                    <RefreshCw size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                )}
                <button onClick={() => setShowRecommendation(false)}
                  className="p-1.5 rounded-md hover:bg-[var(--color-surface-dim)] transition">
                  <X size={14} className="text-[var(--color-text-muted)]" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {recLoading && !recommendation && (
                <div className="flex items-center gap-3 py-8 justify-center text-[var(--color-text-muted)]">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="text-sm">AI가 융합 소재를 분석하고 있습니다...</span>
                </div>
              )}

              {recError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {recError}
                </div>
              )}

              {recommendation && (
                <div className="prose prose-sm max-w-none text-[var(--color-text-primary)] prose-headings:text-[var(--color-text-primary)] prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-primary)] prose-li:my-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {recommendation}
                  </ReactMarkdown>
                  {recLoading && (
                    <span className="inline-block w-1.5 h-4 bg-[#8b5cf6] animate-pulse rounded-sm ml-0.5 align-text-bottom" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 하단 선택 패널 */}
      {selectedSubjects.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[var(--color-border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 선택 수 */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold">
                  {selectedSubjects.size}
                </div>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">과목 선택</span>
              </div>

              {/* 선택된 과목 칩 */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                {[...selectedSubjects].map(subj => {
                  // 이 과목의 교과군 색상 찾기
                  const std = allStandards.find(s => s.subject === subj)
                  const chipColor = std ? (SUBJECT_COLORS[std.subject_group] || '#6b7280') : '#6b7280'
                  return (
                    <span key={subj}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: chipColor }}>
                      {subj}
                      <button onClick={(e) => { e.stopPropagation(); toggleSubject(subj) }}
                        className="p-0.5 rounded-full hover:bg-white/20 transition">
                        <X size={10} />
                      </button>
                    </span>
                  )
                })}
                <button onClick={clearSelection}
                  className="text-[10px] text-[var(--color-text-muted)] hover:text-red-500 transition ml-1">
                  전체 해제
                </button>
              </div>

              {/* 교차 연결 수 + AI 버튼 */}
              <div className="flex items-center gap-3 shrink-0">
                {selectedSubjects.size >= 2 && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Link2 size={12} />
                    <span>교차 연결 <strong className="text-[var(--color-text-primary)]">{crossLinkCount.toLocaleString()}</strong>건</span>
                  </div>
                )}

                <button
                  onClick={generateRecommendation}
                  disabled={selectedSubjects.size < 2 || recLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                    selectedSubjects.size >= 2
                      ? 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed] active:bg-[#6d28d9]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {recLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  AI 융합 소재 추천
                </button>
              </div>
            </div>

            {selectedSubjects.size < 2 && (
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
                2개 이상의 과목을 선택하면 AI 융합 소재 추천을 받을 수 있습니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* 하단 패널 높이만큼 여백 */}
      {selectedSubjects.size > 0 && <div className="h-20" />}
    </div>
  )
}
