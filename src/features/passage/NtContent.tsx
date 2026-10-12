import { useEffect, useState, type ReactNode } from 'react'
import { ensureNtBooks, ntLoaded } from '../../content/nt-loader'
import type { Book } from '../../engine/types'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'

/** 본문을 쓰는 화면만 기다린다. 창을 닫거나 책을 바꾸면 이전 요청의 UI 갱신을 취소한다. */
export function NtContent({ books, children, onCancel }: { books: readonly Book[]; children: ReactNode; onCancel?: () => void }) {
  const key = [...new Set(books)].sort().join(',')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [, refresh] = useState(0)
  const ready = books.every(ntLoaded)
  useEffect(() => {
    let active = true
    setError('')
    if (key) ensureNtBooks(key.split(',') as Book[]).then(
      () => { if (active) refresh(n => n + 1) },
      () => { if (active) setError('본문을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.') },
    )
    return () => { active = false }
  }, [key, attempt])
  if (ready) return children
  return <div className="content-loading">
    <p role={error ? 'alert' : 'status'}>{error || '본문을 불러오는 중이에요.'}</p>
    {error && <>
      <button onClick={() => setAttempt(n => n + 1)}>다시 불러오기</button>
      <button onClick={() => {
        // 브라우저가 실패한 import를 기억하면 같은 페이지의 재시도로 복구되지 않는다.
        const store = useGame.getState()
        if (saveGame(store.game)) window.location.reload()
        else store.say('저장하지 못했어요. 저장 공간을 확인해 주세요.', 5000)
      }}>저장하고 다시 접속</button>
    </>}
    {onCancel && <button onClick={onCancel}>닫기</button>}
  </div>
}
