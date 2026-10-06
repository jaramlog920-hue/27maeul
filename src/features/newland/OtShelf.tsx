// 새 터 서고 안 작은 책장 (계획 20 작업 5, 결정 D12): 필사를 끝낸 구약 책의 책등만 보여 주는 전시.
// 등급·제본·퀴즈·용량·효과가 없다 — 꽂는 것이 아니라 마친 책이 저절로 보일 뿐이다.
import type { CSSProperties } from 'react'
import { fill, T } from '../../content/text'
import { otBookFinished } from '../../engine/books'
import { OT_BOOKS, otIndex, otRow } from '../../engine/ot-books'
import { useGame } from '../../store/game-store'

/** 차분한 파스텔 책등 색과 무늬 (책 순서대로 돌아가며 — 좌우 대칭) */
const COLORS: readonly [string, string][] = [
  ['#c9d8c5', '#8fae8a'],
  ['#d9cbb0', '#b39a78'],
  ['#c5d2e0', '#8da4bf'],
  ['#e0cfd2', '#bf9aa1'],
  ['#d6d3e6', '#a29cc4'],
]
const MARKS = ['band', 'stripe', 'dot', 'diamond'] as const

export function OtShelf() {
  const otProgress = useGame((s) => s.game.otProgress)
  const { closeModal } = useGame.getState()
  const done = OT_BOOKS.filter((b) => otBookFinished({ otProgress }, b))
  return (
    <div className="dialog library" role="dialog" aria-label={T.ot.shelfTitle}>
      <h2>{T.ot.shelfTitle}</h2>
      {done.length === 0 ? (
        <p className="hint">{T.ot.shelfEmpty}</p>
      ) : (
        <figure className="shelf-picture" aria-label={T.ot.shelfTitle}>
          <div className="shelf-picture-row">
            {done.map((b) => {
              const i = otIndex(b)
              const [spine, accent] = COLORS[i % COLORS.length]
              const style = { '--spine': spine, '--accent': accent } as CSSProperties
              return (
                <span
                  key={b}
                  className={`spine-art mark-${MARKS[i % MARKS.length]} spine-grade-none`}
                  style={style}
                  role="img"
                  aria-label={fill(T.ot.shelfSpine, { book: otRow(b).name })}
                  data-book={b}
                />
              )
            })}
          </div>
        </figure>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
