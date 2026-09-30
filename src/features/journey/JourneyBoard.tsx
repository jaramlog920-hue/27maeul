// 서고 방 벽의 카드 판: 사도행전 방의 여정 판(설계 §7-1), 요한계시록 방의 일곱 교회 카드 판(계획 9 작업 4).
// 옮기거나 엮은 장에서 얻은 이름 카드를 본문 순서대로 놓는다. 조작은 책상 잇기와 같은 ▲▼.
// 카드를 누르면 그 이름이 나오는 구절(개역한글)을 본문 창으로 보여 준다 — 풀이 없이.
import { useState } from 'react'
import { CHURCHES, JOURNEY } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { boardInOrder, type JourneyCard } from '../../engine/journey'
import { useGame, type CardBoard } from '../../store/game-store'
import { Passage } from '../passage/Passage'

/** 판마다 카드 목록·문구 묶음·게임 상태 칸·완성 표식 */
const BOARDS: Record<
  CardBoard,
  {
    cards: readonly JourneyCard[]
    field: 'journey' | 'churches'
    flag: string
    text: {
      boardTitle: string
      boardHint: string
      boardCount: string
      boardEmpty: string
      boardInOrder: string
      boardWrong: string
      boardDone: string
      cardVerse: string
    }
  }
> = {
  acts: { cards: JOURNEY, field: 'journey', flag: 'actsShip', text: T.acts },
  churches: { cards: CHURCHES, field: 'churches', flag: 'churchesDone', text: T.revRoom },
}

export function JourneyBoard({ board: id = 'acts' }: { board?: CardBoard }) {
  const def = BOARDS[id]
  const txt = def.text
  const [reading, setReading] = useState<number | null>(null)
  const [checked, setChecked] = useState<'ok' | 'wrong' | null>(null)
  const board = useGame((s) => s.game[def.field] ?? [])
  const done = useGame((s) => !!s.game.flags[def.flag])
  const { moveBoard, closeModal } = useGame.getState()
  const byOrder = new Map(def.cards.map((c) => [c.order, c]))

  if (reading !== null) {
    const card = byOrder.get(reading)!
    const title = fill(txt.cardVerse, { place: card.place })
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
    moveBoard(id, i, d)
  }
  return (
    <div className="dialog desk journey" role="dialog" aria-label={txt.boardTitle}>
      <h2>{txt.boardTitle}</h2>
      <p className="hint">{txt.boardHint}</p>
      <p className="hint">{fill(txt.boardCount, { got: board.length, all: def.cards.length })}</p>
      {done && (
        <p className="desk-message done" role="status">
          {txt.boardDone}
        </p>
      )}
      {!done && checked && (
        <p className={`desk-message ${checked === 'ok' ? 'done' : 'wrong'}`} role="status">
          {checked === 'ok' ? txt.boardInOrder : txt.boardWrong}
        </p>
      )}
      {board.length === 0 ? (
        <p>{txt.boardEmpty}</p>
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
