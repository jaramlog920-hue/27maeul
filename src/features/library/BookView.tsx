// 완성본 펼쳐 보기 (계획 14 작업 8): 서고·방 선반·말씀 › 서고·집 책장에서 다 쓴 책을 누르면 —
// 첫 쪽: 제본한 모습(표지·책등)과 나의 필사 기록(쓰기 시작한 날·마친 날·절·글자, 예전에 엮은 장은 조용히 한 줄).
// [펼쳐 보기]: 내가 마친 장의 본문을 장마다 (개역한글 그대로 — 필사할 때와 같은 절, 본문 없는 절은 빠진다).
// [이 책에서 발견한 하나님 기록]: 키워드 — 구절, 누르면 구절 본문. 해설 문장은 없다.
import { Fragment, useState } from 'react'
import { CONTENT, GOD_KEYWORDS, versesOf } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { bookGodFinds, bookRecord, readChapters } from '../../engine/finished-books'
import { bookBackModal, useGame, type Modal } from '../../store/game-store'
import { dayLabel } from '../word/Word'
import { BookCover, Spine } from './BookArt'

const BOOK_NAME = T.quiz.books as Record<string, string>
const BV = T.bookView
type Page = 'record' | 'read' | 'god'

export function BookView({ modal }: { modal: Extract<Modal, { kind: 'bookView' }> }) {
  const game = useGame((s) => s.game)
  const { open, closeModal } = useGame.getState()
  const [page, setPage] = useState<Page>('record')
  const [at, setAt] = useState(0)
  const { book } = modal
  const name = BOOK_NAME[book]
  const binding = game.bound[book]
  const chapters = readChapters(game, book, CONTENT)
  const groups = bookGodFinds(game.godRecords, book, Object.keys(GOD_KEYWORDS))
  const findCount = groups.reduce((n, g) => n + g.finds.length, 0)
  const close = () => {
    const back = bookBackModal(modal.back)
    if (back) open(back)
    else closeModal()
  }
  const label = fill(BV.label, { book: name })

  if (page === 'read' && chapters.length) {
    const i = Math.min(at, chapters.length - 1)
    const ch = chapters[i]
    return (
      <div className="dialog book-view" role="dialog" aria-label={label}>
        <section className="passage book-read" aria-label={fill(BV.chapter, { book: name, chapter: ch.chapter })}>
          <header className="passage-ref">
            <span>
              {fill(BV.chapter, { book: name, chapter: ch.chapter })}
              {ch.legacy && <span className="book-read-legacy"> · {BV.legacyChapter}</span>}
            </span>
            <span className="passage-src">{T.ui.bibleSource}</span>
          </header>
          <div className="passage-body" key={ch.chapter}>
            {ch.verses.map((v) => (
              <p key={v.verse}>
                <sup>{v.verse}</sup>
                {v.text}
              </p>
            ))}
          </div>
        </section>
        <p className="hint book-read-of">{fill(BV.chapterOf, { i: i + 1, n: chapters.length })}</p>
        {chapters.length > 1 && (
          <div className="book-read-pick" role="group" aria-label={BV.pick}>
            {chapters.map((c, k) => (
              <button key={c.chapter} className={k === i ? 'on' : ''} aria-pressed={k === i} onClick={() => setAt(k)}>
                {c.chapter}
              </button>
            ))}
          </div>
        )}
        <div className="actions">
          <button disabled={i === 0} onClick={() => setAt(i - 1)}>
            {BV.prev}
          </button>
          <button disabled={i === chapters.length - 1} onClick={() => setAt(i + 1)}>
            {BV.next}
          </button>
          <button onClick={() => setPage('record')}>{BV.first}</button>
        </div>
      </div>
    )
  }

  if (page === 'god') return <BookGod name={name} label={label} groups={groups} onBack={() => setPage('record')} />

  const rec = bookRecord(game, book, CONTENT)
  // 예전에 엮은 책(필사가 생기기 전에 마친 책)은 숫자 없이 조용히 한 줄 — 0절·0자를 보여 주지 않는다
  const onlyLegacy = rec.copied === 0 && rec.legacy > 0
  const rows: [string, string][] = onlyLegacy
    ? []
    : [
        [BV.start, rec.start === null ? BV.none : dayLabel(rec.start)],
        [BV.end, rec.end === null ? BV.none : dayLabel(rec.end)],
        [BV.verses, rec.verses.toLocaleString('ko-KR')],
        [BV.chars, rec.chars.toLocaleString('ko-KR')],
      ]
  if (rec.bound !== null) rows.push([BV.bound, dayLabel(rec.bound)])
  return (
    <div className="dialog book-view" role="dialog" aria-label={label}>
      <div className="book-view-head">
        <BookCover book={book} binding={binding} />
        <div className="book-view-title">
          <h2>{name}</h2>
          <Spine book={book} binding={binding} grade={game.shelved[book]} />
        </div>
      </div>
      <h3>{BV.recordTitle}</h3>
      {rows.length > 0 && (
        <dl className="word-stats book-view-stats">
          {rows.map(([k, v]) => (
            <Fragment key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Fragment>
          ))}
        </dl>
      )}
      {onlyLegacy ? <p className="hint">{BV.legacyAll}</p> : rec.legacy > 0 && <p className="hint">{fill(BV.legacy, { n: rec.legacy })}</p>}
      <div className="book-view-open">
        <button
          className="primary"
          disabled={!chapters.length}
          onClick={() => {
            setAt(0)
            setPage('read')
          }}
        >
          {BV.read}
        </button>
        <button onClick={() => setPage('god')}>
          {BV.god} <span className="hint">{findCount}</span>
        </button>
      </div>
      <div className="actions">
        <button onClick={close}>{BV.close}</button>
      </div>
    </div>
  )
}

/** 이 책에서 발견한 하나님 기록: 키워드 — 구절, 누르면 구절 본문 (개역한글 그대로) */
function BookGod({ name, label, groups, onBack }: { name: string; label: string; groups: ReturnType<typeof bookGodFinds>; onBack: () => void }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="dialog book-view" role="dialog" aria-label={label}>
      <h2>{name}</h2>
      <h3>{BV.god}</h3>
      {groups.length === 0 ? (
        <p className="hint">{BV.godEmpty}</p>
      ) : (
        <ul className="word-god-list book-god-list">
          {groups.flatMap((g) =>
            g.finds.map((f) => {
              const id = `${f.keyword}|${f.ref}`
              const on = open === id
              const kw = GOD_KEYWORDS[f.keyword]?.name ?? f.keyword
              return (
                <li key={id}>
                  <button className={`word-god-key${on ? ' on' : ''}`} aria-expanded={on} onClick={() => setOpen(on ? null : id)}>
                    <span>{kw}</span>
                    <span className="hint">{f.ref}</span>
                  </button>
                  {on && <p className="copy-god-verse book-god-verse">{versesOf(f.ref).map((v) => v.text).join(' ')}</p>}
                </li>
              )
            }),
          )}
        </ul>
      )}
      <div className="actions">
        <button onClick={onBack}>{BV.first}</button>
      </div>
    </div>
  )
}
