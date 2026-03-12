import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const SearchPage = lazy(() => import('./pages/SearchPage'))
const MatrixPage = lazy(() => import('./pages/MatrixPage'))
const GuidePage = lazy(() => import('./pages/GuidePage'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/matrix" element={<MatrixPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
