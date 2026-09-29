// 사도행전 방 벽의 여정 판: 엮은 장에서 얻은 곳 이름 카드를 본문 순서대로 잇는다 (설계 §7-1).
// 조작은 책상 잇기와 같은 ▲▼. 카드를 누르면 그 곳이 나오는 구절(개역한글)을 본문 창으로 보여 준다.
import { useState } from 'react'
import { JOURNEY } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { boardInOrder } from '../../engine/journey'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'

const byOrder = new Map(JOURNEY.map((c) => [c.order, c]))

export function JourneyBoard() {
  const [reading, setReading] = useState<number | null>(null)
  const [checked, setChecked] = useState<'ok' | 'wrong' | null>(null)
  const board = useGame((s) => s.game.journey)
  const done = useGame((s) => !!s.game.flags.actsShip)
  const { moveJourney, closeModal } = useGame.getState()

  if (reading !== null) {
    const card = byOrder.get(reading)!
    const title = fill(T.acts.cardVerse, { place: card.place })
    return (
      <div className="dialog scroll-dialog" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <Passage refText={card.ref} />
        <div className="actions">
          <button autoFocus onClick={() => setReading(null)}>
            {T.acts.verseBack}
          </button>
        </div>
      </div>
    )
  }

  const move = (i: number, d: number) => {
    setChecked(null)
    moveJourney(i, d)
  }
  return (
    <div className="dialog desk journey" role="dialog" aria-label={T.acts.boardTitle}>
      <h2>{T.acts.boardTitle}</h2>
      <p className="hint">{T.acts.boardHint}</p>
      <p className="hint">{fill(T.acts.boardCount, { got: board.length, all: JOURNEY.length })}</p>
      {done && (
        <p className="desk-message done" role="status">
          {T.acts.boardDone}
        </p>
      )}
      {!done && checked && (
        <p className={`desk-message ${checked === 'ok' ? 'done' : 'wrong'}`} role="status">
          {checked === 'ok' ? T.acts.boardInOrder : T.acts.boardWrong}
        </p>
      )}
      {board.length === 0 ? (
        <p>{T.acts.boardEmpty}</p>
      ) : (
        <ol className="scroll-list journey-list">
          {board.map((order, i) => {
            const card = byOrder.get(order)
            if (!card) return null
            return (
              <li key={order}>
                <button className="piece-title desk-read" onClick={() => setReading(order)} aria-label={fill(T.acts.cardRead, { place: card.place })}>
                  {card.place}
                </button>
                {!done && (
                  <span className="piece-move">
                    <button aria-label={`${card.place} ${T.ui.up}`} disabled={i === 0} onClick={() => move(i, -1)}>
                      ▲
                    </button>
                    <button aria-label={`${card.place} ${T.ui.down}`} disabled={i === board.length - 1} onClick={() => move(i, 1)}>
                      ▼
                    </button>
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
        {!done && board.length > 1 && (
          <button className="primary" onClick={() => setChecked(boardInOrder(board) ? 'ok' : 'wrong')}>
            {T.acts.boardCheck}
          </button>
        )}
      </div>
    </div>
  )
}
