// 📖 말씀 탭 (계획 14 작업 5): 말씀 루프에서 쌓인 것을 한곳에서 본다 — 필사본 | 말씀 조각 | 하나님 기록 | 연결(작업 9) | 서고.
// 2026-10-04: 따로 있던 선반의 이야기 도감(책 거르기·한 복음서에만·도장)은 말씀 조각으로, 내가 남긴 한 줄은 서고(책 한 줄)·말씀 조각(조각 한 줄)으로 옮겼다.
// 가장 큰 단추는 [이어서 필사하기]. 해설 문장은 없다 — 본문은 개역한글 그대로(versesOf), 지어낸 말은 life-text의 word 칸만.
import { Fragment, useState } from 'react'
import { CONTENT, contextOf, GOD_KEYWORDS, NAMES, neighborById, PIECES, versesOf } from '../../content/catalog'
import { fill, roomTitle, T } from '../../content/text'
import { chaptersOf, groupByRoom } from '../../engine/books'
import { connectionsOf, type Connection } from '../../engine/connections'
import { copySpot } from '../../engine/copying'
import { pieceFrom, whenOf, type PieceLog } from '../../engine/fragments'
import type { GodFind } from '../../engine/god-records'
import { bookLineKey } from '../../engine/game'
import { BOOKS, isGospel, type Book, type Piece } from '../../engine/types'
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

/** "한 복음서에만"(✦)은 네 복음서끼리 견준 표시 — 도장이 없는 복음서 조각에만 붙인다 (사도행전·편지 조각에는 붙이지 않는다) */
export const onlyHere = (p: Piece) => isGospel(p.book) && p.stamps.length === 0

/**
 * 말씀 조각 거르기: 받은 조각 가운데 고른 책·"한 복음서에만"으로 거른다. 고를 수 있는 책은 받은 조각이 있는 책만 (성경 순서).
 * 계획 14부터 27권 어느 책이든 필사하고 조각도 어느 책에서나 오므로, 서고 방이 열렸는지로 거르지 않는다
 */
export function dexView(collected: readonly string[], book: Book | 'all', only: boolean): { books: Book[]; list: Piece[] } {
  const got = new Set(collected)
  const mine = PIECES.filter((p) => got.has(p.id))
  const books = BOOKS.filter((b) => mine.some((p) => p.book === b))
  const pick = book !== 'all' && books.includes(book) ? book : 'all'
  const list = mine.filter((p) => (pick === 'all' || p.book === pick) && (!only || onlyHere(p)))
  return { books, list }
}

/** 본문을 보고 '뒤로' 오거나 창을 다시 열어도 고른 책·거르기를 기억한다 */
let rememberOnly = false
let rememberBook: Book | 'all' = 'all'

