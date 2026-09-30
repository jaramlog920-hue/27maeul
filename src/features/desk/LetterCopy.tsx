// 편지 한 장 옮겨 적기 (계획 7 작업 4, 설계 §7-2 ③): 장 본문을 개역한글 그대로 보이고, 빈칸 셋만 밑줄 칸으로 가린다.
// 칸을 누르면 보기 넷. 맞으면 칸이 채워지고, 틀리면 그 보기가 흐려진다 (불이익 없음, 몇 번이든).
// 빈칸을 모두 맞게 채운 글은 원문과 한 글자도 다르지 않다 (blankParts: 앞 + 답 + 뒤 = 원문, copy.test가 87장 전부 확인).
import { useState } from 'react'
import { copySourceFor, piecesOf } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { blankParts, blanksFor } from '../../engine/copy'
import { stockOf, type SubmitResult } from '../../engine/game'
import { currentChapter } from '../../engine/offers'
import { arrivesOf } from '../../engine/shelf-rooms'
import type { Book } from '../../engine/types'
import { CareLine } from './CareLine'
import { copyPadFor, useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>

const blankId = (i: number) => `copy-blank-${i}`

export function LetterCopy({ book, result, dark, onChangeBook }: { book: Book; result: SubmitResult | null; dark: boolean; onChangeBook: () => void }) {
  const game = useGame((s) => s.game)
  const saved = useGame((s) => (s.modal?.kind === 'desk' ? s.modal.copy : undefined))
  const { copyPick, submitCopy, closeModal } = useGame.getState()
  const [open, setOpen] = useState<number | null>(null)

  const pieces = piecesOf(book)
  const bp = game.progress[book]
  const chapter = currentChapter(pieces, bp.completed)
  const piece = chapter === null ? undefined : pieces.find((p) => p.chapter === chapter)
  const received = !!piece && game.collected.includes(piece.id)
  const src = copySourceFor(book)
  const blanks = chapter === null ? [] : blanksFor(book, chapter, src)
  const pad = copyPadFor(game, saved)
  const got = pad ? pad.picks.filter((p) => p !== null).length : 0
  const allFilled = !!pad && blanks.length > 0 && got === blanks.length
  // 맞힌 칸의 보기는 닫는다
  const shown = open !== null && pad && pad.picks[open] === null ? open : null
  const name = BOOK_NAME[book]
  const title = chapter === null ? fill(T.copy.titleDone, { book: name }) : fill(T.copy.title, { book: name, chapter })

  let message: string | null = null
  let tone = ''
  // 틀린 보기 안내는 그 칸의 보기 바로 아래에 (긴 장에서도 눈앞에 보이게)
  const missHere = pad && pad.miss !== null && shown === pad.miss
  if (result?.kind === 'done') {
    message = fill(T.copy.done, { book: name, chapter: bp.completed.at(-1) ?? '' })
    tone = 'done'
  } else if (result?.kind === 'supplies') {
    message = T.ui.deskSupplies
    tone = 'wrong'
  } else if (result?.kind === 'tired') {
    message = T.ui.deskTired
    tone = 'wrong'
  }

  const jump = (i: number) => {
    if (pad?.picks[i] === null) setOpen(i)
    document.getElementById(blankId(i))?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  }

  return (
    <div className="dialog desk letter-copy" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <p className="hint">
        {fill(T.ui.deskHave, { papyrus: stockOf(game, 'papyrus'), ink: stockOf(game, 'ink') })}
        {received && !dark && pad && <> · {fill(T.copy.filled, { got, all: blanks.length })}</>}
      </p>
      <CareLine />
      {message && (
        <p className={`desk-message ${tone}`} role="status">
          {message}
        </p>
      )}
      {dark ? (
        <p className="desk-message wrong">{T.ui.deskDark}</p>
      ) : chapter === null || !piece ? (
        <p>{T.ui.allDone}</p>
      ) : !received ? (
        <p>{arrivesOf(book) === 'stars' ? T.copy.notReceivedStars : T.copy.notReceived}</p>
      ) : (
        pad && (
          <>
            <p className="hint">{T.copy.hint}</p>
            <div className="copy-jumps">
              {blanks.map((_, i) => (
                <button key={i} className={pad.picks[i] !== null ? 'ok' : ''} aria-label={fill(T.copy.jump, { n: i + 1 })} onClick={() => jump(i)}>
                  {fill(T.copy.blank, { n: i + 1 })}
                  {pad.picks[i] !== null && ' ✓'}
                </button>
              ))}
            </div>
            <section className="passage copy-passage" aria-label={`성경 본문 ${piece.ref}`}>
              <header className="passage-ref">
                <span>{piece.ref}</span>
                <span className="passage-src">{T.ui.bibleSource}</span>
              </header>
              <div className="copy-body">
                {src.versesOf(piece.ref).map((v) => {
                  const num = v.ref.slice(v.ref.lastIndexOf(':') + 1)
                  const i = blanks.findIndex((b) => b.ref === v.ref)
                  if (i < 0)
                    return (
                      <p key={v.ref}>
                        <sup>{num}</sup>
                        {v.text}
                      </p>
                    )
                  const b = blanks[i]
                  const { before, after } = blankParts(v.text, b.index)
                  const pick = pad.picks[i]
                  return (
                    <div key={v.ref} className="copy-verse">
                      <p>
                        <sup>{num}</sup>
                        {before}
                        {pick !== null ? (
                          <span id={blankId(i)} className="copy-blank filled" aria-label={fill(T.copy.blankFilled, { n: i + 1, word: pick })}>
                            {pick}
                          </span>
                        ) : (
                          <button
                            id={blankId(i)}
                            className={`copy-blank ${shown === i ? 'on' : ''}`}
                            aria-label={fill(T.copy.blank, { n: i + 1 })}
                            aria-expanded={shown === i}
                            onClick={() => setOpen(shown === i ? null : i)}
                          >
                            {i + 1}
                          </button>
                        )}
                        {after}
                      </p>
                      {shown === i && (
                        <div className="copy-options" role="group" aria-label={fill(T.copy.options, { n: i + 1 })}>
                          {b.options.map((o) => {
                            const dim = pad.dimmed[i].includes(o)
                            return (
                              <button key={o} className={dim ? 'dim' : ''} disabled={dim} onClick={() => copyPick(i, o)}>
                                {o}
                              </button>
                            )
                          })}
                          {missHere && (
                            <p className="copy-wrong" role="status">
                              {T.copy.wrong}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
        <button onClick={onChangeBook}>{T.ui.bookChange}</button>
        {!dark && received && allFilled && (
          <button className="primary" onClick={submitCopy}>
            {T.copy.submit}
          </button>
        )}
      </div>
    </div>
  )
}
