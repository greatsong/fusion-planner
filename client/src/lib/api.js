export const API_BASE = import.meta.env.VITE_API_URL || ''

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 60000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(body.error || `API 오류: ${res.status}`, res.status)
    }
    return res
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof ApiError) throw err
    if (err.name === 'AbortError') throw new ApiError('서버 응답 시간이 초과되었습니다.', 0)
    throw new ApiError('네트워크 연결을 확인해주세요.', 0)
  }
}

export async function apiGet(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = qs ? `${API_BASE}${path}?${qs}` : `${API_BASE}${path}`
  const res = await fetchWithTimeout(url, { headers: { 'Content-Type': 'application/json' } })
  return res.json()
}

export async function apiPost(path, body = {}) {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}
