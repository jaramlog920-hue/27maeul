// 나의 한 줄 — 플레이어 자신의 말. 성경 본문과 섞이지 않게 모양과 안내를 따로 둔다 (설계 2.5-4)
import { useState } from 'react'
import { pieceById } from '../../content/catalog'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function MyLineForm({ pieceId }: { pieceId: string }) {
  const piece = pieceById(pieceId)
  const saved = useGame((s) => s.game.myLines[pieceId] ?? '')
  const [text, setText] = useState(saved)
  const { saveMyLine, closeModal } = useGame.getState()
  return (
    <div className="dialog myline" role="dialog" aria-label={T.ui.myLine}>
      <h2>
        {T.ui.myLine}{' '}
        <span className="desk-chapter">
          · {piece.title} ({piece.ref})
        </span>
      </h2>
      <p className="hint">{T.ui.myLineAsk}</p>
      <textarea
        maxLength={80}
        rows={3}
        value={text}
        placeholder={T.ui.myLinePlaceholder}
        aria-label={T.ui.myLinePlaceholder}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="actions">
        <button onClick={closeModal}>{T.ui.myLineSkip}</button>
        <button className="primary" onClick={() => saveMyLine(pieceId, text)}>
          {T.ui.myLineSave}
        </button>
      </div>
    </div>
  )
}
