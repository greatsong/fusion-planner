/**
 * AI 융합 수업 설계 패널
 * 오른쪽에서 슬라이드 인 — RAG 기반 스트리밍 설계
 */
import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Send, Loader2, Copy, Check, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SUBJECT_COLORS } from '../../../shared/constants.js'
import { useBasketStore } from '../stores/basketStore.js'
import { API_BASE } from '../lib/api.js'

export default function DesignPanel({ open, onClose }) {
  const { items } = useBasketStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      // 자동 시작
      generateDesign('이 성취기준들로 융합 프로젝트 수업을 설계해주세요.')
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const generateDesign = async (prompt) => {
    if (isGenerating || items.length === 0) return

    setIsGenerating(true)
    const userMsg = { role: 'user', content: prompt }
    const assistantMsg = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])

    try {
      const res = await fetch(`${API_BASE}/api/ai/fusion-design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          standards: items.map(s => ({
            code: s.code,
            subject: s.subject,
            subject_group: s.subject_group,
            grade_group: s.grade_group,
            content: s.content,
            area: s.area,
            explanation: s.explanation,
            keywords: s.keywords,
          })),
        }),
      })

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
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text') {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.content }
                }
                return updated
              })
            } else if (parsed.type === 'error') {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: `⚠️ ${parsed.message}` }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: `⚠️ 오류: ${err.message}` }
        return updated
      })
    }

    setIsGenerating(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isGenerating) return
    generateDesign(input.trim())
    setInput('')
  }

  const handleCopy = () => {
    const lastAssistant = messages.filter(m => m.role === 'assistant').pop()
    if (lastAssistant) {
      navigator.clipboard.writeText(lastAssistant.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => {
    setMessages([])
    generateDesign('이 성취기준들로 융합 프로젝트 수업을 설계해주세요.')
  }

  if (!open) return null

  // 교과군 목록
  const groups = [...new Set(items.map(i => i.subject_group))]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* 배경 */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* 패널 */}
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            <h2 className="font-semibold text-gray-700">AI 융합 수업 설계</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="다시 생성">
              <RotateCcw size={16} />
            </button>
            <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="복사">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 선택된 성취기준 요약 */}
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {groups.map(g => (
              <span key={g} className="px-2 py-0.5 rounded-md text-xs font-medium text-white"
                style={{ backgroundColor: SUBJECT_COLORS[g] || '#64748b' }}>
                {g}
              </span>
            ))}
            <span className="text-xs text-gray-400">· {items.length}개 성취기준</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {items.map(item => (
              <code key={item.code} className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                {item.code}
              </code>
            ))}
          </div>
        </div>

        {/* 메시지 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'user' ? (
                <div className="inline-block max-w-[85%] bg-blue-600 text-white p-3 rounded-2xl rounded-tr-md text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl rounded-tl-md p-4 prose prose-sm max-w-none
                  prose-headings:text-gray-700 prose-p:text-gray-600 prose-li:text-gray-600
                  prose-strong:text-gray-700 prose-code:text-blue-600 prose-code:bg-blue-50
                  prose-code:rounded prose-code:px-1 prose-code:py-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content || (isGenerating ? '...' : '')}
                  </ReactMarkdown>
                  {isGenerating && i === messages.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse rounded-sm" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 입력 영역 */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="추가 요청 (예: '평가 루브릭도 만들어줘')"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none text-sm"
              disabled={isGenerating}
            />
            <button type="submit" disabled={isGenerating || !input.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
