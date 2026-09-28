// 복음서 도장 — 오늘의 플레이어가 보는 정보 (exclusion-list §4-1). 누르면 그 복음서의 구절이 펼쳐진다.
import { useState } from 'react'
import { fill, T } from '../../content/text'
import type { Piece } from '../../engine/types'
import { Passage } from './Passage'

export function Stamps({ piece }: { piece: Piece }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="stamps">
      {piece.stamps.length === 0 ? (
        <p className="stamp only">✦ {fill(T.ui.onlyHere, { book: (T.quiz.gospels as Record<string, string>)[piece.book] })}</p>
      ) : (
        <ul>
          {piece.stamps.map((s) => (
            <li key={s.ref}>
              <button
                className={`stamp ${s.kind} ${open === s.ref ? 'open' : ''}`}
                aria-expanded={open === s.ref}
                onClick={() => setOpen(open === s.ref ? null : s.ref)}
              >
                {s.kind === 'same' ? T.ui.stampSame : T.ui.stampSimilar} · {s.ref}
                {s.kind === 'similar' && <small> {T.ui.similarNote}</small>}
                <span className="stamp-toggle">{open === s.ref ? T.ui.stampClose : T.ui.stampOpen}</span>
              </button>
              {open === s.ref && <Passage refText={s.ref} />}
            </li>
          ))}
        </ul>
      )}
      <p className="stamp-note">{T.ui.stampNote}</p>
    </div>
  )
}
