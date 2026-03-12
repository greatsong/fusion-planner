import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { initStore, Standards } from './lib/store.js'
import { standardsRouter } from './routes/standards.js'
import { searchRouter } from './routes/search.js'
import { aiRouter } from './routes/ai.js'
import { initVectorSearch } from './services/vectorSearch.js'

// 데이터 로드
initStore()

// 벡터 검색 초기화
initVectorSearch(Standards.list())

const app = express()
// 로컬: 4016 고정 (Vite 4015와 충돌 방지). Vercel Serverless에서는 api/ 사용
const PORT = process.env.SERVER_PORT || 4016

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    const allowed = !origin || origin.includes('localhost') ||
      origin.endsWith('.vercel.app') || origin.endsWith('.up.railway.app')
    callback(null, allowed)
  },
}))
app.use(express.json({ limit: '1mb' }))

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'fusion-planner' })
})

// 라우트
app.use('/api/standards', standardsRouter)
app.use('/api/search', searchRouter)
app.use('/api/ai', aiRouter)

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || '서버 내부 오류' })
})

app.listen(PORT, () => {
  console.log(`AI 융합교육 설계 도구 서버: http://localhost:${PORT}`)
})
