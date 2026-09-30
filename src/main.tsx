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

// 휴대폰 화면 높이를 직접 재어 CSS에 넘긴다. 이름 입력 때 올라온 자판에 줄어든 100dvh가
// 그대로 남는 브라우저가 있어, 지도가 작아지고 아래 조작판만 텅 비게 커지던 문제를 막는다
const setAppHeight = () => document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`)
setAppHeight()
window.addEventListener('resize', setAppHeight)
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 300))
window.addEventListener('focusout', () => setTimeout(setAppHeight, 300))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    {/* Vercel 대시보드의 방문 통계. 쿠키·개인정보 없이 페이지 조회만 센다 */}
    <Analytics />
  </StrictMode>,
)
