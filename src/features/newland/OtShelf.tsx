// 새 터 서고 안 작은 책장 (계획 20 작업 5, 결정 D12): 필사를 끝낸 구약 책의 책등만 보여 주는 전시.
// 등급·제본·퀴즈·용량·효과가 없다 — 꽂는 것이 아니라 마친 책이 저절로 보일 뿐이다.
// 확장권(계획 21 R9·사용자 결정 ⑦)으로 범위 방이 열리면 열린 방마다 한 줄씩 (서고 목록식), 아직은 서재 한 칸에 모두.
import { useState, type CSSProperties } from 'react'
import { fill, T } from '../../content/text'
import { otBookFinished } from '../../engine/books'
import { OT_BOOKS, OT_ROOMS, otIndex, otRow, type OtBook } from '../../engine/ot-books'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import { CONTENT, neighborById } from '../../content/catalog'
import { canReadOtTogether, otBookRecord, otGroups, otReadFriends, otReadMemories, readOtTogether } from '../../engine/ot-display'
import { saveGame } from '../../engine/save'

/** 차분한 파스텔 책등 색과 무늬 (책 순서대로 돌아가며 — 좌우 대칭) */
const COLORS: readonly [string, string][] = [
  ['#c9d8c5', '#8fae8a'],
  ['#d9cbb0', '#b39a78'],
  ['#c5d2e0', '#8da4bf'],
  ['#e0cfd2', '#bf9aa1'],
  ['#d6d3e6', '#a29cc4'],
]
const MARKS = ['band', 'stripe', 'dot', 'diamond'] as const

function Spines({ books, onPick, picked }: { books: OtBook[]; onPick?: (b: OtBook) => void; picked?: OtBook | null }) {
  return (
    <figure className="shelf-picture" aria-label={T.ot.shelfTitle}>
      <div className="shelf-picture-row">
        {books.map((b) => {
          const i = otIndex(b)
          const [spine, accent] = COLORS[i % COLORS.length]
          const style = { '--spine': spine, '--accent': accent } as CSSProperties
          const art = (
            <span
              key={b}
              className={`spine-art mark-${MARKS[i % MARKS.length]} spine-grade-none`}
              style={style}
              role="img"
              aria-label={fill(T.ot.shelfSpine, { book: otRow(b).name })}
              data-book={b}
            />
          )
          // 책등을 누르면 그 책의 기록대 (2026-10-08)
          return onPick ? (
            <button key={b} type="button" className={`spine-pick${picked === b ? ' on' : ''}`} aria-pressed={picked === b} onClick={() => onPick(b)}>
              {art}
            </button>
          ) : art
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
  // 서재 한 칸의 책도 범위(방 표)별로 묶어 진열한다 (2026-10-08)
  const studyGroups = otGroups({ otProgress }).map((g) => ({ ...g, books: g.books.filter((b) => inStudy.includes(b)) })).filter((g) => g.books.length > 0)
  const [picked, setPicked] = useState<OtBook | null>(null)
  const pick = (b: OtBook) => setPicked((cur) => (cur === b ? null : b))
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
                {mine.length > 0 && <Spines books={mine} onPick={pick} picked={picked} />}
              </li>
            )
          })}
        </ul>
      )}
      {done.length === 0 ? (
        <p className="hint">{T.ot.shelfEmpty}</p>
      ) : (
        studyGroups.map((g) => (
          <div key={g.room.id} className="ot-study-group">
            <p className="row-meta">{g.room.label}</p>
            <Spines books={g.books} onPick={pick} picked={picked} />
          </div>
        ))
      )}
      {picked && <BookRecord book={picked} />}
      <ReadTogether />
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 책별 기록대: 장 수·마친 날·내가 남긴 한 줄 (본문과 구분된 개인 메모) */
function BookRecord({ book }: { book: OtBook }) {
  const game = useGame((s) => s.game)
  const r = otBookRecord(game, book)
  return (
    <section className="ot-record" aria-label={t('otShelf.record', { book: otRow(book).name })}>
      <h3>{t('otShelf.record', { book: otRow(book).name })}</h3>
      <p className="row-meta">
        {t('otShelf.chapters', { n: r.chapters })} · {r.end == null ? t('otShelf.noDate') : t('otShelf.endDay', { day: r.end })}
      </p>
      {r.lines.length === 0 ? (
        <p className="hint">{t('otShelf.noLines')}</p>
      ) : (
        <ul className="rows ot-lines">
          {r.lines.map((l) => (
            <li key={l.chapter}>
              <div className="row">
                <span className="row-meta">{t('otShelf.chapterLine', { n: l.chapter })}</span>
                <span className="row-main">{l.text}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** 함께 읽기: 하루 한 번, 배우자나 마음이 가까운 이웃과 — 함께 읽은 날이 남는다 */
function ReadTogether() {
  const game = useGame((s) => s.game)
  const friends = otReadFriends(game, CONTENT.neighbors)
  const memories = otReadMemories(game, CONTENT.neighbors).slice(0, 5)
  const can = canReadOtTogether(game)
  const read = (npc: string) => {
    const next = readOtTogether(useGame.getState().game, npc, CONTENT.neighbors)
    saveGame(next)
    useGame.setState({ game: next })
    useGame.getState().say(t('otShelf.readDone', { who: neighborById(npc)?.role ?? '' }), 3200)
  }
  if (!friends.length && !memories.length) return null
  return (
    <section className="ot-read" aria-label={t('otShelf.read')}>
      <h3>{t('otShelf.read')}</h3>
      {can && friends.length > 0 && (
        <div className="actions menu">
          {friends.map((id) => (
            <button key={id} onClick={() => read(id)}>{t('otShelf.readWith', { who: neighborById(id)?.role ?? '' })}</button>
          ))}
        </div>
      )}
      {memories.length > 0 && (
        <ul className="rows ot-read-list">
          {memories.map((m) => (
            <li key={m.day}>
              <div className="row">
                <span className="row-main">{t('otShelf.readMemory', { who: neighborById(m.npc)?.role ?? '' })}</span>
                <span className="row-meta">{t('otShelf.day', { day: m.day })}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}