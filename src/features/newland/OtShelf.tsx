// 새 터 서고 안 작은 책장 (계획 20 작업 5, 결정 D12): 필사를 끝낸 구약 책의 책등만 보여 주는 전시.
// 등급·제본·퀴즈·용량·효과가 없다 — 꽂는 것이 아니라 마친 책이 저절로 보일 뿐이다.
// 확장권(계획 21 R9·사용자 결정 ⑦)으로 범위 방이 열리면 열린 방마다 한 줄씩 (서고 목록식), 아직은 서재 한 칸에 모두.
import type { CSSProperties } from 'react'
import { fill, T } from '../../content/text'
import { otBookFinished } from '../../engine/books'
import { OT_BOOKS, OT_ROOMS, otIndex, otRow, type OtBook } from '../../engine/ot-books'
import { t } from '../../shared/i18n'
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

function Spines({ books }: { books: OtBook[] }) {
  return (
    <figure className="shelf-picture" aria-label={T.ot.shelfTitle}>
      <div className="shelf-picture-row">
        {books.map((b) => {
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
  )
}

export function OtShelf() {
  const otProgress = useGame((s) => s.game.otProgress)
  const rooms = useGame((s) => Math.min(OT_ROOMS.length, s.game.flags.otExpand ?? 0))
  const { closeModal } = useGame.getState()
  const done = OT_BOOKS.filter((b) => otBookFinished({ otProgress }, b))
  const open = OT_ROOMS.slice(0, rooms)
  // 아직 방이 열리지 않은 범위의 책은 서재 한 칸에 그대로
  const inStudy = done.filter((b) => !open.some((r) => r.books.includes(b)))
  return (
    <div className="dialog library" role="dialog" aria-label={T.ot.shelfTitle}>
      <h2>{T.ot.shelfTitle}</h2>
      {open.length > 0 && (
        <ul className="rows ot-rooms">
          {open.map((r) => {
            const mine = done.filter((b) => r.books.includes(b))
            return (
              <li key={r.id}>
                <div className="row">
                  <span className="row-main"><b>{r.label}</b></span>
                  <span className="row-meta">{t('ot.roomCount', { done: mine.length, all: r.books.length })}</span>
                </div>
                {mine.length > 0 && <Spines books={mine} />}
              </li>
            )
          })}
        </ul>
      )}
      {done.length === 0 ? <p className="hint">{T.ot.shelfEmpty}</p> : inStudy.length > 0 && <Spines books={inStudy} />}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
