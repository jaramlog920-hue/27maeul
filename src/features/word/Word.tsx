// 📖 말씀 탭 (계획 14 작업 5): 말씀 루프에서 쌓인 것을 한곳에서 본다 — 필사본 | 말씀 조각 | 하나님 기록 | 서고.
// 가장 큰 단추는 [이어서 필사하기]. 해설 문장은 없다 — 본문은 개역한글 그대로(versesOf), 지어낸 말은 life-text의 word 칸만.
import { Fragment, useState } from 'react'
import { CONTENT, contextOf, GOD_KEYWORDS, neighborById, PIECES, versesOf } from '../../content/catalog'
import { fill, roomTitle, T } from '../../content/text'
import { chaptersOf, groupByRoom } from '../../engine/books'
import { copySpot } from '../../engine/copying'
import { pieceFrom, whenOf, type PieceLog } from '../../engine/fragments'
import type { GodFind } from '../../engine/god-records'
import { BOOKS, type Book, type Piece } from '../../engine/types'
import { useGame, type WordTab } from '../../store/game-store'
import { Spine } from '../library/BookArt'

const W = T.word
const BOOK_NAME = T.quiz.books as Record<string, string>
const SEASON = T.ui.season as Record<string, string>

/** 날 → "3년째 봄 15일" */
export function dayLabel(day: number): string {
  const w = whenOf(day)
  return fill(W.whenDay, { year: w.year, season: SEASON[w.season], d: w.d })
}

/** 받은 기록 한 줄: "3년째 봄 · 빵 굽는 이웃에게 받은 조각" — 기록이 없는 옛 조각은 "언제 받았는지 남아 있지 않은 조각" */
export function gotLabel(log: PieceLog, pieceId: string): string {
  const got = log[pieceId]
  const src = pieceFrom(got?.from)
  if (!got || src.kind === 'unknown') return W.from.unknown
  const w = whenOf(got.day)
  const when = fill(W.when, { year: w.year, season: SEASON[w.season] })
  const how = src.kind === 'npc' ? fill(W.from.npc, { who: neighborById(src.who)?.role ?? src.who }) : W.from[src.kind]
  return `${when} · ${how}`
}

const PIECE_ORDER = new Map(PIECES.map((p, i) => [p.id, i]))
/** 받은 조각을 성경 순서로 (책 순서 → 장 → 본문 순서), 책마다 묶어서 */
export function piecesByBook(collected: readonly string[]): { book: Book; pieces: Piece[] }[] {
  const got = new Set(collected)
  const list = PIECES.filter((p) => got.has(p.id)).sort((a, b) => PIECE_ORDER.get(a.id)! - PIECE_ORDER.get(b.id)!)
  return BOOKS.map((book) => ({ book, pieces: list.filter((p) => p.book === book) })).filter((g) => g.pieces.length > 0)
}

/** 하나님 기록을 키워드별로 (키워드 목록 순서), 같은 키워드의 구절은 발견한 차례대로 쌓인다 */
export function godByKeyword(finds: readonly GodFind[]): { keyword: string; name: string; finds: GodFind[] }[] {
  const order = Object.keys(GOD_KEYWORDS)
  const known = [...order, ...finds.map((f) => f.keyword).filter((k) => !order.includes(k))]
  return [...new Set(known)]
    .map((keyword) => ({ keyword, name: GOD_KEYWORDS[keyword]?.name ?? keyword, finds: finds.filter((f) => f.keyword === keyword) }))
    .filter((g) => g.finds.length > 0)
}

export function Word({ tab: first = 'copy' }: { tab?: WordTab }) {
  const [tab, setTab] = useState<WordTab>(first)
  const book = useGame((s) => s.game.copy.book)
  const { closeModal, wordContinue } = useGame.getState()
  const tabs: [WordTab, string][] = [
    ['copy', W.tabs.copy],
    ['pieces', W.tabs.pieces],
    ['god', W.tabs.god],
    ['library', W.tabs.library],
  ]
  return (
    <div className="dialog shelf word" role="dialog" aria-label={W.title}>
      <div className="shelf-head">
        <h2>{W.title}</h2>
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
      {/* 첫 화면 가장 큰 단추 */}
      <button className="primary word-continue" onClick={wordContinue}>
        {book ? W.continue : W.start}
      </button>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'copy' && <CopyRecord />}
      {tab === 'pieces' && <PieceDex />}
      {tab === 'god' && <GodRecords />}
      {tab === 'library' && <LibraryStatus />}
    </div>
  )
}

