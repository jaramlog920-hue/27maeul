// 책상: 들은 이야기를 차례대로 잇는다 (눅 1:3)
import { useState } from 'react'
import { PIECES, pieceById } from '../../content/catalog'
import { Passage } from '../passage/Passage'
import { fill, T } from '../../content/text'
import type { SubmitResult } from '../../engine/game'
import { currentChapter } from '../../engine/offers'
import { useGame } from '../../store/game-store'

export function Desk({ result, dark }: { result: SubmitResult | null; dark: boolean }) {
  const [reading, setReading] = useState<string | null>(null)
  const arrangement = useGame((s) => s.game.arrangement)
  const completed = useGame((s) => s.game.completed)
  const inv = useGame((s) => s.game.inv)
  const { moveInDesk, submitDesk, closeModal } = useGame.getState()
  const chapter = currentChapter(PIECES, completed)
  const list = chapter === null ? [] : (arrangement[chapter] ?? [])
  const all = chapter === null ? 0 : PIECES.filter((p) => p.chapter === chapter).length

  let message: string | null = null
  if (result?.kind === 'missing') message = fill(T.ui.deskMissing, { n: result.missing })
  else if (result?.kind === 'wrong') message = T.ui.deskWrong
  else if (result?.kind === 'supplies') message = T.ui.deskSupplies
  else if (result?.kind === 'tired') message = T.ui.deskTired
  else if (result?.kind === 'done') message = fill(T.ui.chapterDone, { chapter: completed.at(-1) ?? '' })

  if (reading) {
    const piece = pieceById(reading)
    return (
      <div className="dialog scroll-dialog" role="dialog" aria-label={piece.title}>
        <h2>{piece.title}</h2>
        <Passage refText={piece.ref} />
        <div className="actions"><button autoFocus onClick={() => setReading(null)}>이어붙이기로 돌아가기</button></div>
      </div>
    )
  }

  return (
    <div className="dialog desk" role="dialog" aria-label={T.ui.deskTitle}>
      <h2>
        {T.ui.deskTitle}
        {chapter !== null && <span className="desk-chapter"> · {fill(T.ui.chapterLabel, { chapter })}</span>}
      </h2>
      <p className="hint">
        {fill(T.ui.deskHave, { papyrus: inv.papyrus ?? 0, ink: inv.ink ?? 0 })}
        {chapter !== null && <> · {fill(T.ui.deskCollected, { got: list.length, all })}</>}
      </p>
      {message && (
        <p className={`desk-message ${result?.kind}`} role="status">
          {message}
        </p>
      )}
      {dark ? (
        <p className="desk-message wrong">{T.ui.deskDark}</p>
      ) : chapter === null ? (
        <p>{T.ui.allDone}</p>
      ) : list.length === 0 ? (
        <p>{T.ui.deskEmpty}</p>
      ) : (
        <>
          <p className="hint">{T.ui.deskHint}</p>
          <ol className="scroll-list">
            {list.map((id, i) => {
              const p = pieceById(id)
              return (
                <li key={id}>
                  <button className="piece-title desk-read" onClick={() => setReading(id)} aria-label={`${p.title} 본문 보기`}>{p.title}</button>
                  <span className="piece-ref">{p.ref}</span>
                  <span className="piece-move">
                    <button aria-label={`${p.title} ${T.ui.up}`} disabled={i === 0} onClick={() => moveInDesk(chapter, i, -1)}>
                      ▲
                    </button>
                    <button aria-label={`${p.title} ${T.ui.down}`} disabled={i === list.length - 1} onClick={() => moveInDesk(chapter, i, 1)}>
                      ▼
                    </button>
                  </span>
                </li>
              )
            })}
          </ol>
        </>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
        {!dark && chapter !== null && list.length > 0 && (
          <button className="primary" onClick={() => submitDesk(chapter)}>
            {T.ui.deskSubmit}
          </button>
        )}
      </div>
    </div>
  )
}