export function Word({ tab: first = 'copy' }: { tab?: WordTab }) {
  const [tab, setTab] = useState<WordTab>(first)
  const book = useGame((s) => s.game.copy.book)
  const { closeModal, wordContinue } = useGame.getState()
  const tabs: [WordTab, string][] = [
    ['copy', W.tabs.copy],
    ['pieces', W.tabs.pieces],
    ['god', W.tabs.god],
    ['links', W.tabs.links],
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
      {tab === 'links' && <Links />}
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

/** 말씀 조각 도감: 받은 조각만 성경 순서로, 받은 기록·도장·나의 한 줄과 [본문에서 보기]. 책 거르기·"한 복음서에만" */
function PieceDex() {
  const collected = useGame((s) => s.game.collected)
  const log = useGame((s) => s.game.pieceLog ?? {})
  const lines = useGame((s) => s.game.myLines)
  const [view, setView] = useState<string | null>(null)
  const [only, setOnlyState] = useState(rememberOnly)
  const setOnly = (v: boolean) => {
    rememberOnly = v
    setOnlyState(v)
  }
  const [book, setBookState] = useState(rememberBook)
  const setBook = (b: Book | 'all') => {
    rememberBook = b
    setBookState(b)
  }
  const all = dexView(collected, 'all', false)
  const got = all.list.length
  const { books, list } = dexView(collected, book, only)
  const pick = book !== 'all' && books.includes(book) ? book : 'all'
  const gospels = all.list.some((p) => isGospel(p.book))
  const groups = piecesByBook(list.map((p) => p.id))
  const rooms = groupByRoom(books)
  if (view) {
    const p = PIECES.find((x) => x.id === view)
    if (p) return <PieceContext piece={p} onBack={() => setView(null)} />
  }
  const filterButton = (b: Book | 'all') => (
    <button key={b} className={pick === b ? 'on' : ''} aria-pressed={pick === b} onClick={() => setBook(b)}>
      {b === 'all' ? T.ui.dexBookAll : BOOK_NAME[b]}
    </button>
  )
  return (
    <section className="word-pieces" aria-label={W.tabs.pieces}>
      <p className="hint">{fill(W.piecesCount, { got, all: PIECES.length })}</p>
      {got === 0 ? (
        <p>{W.piecesEmpty}</p>
      ) : (
        <>
          <p className="hint">{W.piecesNote}</p>
          {/* 책 거르기: 받은 조각이 있는 책만, 서고의 방으로 묶어서 (방이 둘 이상일 때만 방 이름) */}
          {books.length > 1 && (
            <div className="dex-filter" role="group" aria-label={T.ui.dexBookPick}>
              {filterButton('all')}
              {rooms.map(({ room, books: bs }) => (
                <Fragment key={room.id}>
                  {rooms.length > 1 && <span className="dex-room-name">{roomTitle(room)}</span>}
                  {bs.map(filterButton)}
                </Fragment>
              ))}
            </div>
          )}
          {gospels && (
            <>
              <div className="dex-filter">
                <button className={!only ? 'on' : ''} aria-pressed={!only} onClick={() => setOnly(false)}>
                  {T.ui.dexAll}
                </button>
                <button className={only ? 'on' : ''} aria-pressed={only} onClick={() => setOnly(true)}>
                  ✦ {T.ui.dexOnly}
                </button>
                <span className="hint">{fill(T.ui.dexCount, { got: list.length, all: got })}</span>
              </div>
              <p className="stamp-note">{T.ui.stampNote}</p>
            </>
          )}
          {list.length === 0 && <p className="hint">{W.piecesNone}</p>}
          {groups.map(({ book: b, pieces }) => (
            <Fragment key={b}>
              <h3>{BOOK_NAME[b]}</h3>
              <ul className="word-piece-list">
                {pieces.map((p) => (
                  <li key={p.id} className={`word-piece${onlyHere(p) ? ' only' : ''}`}>
                    <span className="piece-title">{p.title}</span>
                    <span className="piece-ref">{p.ref}</span>
                    {p.stamps.length > 0 && (
                      <span className="dex-stamps">
                        {p.stamps.map((st) => (
                          <span key={st.ref} className={`mini-stamp ${st.kind}`}>
                            {st.ref.split(' ')[0]}
                            {st.kind === 'similar' ? '≈' : ''}
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="word-got">{gotLabel(log, p.id)}</span>
                    {lines[p.id] && (
                      <p className="word-myline">
                        <span>{T.ui.myLine}</span>
                        <q>{lines[p.id]}</q>
                      </p>
                    )}
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

/**
 * 연결 (계획 14 작업 9): 내가 필사한 곳에서 다시 만난 사람·곳 — 이름마다 필사한 곳 수와 책 차례(마태복음 → … → 사도행전).
 * 이름을 누르면 그 구절들의 본문. 해설 문장은 없다 (이름·구절·본문만)
 */
function Links() {
  const progress = useGame((s) => s.game.progress)
  const copy = useGame((s) => s.game.copy)
  const [open, setOpen] = useState<string | null>(null)
  const links = connectionsOf(NAMES, { progress, copy })
  if (!links.length) return <p className="word-links-empty">{W.linksEmpty}</p>
  const people = links.filter((l) => l.kind === '사람')
  const places = links.filter((l) => l.kind === '곳')
  const group = (title: string, list: Connection[]) =>
    list.length > 0 && (
      <>
        <h3>{title}</h3>
        <ul className="word-god-list word-links-list">
          {list.map((l) => {
            const on = open === l.name
            return (
              <li key={l.name}>
                <button className={`word-god-key word-links-key${on ? ' on' : ''}`} aria-expanded={on} onClick={() => setOpen(on ? null : l.name)}>
                  <span className="word-links-name">{l.name}</span>
                  <span className="hint">{fill(W.linksCount, { n: l.places.length })}</span>
                  <span className="word-links-books">{l.books.map((b) => BOOK_NAME[b]).join(W.linksArrow)}</span>
                </button>
                {on && (
                  <ul className="word-god-verses">
                    {l.places.map((p) => (
                      <li key={p.ref}>
                        <p className="copy-god-key">{p.ref}</p>
                        <p className="copy-god-verse">{versesOf(p.ref).map((v) => v.text).join(' ')}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </>
    )
  return (
    <section className="word-links" aria-label={W.tabs.links}>
      <p className="hint">{fill(W.linksTotal, { p: people.length, q: places.length })}</p>
      <p className="hint">{W.linksNote}</p>
      {group(W.linksPeople, people)}
      {group(W.linksPlaces, places)}
    </section>
  )
}

/** 서고: 27권 현황 — 마친 장·제본·꽂힘·책등, 꽂은 책의 나의 한 줄 (서고 방으로 묶어서). 집 선반을 누르면 이 칸이 열린다 */
function LibraryStatus() {
  const progress = useGame((s) => s.game.progress)
  const bound = useGame((s) => s.game.bound)
  const shelved = useGame((s) => s.game.shelved)
  const lines = useGame((s) => s.game.myLines)
  const open = useGame((s) => s.open)
  const openBook = useGame((s) => s.openBook)
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
              const line = lines[bookLineKey(b)]
              return (
                <li key={b} className="word-lib-row" data-book={b}>
                  {has ? <Spine book={b} binding={bd} grade={g} /> : <span className="spine-slot" aria-hidden="true" />}
                  <span className="word-lib-name">{BOOK_NAME[b]}</span>
                  <span className="word-lib-ch">{fill(W.libChapters, { done: progress[b].completed.length, all: chaptersOf(b, CONTENT).length })}</span>
                  <span className="word-lib-bound">{bd ? (bd.special ? W.libSpecial : W.libBound) : W.libNotBound}</span>
                  <span className="word-lib-shelf">{g !== undefined ? fill(W.libShelved, { grade: grades[g] }) : W.libNotShelved}</span>
                  {/* 다 쓴 책은 펼쳐 볼 수 있다 — 첫 쪽의 나의 필사 기록, 내가 필사한 본문, 이 책에서 발견한 기록 (계획 14 작업 8) */}
                  {has && (
                    <button className="word-lib-open" onClick={() => openBook(b, 'word')} aria-label={`${BOOK_NAME[b]} · ${T.bookView.open}`}>
                      {T.bookView.open}
                    </button>
                  )}
                  {/* 책 한 줄: 서고에 꽂은 책마다 (나중에 적거나 고칠 수 있다) */}
                  {(g !== undefined || line !== undefined) && (
                    <div className="word-lib-line">
                      <span className="word-lib-line-label">{T.ui.myLine}</span>
                      {line ? <q>{line}</q> : <span className="hint">{T.ui.bookLineNone}</span>}
                      <button onClick={() => open({ kind: 'myLine', lineKey: bookLineKey(b), back: 'word' })}>{line ? T.ui.bookLineEdit : T.ui.bookLineWrite}</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Fragment>
      ))}
    </section>
  )
}
