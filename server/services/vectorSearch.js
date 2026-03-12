/**
 * 벡터 기반 의미 검색 서비스
 *
 * - embeddings.json이 있으면 벡터 코사인 유사도 사용
 * - 없으면 향상된 키워드 검색으로 폴백
 * - 쿼리 임베딩: VOYAGE_API_KEY 있으면 Voyage API, 없으면 키워드
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EMBEDDINGS_PATH = path.resolve(__dirname, '../data/embeddings.json')
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3-lite'

// ─── 모듈 상태 ───
let embeddings = null       // { code: number[] }
let standardsIndex = null   // 검색용 인덱스
let useVectors = false

// ─── 초기화 ───
export function initVectorSearch(standards) {
  // 1) 성취기준 인덱스 빌드
  standardsIndex = new Map()
  for (const s of standards) {
    standardsIndex.set(s.code, s)
  }

  // 2) 임베딩 로드 시도
  try {
    if (fs.existsSync(EMBEDDINGS_PATH)) {
      const raw = fs.readFileSync(EMBEDDINGS_PATH, 'utf-8')
      embeddings = JSON.parse(raw)
      const codes = Object.keys(embeddings)
      const dim = embeddings[codes[0]]?.length || 0
      useVectors = codes.length > 0 && dim > 0
      console.log(`  벡터 검색: ${codes.length}개 임베딩 로드 (${dim}차원)`)
    } else {
      console.log('  벡터 검색: embeddings.json 없음 → 키워드 폴백 모드')
    }
  } catch (err) {
    console.log(`  벡터 검색: 임베딩 로드 실패 → 키워드 폴백 모드 (${err.message})`)
  }

  return { useVectors, standardCount: standardsIndex.size }
}

// ─── 코사인 유사도 ───
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

// ─── Voyage AI 쿼리 임베딩 ───
async function embedQuery(text) {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: [text],
        model: VOYAGE_MODEL,
        input_type: 'query',
      }),
    })

    if (!res.ok) {
      console.error(`Voyage API 오류: ${res.status}`)
      return null
    }

    const data = await res.json()
    return data.data[0]?.embedding || null
  } catch (err) {
    console.error(`Voyage 임베딩 실패: ${err.message}`)
    return null
  }
}

// ─── 한국어 조사 제거 ───
const PARTICLES = [
  '에서는', '으로서', '으로써', '에서의', '로부터', '이라는', '에게서',
  '만으로', '과의', '와의',
  '으로', '에서', '에게', '까지', '부터', '에는', '에도',
  '하고', '하며', '하여', '해서', '에의', '와는', '과는',
  '이며', '이고', '이나', '라는', '라고',
  '은', '는', '이', '가', '을', '를', '에', '서', '의', '로',
  '와', '과', '도', '만', '며', '고', '나',
]

function stripParticles(word) {
  for (const p of PARTICLES) {
    if (word.endsWith(p) && word.length > p.length + 1) {
      return word.slice(0, -p.length)
    }
  }
  return word
}

const STOP_WORDS = new Set([
  '할', '수', '있다', '한다', '등', '및', '또는', '그리고', '이를', '것을',
  '통해', '위한', '대한', '관한', '바탕', '위해', '가지', '것이',
  '따른', '이상', '이하', '같은', '다른', '다양한', '여러',
  '중심', '대하여', '있는', '하는', '되는', '하여', '하고',
])

function extractTokens(text) {
  if (!text) return []
  const cleaned = text.replace(/[.,;:!?""''()\[\]⋅·\-•\n\r]/g, ' ')
    .replace(/\s+/g, ' ').trim()
  const raw = cleaned.split(' ').map(w => w.trim()).filter(w => w.length >= 2)
  const tokens = []
  const seen = new Set()
  for (const w of raw) {
    if (STOP_WORDS.has(w)) continue
    // 원형과 조사 제거형 모두 추가
    const stripped = stripParticles(w)
    if (stripped.length >= 2 && !seen.has(stripped)) {
      tokens.push(stripped)
      seen.add(stripped)
    }
    if (w !== stripped && !seen.has(w)) {
      tokens.push(w)
      seen.add(w)
    }
  }
  return tokens
}

// ─── 키워드 기반 유사도 (폴백) ───
function keywordSimilarity(queryTokens, standard) {
  const fields = [
    { text: standard.content, weight: 3 },
    { text: (standard.keywords || []).join(' '), weight: 4 },
    { text: standard.area || '', weight: 2 },
    { text: standard.domain || '', weight: 2 },
    { text: standard.subject || '', weight: 1 },
    { text: (standard.explanation || '').substring(0, 300), weight: 1 },
  ]

  let score = 0
  let maxScore = 0

  for (const token of queryTokens) {
    const t = token.toLowerCase()
    const tokenWeight = Math.max(t.length / 2, 1) // 긴 토큰 = 더 중요
    let bestFieldScore = 0

    for (const field of fields) {
      const fieldText = field.text.toLowerCase()
      if (!fieldText) continue

      // 정확히 포함 (부분 문자열)
      if (fieldText.includes(t)) {
        const fieldScore = field.weight * tokenWeight
        bestFieldScore = Math.max(bestFieldScore, fieldScore)
      }
    }

    score += bestFieldScore
    maxScore += 4 * tokenWeight // 최대 = keywords 필드에서 매칭
  }

  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0
}

// ─── 의미 검색 (메인 API) ───
export async function searchSemantic(query, opts = {}) {
  const {
    limit = 30,
    filters = {},
    minSimilarity = 0.2,
  } = opts

  if (!standardsIndex) throw new Error('vectorSearch가 초기화되지 않았습니다')

  let results = []

  // 벡터 검색 시도
  if (useVectors && embeddings) {
    const queryVec = await embedQuery(query)

    if (queryVec) {
      // 벡터 코사인 유사도
      for (const [code, vec] of Object.entries(embeddings)) {
        const standard = standardsIndex.get(code)
        if (!standard) continue

        // 필터 적용
        if (filters.school_level && standard.school_level !== filters.school_level) continue
        if (filters.subject_group && standard.subject_group !== filters.subject_group) continue

        const similarity = cosineSimilarity(queryVec, vec)
        if (similarity >= minSimilarity) {
          results.push({ standard, similarity })
        }
      }

      results.sort((a, b) => b.similarity - a.similarity)
      return results.slice(0, limit)
    }
  }

  // 폴백: 키워드 기반 검색
  const queryTokens = extractTokens(query)
  if (queryTokens.length === 0) return []

  for (const [code, standard] of standardsIndex) {
    // 필터 적용
    if (filters.school_level && standard.school_level !== filters.school_level) continue
    if (filters.subject_group && standard.subject_group !== filters.subject_group) continue

    const similarity = keywordSimilarity(queryTokens, standard)
    if (similarity > 0) {
      results.push({ standard, similarity })
    }
  }

  results.sort((a, b) => b.similarity - a.similarity)
  return results.slice(0, limit)
}

// ─── 이웃 탐색 (특정 성취기준의 유사 기준 찾기) ───
export async function findNeighbors(code, opts = {}) {
  const {
    limit = 20,
    crossSubjectOnly = true,
  } = opts

  if (!standardsIndex) throw new Error('vectorSearch가 초기화되지 않았습니다')

  const center = standardsIndex.get(code)
  if (!center) return { standard: null, neighbors: [] }

  let neighbors = []

  if (useVectors && embeddings && embeddings[code]) {
    const centerVec = embeddings[code]

    for (const [otherCode, otherVec] of Object.entries(embeddings)) {
      if (otherCode === code) continue
      const other = standardsIndex.get(otherCode)
      if (!other) continue
      if (crossSubjectOnly && other.subject_group === center.subject_group) continue

      const similarity = cosineSimilarity(centerVec, otherVec)
      if (similarity > 0.3) {
        neighbors.push({ standard: other, similarity })
      }
    }
  } else {
    // 폴백: 키워드 기반 이웃
    const centerTokens = extractTokens(
      `${center.content} ${(center.keywords || []).join(' ')} ${center.area || ''}`
    )

    for (const [otherCode, other] of standardsIndex) {
      if (otherCode === code) continue
      if (crossSubjectOnly && other.subject_group === center.subject_group) continue

      const similarity = keywordSimilarity(centerTokens, other)
      if (similarity > 0.15) {
        neighbors.push({ standard: other, similarity })
      }
    }
  }

  neighbors.sort((a, b) => b.similarity - a.similarity)
  return {
    standard: center,
    neighbors: neighbors.slice(0, limit),
  }
}

// ─── 상태 조회 ───
export function getSearchStatus() {
  return {
    mode: useVectors ? 'vector' : 'keyword',
    embeddingCount: embeddings ? Object.keys(embeddings).length : 0,
    standardCount: standardsIndex ? standardsIndex.size : 0,
    hasVoyageKey: !!process.env.VOYAGE_API_KEY,
  }
}