/** 필사본: 지금 위치, 장·권 진행, 나의 필사 기록 */
function CopyRecord() {
  const game = useGame((s) => s.game)
  const book = game.copy.book
  const spot = book ? copySpot(game, book, CONTENT) : null
  const stats = game.copyStats
  const all = BOOKS.reduce((n, b) => n + chaptersOf(b, CONTENT).length, 0)
  const done = BOOKS.reduce((n, b) => n + game.progress[b].completed.length, 0)
  const booksDone = BOOKS.filter((b) => {
    const chs = chaptersOf(b, CONTENT)
    return chs.length > 0 && chs.every((c) => game.progress[b].completed.includes(c))
  }).length
  const legacy = BOOKS.reduce((n, b) => n + (game.copy.legacy[b]?.length ?? 0), 0)
  const rows: [string, string][] = [
    [W.recVerses, stats.verses.toLocaleString('ko-KR')],
    [W.recChars, stats.chars.toLocaleString('ko-KR')],
    [W.recChapters, String(stats.chapters)],
    [W.recBooks, String(stats.books)],
    [W.recFirst, stats.firstDay === null ? W.firstNone : dayLabel(stats.firstDay)],
  ]
  return (
    <section className="word-copy" aria-label={W.tabs.copy}>
      <p className="word-now">
        {!book ? W.nowNone : spot ? fill(W.nowAt, { book: BOOK_NAME[book], chapter: spot.chapter, verse: spot.verse.verse }) : fill(W.nowDone, { book: BOOK_NAME[book] })}
      </p>
      {book && (
        <p className="hint">{fill(W.bookProgress, { book: BOOK_NAME[book], done: game.progress[book].completed.length, all: chaptersOf(book, CONTENT).length })}</p>
      )}
      <p className="hint">{fill(W.allProgress, { done, all, books: booksDone })}</p>
      <div className="word-bar" role="progressbar" aria-label={W.tabs.copy} aria-valuemin={0} aria-valuemax={all} aria-valuenow={done}>
        <span style={{ width: `${all ? (done / all) * 100 : 0}%` }} />
      </div>
      <h3>{W.recordTitle}</h3>
      <dl className="word-stats">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </Fragment>
        ))}
      </dl>
      {legacy > 0 && <p className="hint">{fill(W.legacy, { n: legacy })}</p>}
    </section>
  )
}

/** 말씀 조각 도감: 받은 조각만 성경 순서로, 받은 기록과 [본문에서 보기] */
function PieceDex() {
  const collected = useGame((s) => s.game.collected)
  const log = useGame((s) => s.game.pieceLog ?? {})
  const [view, setView] = useState<string | null>(null)
  const groups = piecesByBook(collected)
  const got = groups.reduce((n, g) => n + g.pieces.length, 0)
  if (view) {
    const p = PIECES.find((x) => x.id === view)
    if (p) return <PieceContext piece={p} onBack={() => setView(null)} />
  }
  return (
    <section className="word-pieces" aria-label={W.tabs.pieces}>
      <p className="hint">{fill(W.piecesCount, { got, all: PIECES.length })}</p>
      {got === 0 ? (
        <p>{W.piecesEmpty}</p>
      ) : (
        <>
          <p className="hint">{W.piecesNote}</p>
          {groups.map(({ book, pieces }) => (
            <Fragment key={book}>
              <h3>{BOOK_NAME[book]}</h3>
              <ul className="word-piece-list">
                {pieces.map((p) => (
                  <li key={p.id} className="word-piece">
                    <span className="piece-title">{p.title}</span>
                    <span className="piece-ref">{p.ref}</span>
                    <span className="word-got">{gotLabel(log, p.id)}</span>
                    <button onClick={() => setView(p.id)} aria-label={`${W.viewText} · ${p.ref}`}>
                      {W.viewText}
                    </button>
                  </li>
                ))}
              </ul>
            </Fragment>
          ))}
        </>
      )}
    </section>
  )
}

