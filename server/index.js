import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { initStore } from './lib/store.js'
import { standardsRouter } from './routes/standards.js'

// 데이터 로드
initStore()

const app = express()
const PORT = 4016

app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    const isLocal = !origin || origin.includes('localhost') || origin.endsWith('.vercel.app')
    callback(null, isLocal)
  },
}))
app.use(express.json({ limit: '1mb' }))

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'fusion-planner' })
})

// 라우트
app.use('/api/standards', standardsRouter)

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || '서버 내부 오류' })
})

app.listen(PORT, () => {
  console.log(`AI 융합교육 설계 도구 서버: http://localhost:${PORT}`)
})
