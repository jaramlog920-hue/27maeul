import { Component, Suspense, type ReactNode } from 'react'
import { useGame } from '../store/game-store'
import { saveGame } from '../engine/save'

function LoadingScreen() {
  return <div className="dialog" role="dialog" aria-label="화면 불러오기">
    <p role="status">화면을 불러오는 중이에요.</p>
    <button onClick={() => useGame.getState().closeModal()}>닫기</button>
  </div>
}

/** 청크를 못 받으면 저장을 유지하고 닫거나 다시 접속할 수 있다. */
export class ScreenBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <div className="dialog" role="dialog" aria-label="화면 불러오기 실패">
      <p role="alert">화면을 불러오지 못했어요. 연결을 확인하고 다시 접속해 주세요.</p>
      <button onClick={() => {
        const store = useGame.getState()
        if (saveGame(store.game)) window.location.reload()
        else store.say('저장하지 못했어요. 저장 공간을 확인해 주세요.', 5000)
      }}>저장하고 다시 접속</button>
      <button onClick={() => useGame.getState().closeModal()}>닫기</button>
    </div>
    return <Suspense fallback={<LoadingScreen />}>{this.props.children}</Suspense>
  }
}
