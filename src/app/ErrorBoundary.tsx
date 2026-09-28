// 화면 한 곳에서 오류가 나도 하얀 화면 대신 안내를 보인다. 저장은 브라우저에 그대로 남아 있다.
import { Component, type ReactNode } from 'react'
import { T } from '../content/text'

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
          <button className="primary" onClick={() => globalThis.location?.reload()}>
            {T.ui.errorReload}
          </button>
        </div>
      </main>
    )
  }
}
