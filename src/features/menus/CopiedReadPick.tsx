import { useEffect, useRef, useState } from 'react'
import { CONTENT } from '../../content/catalog'
import { ensureOtBook } from '../../content/ot-catalog'
import { ensureNtBook } from '../../content/nt-loader'
import { copyBookName, T } from '../../content/text'
import { copiedChapters, copiedReadingVerses, type CopiedChapter } from '../../engine/copied-reading'
import { chapterUnit, isOtBook } from '../../engine/ot-books'
import { t } from '../../shared/i18n'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'

export function CopiedReadPick() {
  const game = useGame(s => s.game)
  const { closeModal, readCopiedAt } = useGame.getState()
  const [book, setBook] = useState('all')
  const [selected, setSelected] = useState<CopiedChapter | null>(null)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const request = useRef(0)
  useEffect(() => () => { request.current++ }, [])
  const entries = copiedChapters(game, CONTENT)
  const label = (entry: CopiedChapter) => `${copyBookName(entry.book)} ${entry.chapter}${chapterUnit(entry.book)}`
  const choose = async (entry: CopiedChapter) => {
    const id = ++request.current
    setPending(true)
    setFailed(false)
    try {
      if (isOtBook(entry.book)) await ensureOtBook(entry.book)
      else await ensureNtBook(entry.book)
      if (id === request.current && readCopiedAt(entry.book, entry.chapter)) setSelected(entry)
    } catch {
      if (id === request.current) setFailed(true)
    } finally {
      if (id === request.current) setPending(false)
    }
  }
  if (selected) {
    const verses = copiedReadingVerses(selected, CONTENT)
    return (
      <div className="dialog book-view" role="dialog" aria-label={label(selected)}>
        <h2>{label(selected)}</h2>
        <section className="passage book-read" aria-label={t('copiedRead.passage', { chapter: label(selected) })}>
          <header className="passage-ref"><span>{selected.through === null ? t('copiedRead.complete') : t('copiedRead.partial', { n: verses.length })}</span><span className="passage-src">{T.ui.bibleSource}</span></header>
          <div className="passage-body">{verses.map(v => <p key={v.verse}><sup>{v.verse}</sup>{v.text}</p>)}</div>
        </section>
        <div className="actions">
          <button onClick={() => setSelected(null)}>{t('copiedRead.back')}</button>
          <button data-close onClick={closeModal}>{T.ui.close}</button>
        </div>
      </div>
    )
  }
  const books = [...new Set(entries.map(entry => entry.book))]
  return (
    <div className="dialog" role="dialog" aria-label={t('copiedRead.title')}>
      <h2>{t('copiedRead.title')}</h2>
      <p className="hint">{t('copiedRead.lead')}</p>
      {entries.length ? <>
        <label>{t('copiedRead.book')} <select value={book} onChange={e => setBook(e.target.value)} disabled={pending}>
          <option value="all">{t('copiedRead.all')}</option>
          {books.map(id => <option key={id} value={id}>{copyBookName(id)}</option>)}
        </select></label>
        <ul className="dex-list read-list">
          {entries.filter(entry => book === 'all' || entry.book === book).map(entry => (
            <li key={`${entry.book}:${entry.chapter}`}><button className="dex-item" disabled={pending} onClick={() => void choose(entry)}>
              <span className="piece-title">{label(entry)}</span><span className="piece-ref">{entry.through === null ? t('copiedRead.complete') : t('copiedRead.inProgress')}</span>
            </button></li>
          ))}
        </ul>
      </> : <p>{t('copiedRead.empty')}</p>}
      {pending && <p role="status">{T.ot.opening}</p>}
      {failed && <>
        <p role="status">{t('copiedRead.failed')}</p>
        {/* 브라우저가 실패한 본문 받기를 기억하면 다시 골라도 안 열린다 — 다른 본문 화면처럼 저장하고 다시 접속 (2026-10-12 MOB-01) */}
        <div className="actions"><button onClick={() => {
          const store = useGame.getState()
          if (saveGame(store.game)) window.location.reload()
          else store.say(t('copiedRead.saveFailed'), 5000)
        }}>{t('copiedRead.reload')}</button></div>
      </>}
      <div className="actions"><button data-close onClick={closeModal}>{T.ui.close}</button></div>
    </div>
  )
}
