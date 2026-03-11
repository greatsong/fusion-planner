import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ExplorerPage = lazy(() => import('./pages/ExplorerPage'))
const MatrixPage = lazy(() => import('./pages/MatrixPage'))

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/matrix" element={<MatrixPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
