// 나의 한 줄 — 플레이어 자신의 말. 성경 본문과 섞이지 않게 모양과 안내를 따로 둔다 (설계 2.5-4)
// 조각 키(조각 id)와 책 키('book:mk' — 서고에 처음 꽂은 직후, 또는 선반에서)를 함께 쓴다.
import { useState } from 'react'
import { pieceById } from '../../content/catalog'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

const BOOK_NAME = T.quiz.books as Record<string, string>

/** 한 줄이 무엇에 대한 것인지: 책 이름, 또는 이야기 제목(출처) */
export function lineLabel(key: string): string {
  if (key.startsWith('book:')) return BOOK_NAME[key.slice(5)] ?? key
  const piece = pieceById(key)
  return `${piece.title} (${piece.ref})`
}

export function MyLineForm({ lineKey }: { lineKey: string }) {
  const isBook = lineKey.startsWith('book:')
  const saved = useGame((s) => s.game.myLines[lineKey] ?? '')
  const [text, setText] = useState(saved)
  const { saveMyLine, skipMyLine } = useGame.getState()
  return (
    <div className="dialog myline" role="dialog" aria-label={T.ui.myLine}>
      <h2>
        {T.ui.myLine} <span className="desk-chapter">· {lineLabel(lineKey)}</span>
      </h2>
      <p className="hint">{isBook ? T.ui.bookLineAsk : T.ui.myLineAsk}</p>
      <textarea
        maxLength={80}
        rows={3}
        value={text}
        placeholder={T.ui.myLinePlaceholder}
        aria-label={T.ui.myLinePlaceholder}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="actions">
        <button onClick={skipMyLine}>{isBook ? T.ui.bookLineLater : T.ui.myLineSkip}</button>
        <button className="primary" onClick={() => saveMyLine(lineKey, text)}>
          {T.ui.myLineSave}
        </button>
      </div>
    </div>
  )
}
