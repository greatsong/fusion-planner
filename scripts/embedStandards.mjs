#!/usr/bin/env node
/**
 * 성취기준 벡터 임베딩 생성 스크립트
 *
 * Voyage AI voyage-3-lite (512차원) 사용
 * 2,796개 성취기준 → embeddings.json (~5.7MB)
 *
 * 사용법:
 *   VOYAGE_API_KEY=voyage-xxx node scripts/embedStandards.mjs
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
const BATCH_SIZE = 128 // Voyage API 최대 128개/요청

if (!VOYAGE_API_KEY) {
  console.error('❌ VOYAGE_API_KEY 환경변수가 필요합니다.')
  console.error('   무료 가입: https://dash.voyageai.com')
  console.error('   사용법: VOYAGE_API_KEY=voyage-xxx node scripts/embedStandards.mjs')
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

// ─── Voyage AI API 호출 ───
async function embedBatch(texts) {
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
}

// ─── 메인 ───
async function main() {
  const standards = loadStandards()
  console.log(`📊 성취기준 ${standards.length}개 로드 완료`)

  const texts = standards.map(buildEmbedText)
  const embeddings = {}
  let totalTokens = 0

  // 배치 처리
  const batches = Math.ceil(texts.length / BATCH_SIZE)
  console.log(`🔄 ${batches}개 배치로 임베딩 생성 시작...\n`)

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchIdx = Math.floor(i / BATCH_SIZE) + 1
    const batchTexts = texts.slice(i, i + BATCH_SIZE)
    const batchStandards = standards.slice(i, i + BATCH_SIZE)

    process.stdout.write(`  배치 ${batchIdx}/${batches} (${batchTexts.length}개)... `)

    try {
      const vectors = await embedBatch(batchTexts)
      for (let j = 0; j < vectors.length; j++) {
        embeddings[batchStandards[j].code] = vectors[j]
      }
      console.log('✅')
    } catch (err) {
      console.error(`❌ 오류: ${err.message}`)
      process.exit(1)
    }

    // Rate limit 방지 (1초 대기)
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  // 통계
  const codes = Object.keys(embeddings)
  const dim = embeddings[codes[0]]?.length || 0
  const sizeEstimate = JSON.stringify(embeddings).length

  console.log(`\n📊 결과:`)
  console.log(`   성취기준: ${codes.length}개`)
  console.log(`   벡터 차원: ${dim}`)
  console.log(`   파일 크기: ~${(sizeEstimate / 1024 / 1024).toFixed(1)}MB`)

  // 저장
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(embeddings), 'utf-8')
  console.log(`\n✅ 저장 완료: ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error('치명적 오류:', err)
  process.exit(1)
})
