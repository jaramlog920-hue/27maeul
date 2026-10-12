import '@testing-library/jest-dom/vitest'
// 기존 순수 엔진 검사는 동기 본문 API를 사용한다. 실제 앱에서는 화면 진입 때만 받는다.
import { ensureNtBooks } from './content/nt-loader'
import { BOOKS } from './engine/types'
await ensureNtBooks(BOOKS)
// 나중에 받는 화면(ModalLayer의 lazyScreen)은 테스트 파일이 ModalLayer를 불러온 뒤 미리 받아 둔다 — 창이 바로 그려진다고 본다.
// 여기서 ModalLayer·스토어를 직접 불러오지 않는다 (테스트 파일의 vi.mock보다 먼저 진짜 모듈이 올라가지 않게)
import { preloadScreens } from './features/lazy-screen'
beforeAll(() => preloadScreens())
// 테스트마다 화면 알림 줄(말씀조각 획득·필사 결과)을 비운다 — 스토어를 불러온 테스트만 (game-store가 걸어 둔 함수)
beforeEach(() => (globalThis as { __resetGameUi?: () => void }).__resetGameUi?.())
