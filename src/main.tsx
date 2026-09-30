import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { App } from './app/App'
import { ErrorBoundary } from './app/ErrorBoundary'
import './app/global.css'
import './app/parts.css'
import { applyTheme, loadTheme } from './app/theme'

// 고른 색 조합을 그리기 전에 먼저 입힌다
applyTheme(loadTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Vercel 대시보드의 방문 통계. 쿠키·개인정보 없이 페이지 조회만 센다 */}
    <Analytics />
  </StrictMode>,
)
