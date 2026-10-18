// 화면 한 곳에서 오류가 나도 하얀 화면 대신 안내를 보인다. 저장은 브라우저에 그대로 남아 있다.
import { Component, type ReactNode } from 'react'
import { T } from '../content/text'
import { flushGameStorage } from '../engine/game-storage'
import { StorageNotice } from './StorageNotice'

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="intro" role="alert">
        <h1>{T.ui.errorTitle}</h1>
        <p className="notice">{T.ui.errorBody}</p>
        <div className="actions column">
          <button className="primary" onClick={async () => {
            // 시작 화면의 오류라면 스토어는 아직 새 게임이므로, 기존 칸을 덮어쓰지 않는다.
            try { await flushGameStorage(); globalThis.location?.reload() } catch { /* 복구 팝업에서 안내 */ }
          }}>
            {T.ui.errorReload}
          </button>
        </div>
        <StorageNotice />
      </main>
    )
  }
}
