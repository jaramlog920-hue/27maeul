import { Component, Suspense, type ReactNode } from 'react'
import { useGame } from '../store/game-store'
import { saveGameAsync } from '../engine/save'

function LoadingScreen() {
  return <div className="dialog" role="dialog" aria-label="화면 불러오기">
    <p role="status">화면을 불러오는 중이에요.</p>
    <button onClick={() => useGame.getState().closeModal()}>닫기</button>
  </div>
}

/** 화면 조각(청크)을 못 받아 생긴 오류인가 — 아니면 화면을 그리다 난 오류 */
const chunkFailed = (e: unknown) => /dynamically imported module|Loading chunk|Importing a module script failed|Failed to fetch/i.test(String((e as Error)?.message ?? e))

/**
 * 청크를 못 받으면 저장을 유지하고 닫거나 다시 접속할 수 있다.
 * 장면을 그리다 오류가 나면 닫기가 그 장면을 대기열에서 빼고 닫는다 — 빼지 않으면 다음 프레임이 같은 장면을 다시 열어
 * 오류 창이 끝없이 되풀이됐다 (2026-10-18 감사 M-16)
 */
export class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean; chunk: boolean }> {
  state = { failed: false, chunk: false }
  static getDerivedStateFromError(error: unknown) { return { failed: true, chunk: chunkFailed(error) } }
  render() {
    if (this.state.failed) return <div className="dialog" role="dialog" aria-label="화면 불러오기 실패">
      {/* 연결 탓은 청크를 못 받았을 때만 — 그리다 난 오류에 '연결 확인'을 띄우면 엉뚱한 곳을 의심한다 (2026-10-26 감사 A01) */}
      <p role="alert">{this.state.chunk ? '화면을 불러오지 못했어요. 연결을 확인하고 다시 접속해 주세요.' : useGame.getState().modal?.kind === 'scene' ? '이 장면을 그리다 문제가 생겼어요. 닫으면 이 장면은 건너뛰고 이어서 할 수 있어요.' : '이 화면을 그리다 문제가 생겼어요. 닫고 다시 열거나, 저장하고 다시 접속해 주세요.'}</p>
      <button onClick={async () => {
        const store = useGame.getState()
        if (await saveGameAsync(store.game)) window.location.reload()
        else store.say('저장하지 못했어요. 저장 공간을 확인해 주세요.', 5000)
      }}>저장하고 다시 접속</button>
      <button onClick={() => useGame.getState().skipBrokenScreen()}>닫기</button>
    </div>
    return <Suspense fallback={<LoadingScreen />}>{this.props.children}</Suspense>
  }
}
