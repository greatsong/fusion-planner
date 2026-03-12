#!/usr/bin/env node
/**
 * 성취기준 벡터 임베딩 생성 스크립트
 *
 * Voyage AI voyage-3-lite (512차원) 사용
 * 2,796개 성취기준 → embeddings.json (~5.7MB)
 *
 * 특징:
 *   - 중간 저장: 10배치마다 자동 저장 → 끊겨도 이어하기 가능
 *   - 네트워크 오류 자동 재시도 (최대 3회)
 *   - 429 속도 제한 자동 대기 후 재시도
 *
 * 사용법:
 *   VOYAGE_API_KEY=pa-xxx node scripts/embedStandards.mjs
 *   VOYAGE_API_KEY=pa-xxx BATCH_SIZE=10 DELAY_MS=25000 node scripts/embedStandards.mjs
 *
 * Voyage AI 무료 가입: https://dash.voyageai.com
 * 무료 티어: 200M 토큰/월 (이 스크립트는 ~280K 토큰 사용)
 */

import { ALL_STANDARDS } from '../server/data/standards.js'
import { SOCIAL_STANDARDS } from '../server/data/standards_social.js'
import { COMMON_STANDARDS } from '../server/data/standards_common.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = path.resolve(__dirname, '../server/data/embeddings.json')

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY
const VOYAGE_MODEL = 'voyage-3-lite'
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 128
const DELAY_MS = parseInt(process.env.DELAY_MS) || 1000
const SAVE_EVERY = 10 // 10배치마다 중간 저장
const MAX_RETRIES = 3 // 네트워크 오류 최대 재시도

if (!VOYAGE_API_KEY) {
  console.error('❌ VOYAGE_API_KEY 환경변수가 필요합니다.')
  console.error('   무료 가입: https://dash.voyageai.com')
  console.error('   사용법: VOYAGE_API_KEY=pa-xxx node scripts/embedStandards.mjs')
  process.exit(1)
}

// ─── 성취기준 로드 + 중복 제거 ───
function loadStandards() {
  const socialFixed = SOCIAL_STANDARDS.map(s => ({ ...s, subject_group: '사회' }))
  const all = [...ALL_STANDARDS, ...socialFixed, ...COMMON_STANDARDS]
  const seen = new Set()
  const unique = []
  for (const s of all) {
    if (!seen.has(s.code)) {
      seen.add(s.code)
      unique.push(s)
    }
  }
  return unique
}

// ─── 기존 임베딩 로드 (이어하기) ───
function loadExisting() {
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'))
      const count = Object.keys(data).length
      if (count > 0) {
        console.log(`📂 기존 임베딩 ${count}개 로드 (이어하기 모드)`)
        return data
      }
    }
  } catch { /* 파일 파싱 실패 시 새로 시작 */ }
  return {}
}

// ─── 중간 저장 ───
function saveProgress(embeddings) {
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(embeddings), 'utf-8')
  const count = Object.keys(embeddings).length
  console.log(`  💾 중간 저장 (${count}개)`)
}

// ─── 임베딩용 텍스트 구성 ───
function buildEmbedText(s) {
  const parts = [
    `[${s.subject_group}] ${s.subject} - ${s.grade_group} (${s.school_level})`,
  ]
  if (s.domain || s.area) {
    parts.push(`영역: ${[s.domain, s.area].filter(Boolean).join(' > ')}`)
  }
  parts.push(s.content)
  if (s.explanation) {
    parts.push(`해설: ${s.explanation.substring(0, 300)}`)
  }
  if (s.keywords?.length) {
    parts.push(`키워드: ${s.keywords.join(', ')}`)
  }
  return parts.join('\n')
}

// ─── Voyage AI API 호출 (재시도 포함) ───
async function embedBatch(texts, retries = MAX_RETRIES) {
  try {
    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: texts,
        model: VOYAGE_MODEL,
        input_type: 'document',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Voyage API 오류 ${res.status}: ${body}`)
    }

    const data = await res.json()
    return data.data.map(d => d.embedding)
  } catch (err) {
    // 네트워크 오류 재시도
    if (!err.message.includes('429') && retries > 0) {
      const wait = (MAX_RETRIES - retries + 1) * 10
      console.log(`⚡ 네트워크 오류 — ${wait}초 후 재시도 (${retries - 1}회 남음)...`)
      await new Promise(r => setTimeout(r, wait * 1000))
      return embedBatch(texts, retries - 1)
    }
    throw err
  }
}

// ─── 메인 ───
async function main() {
  const standards = loadStandards()
  console.log(`📊 성취기준 ${standards.length}개 로드 완료`)

  // 기존 임베딩 로드 (이어하기)
  const embeddings = loadExisting()
  const existingCodes = new Set(Object.keys(embeddings))

  // 아직 처리 안 된 성취기준만 필터링
  const remaining = standards.filter(s => !existingCodes.has(s.code))

  if (remaining.length === 0) {
    console.log('✅ 모든 성취기준이 이미 임베딩됨!')
    return
  }

  console.log(`🔄 남은 ${remaining.length}개 처리 시작 (${existingCodes.size}개 건너뜀)\n`)

  const texts = remaining.map(buildEmbedText)
  const batches = Math.ceil(texts.length / BATCH_SIZE)
  let batchesSinceSave = 0

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchIdx = Math.floor(i / BATCH_SIZE) + 1
    const batchTexts = texts.slice(i, i + BATCH_SIZE)
    const batchStandards = remaining.slice(i, i + BATCH_SIZE)

    process.stdout.write(`  배치 ${batchIdx}/${batches} (${batchTexts.length}개)... `)

    try {
      const vectors = await embedBatch(batchTexts)
      for (let j = 0; j < vectors.length; j++) {
        embeddings[batchStandards[j].code] = vectors[j]
      }
      console.log('✅')
      batchesSinceSave++
    } catch (err) {
      if (err.message.includes('429')) {
        console.log(`⏳ 속도 제한 — 30초 대기 후 재시도...`)
        await new Promise(r => setTimeout(r, 30000))
        i -= BATCH_SIZE
        continue
      }
      // 치명적 오류 → 지금까지 결과 저장 후 종료
      console.error(`❌ 오류: ${err.message}`)
      saveProgress(embeddings)
      console.log('⚠️  다시 실행하면 이어서 처리됩니다.')
      process.exit(1)
    }

    // 중간 저장 (SAVE_EVERY 배치마다)
    if (batchesSinceSave >= SAVE_EVERY) {
      saveProgress(embeddings)
      batchesSinceSave = 0
    }

    // Rate limit 방지
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, DELAY_MS))
    }
  }

  // 최종 통계 + 저장
  const codes = Object.keys(embeddings)
  const dim = embeddings[codes[0]]?.length || 0
  const sizeEstimate = JSON.stringify(embeddings).length

  console.log(`\n📊 결과:`)
  console.log(`   성취기준: ${codes.length}개`)
  console.log(`   벡터 차원: ${dim}`)
  console.log(`   파일 크기: ~${(sizeEstimate / 1024 / 1024).toFixed(1)}MB`)

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(embeddings), 'utf-8')
  console.log(`\n✅ 저장 완료: ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