/** [본문에서 보기]: 조각 구간과 앞뒤 문맥 (조각 부분은 진하게) */
function PieceContext({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  const verses = contextOf(piece.ref)
  const many = new Set(verses.map((v) => v.chapter)).size > 1
  return (
    <section className="passage word-context" aria-label={fill(W.contextLabel, { ref: piece.ref })}>
      <header className="passage-ref">
        <span>
          {piece.title} · {piece.ref}
        </span>
        <span className="passage-src">{T.ui.bibleSource}</span>
      </header>
      <p className="hint">{W.context}</p>
      <div className="passage-body">
        {verses.map((v) => (
          <p key={`${v.chapter}:${v.verse}`} className={v.inPiece ? 'in-piece' : 'around'}>
            <sup>{many ? `${v.chapter}:${v.verse}` : v.verse}</sup>
            {v.text}
          </p>
        ))}
      </div>
      <div className="actions">
        <button onClick={onBack}>{W.back}</button>
      </div>
    </section>
  )
}

/** 하나님 기록: 키워드별로 쌓인 근거 구절 — 키워드를 누르면 구절 본문 */
function GodRecords() {
  const finds = useGame((s) => s.game.godRecords)
  const [open, setOpen] = useState<string | null>(null)
  const groups = godByKeyword(finds)
  if (!groups.length) return <p className="word-god-empty">{W.godEmpty}</p>
  return (
    <section className="word-god" aria-label={W.tabs.god}>
      <p className="hint">{fill(W.godTotal, { k: groups.length, n: finds.length })}</p>
      <ul className="word-god-list">
        {groups.map((g) => {
          const on = open === g.keyword
          return (
            <li key={g.keyword}>
              <button className={`word-god-key${on ? ' on' : ''}`} aria-expanded={on} onClick={() => setOpen(on ? null : g.keyword)}>
                <span>{g.name}</span>
                <span className="hint">{fill(W.godCount, { n: g.finds.length })}</span>
              </button>
              {on && (
                <ul className="word-god-verses">
                  {g.finds.map((f) => (
                    <li key={f.ref}>
                      <p className="copy-god-key">{f.ref}</p>
                      <p className="copy-god-verse">{versesOf(f.ref).map((v) => v.text).join(' ')}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** 서고: 27권 현황 — 마친 장·제본·꽂힘·책등 (서고 방으로 묶어서) */
function LibraryStatus() {
  const progress = useGame((s) => s.game.progress)
  const bound = useGame((s) => s.game.bound)
  const shelved = useGame((s) => s.game.shelved)
  const n = BOOKS.filter((b) => shelved[b] !== undefined).length
  const grades = T.library.grades as string[]
  return (
    <section className="word-library" aria-label={W.tabs.library}>
      <p className="hint">{fill(W.libCount, { n })}</p>
      {groupByRoom(BOOKS).map(({ room, books }) => (
        <Fragment key={room.id}>
          <h3>{roomTitle(room)}</h3>
          <ul className="word-lib-list">
            {books.map((b) => {
              const g = shelved[b]
              const bd = bound[b]
              const has = g !== undefined || bd !== undefined
              return (
                <li key={b} className="word-lib-row" data-book={b}>
                  {has ? <Spine book={b} binding={bd} grade={g} /> : <span className="spine-slot" aria-hidden="true" />}
                  <span className="word-lib-name">{BOOK_NAME[b]}</span>
                  <span className="word-lib-ch">{fill(W.libChapters, { done: progress[b].completed.length, all: chaptersOf(b, CONTENT).length })}</span>
                  <span className="word-lib-bound">{bd ? (bd.special ? W.libSpecial : W.libBound) : W.libNotBound}</span>
                  <span className="word-lib-shelf">{g !== undefined ? fill(W.libShelved, { grade: grades[g] }) : W.libNotShelved}</span>
                </li>
              )
            })}
          </ul>
        </Fragment>
      ))}
    </section>
  )
}
