// 대한성서공회 개역한글 소제목에 표시된 관련 본문. 누르면 해당 구절이 펼쳐진다.
import { useState } from 'react'
import { fill, T } from '../../content/text'
import { isGospel, type Piece } from '../../engine/types'
import { Passage } from './Passage'

export function Stamps({ piece }: { piece: Piece }) {
  const [open, setOpen] = useState<string | null>(null)
  // 복음서 이외에도 원본에 관련 본문이 있을 때는 표시한다.
  if (!isGospel(piece.book) && piece.stamps.length === 0) return null
  return (
    <div className="stamps">
      {piece.stamps.length === 0 ? (
        <p className="stamp only">✦ {fill(T.ui.onlyHere, { book: (T.quiz.books as Record<string, string>)[piece.book] })}</p>
      ) : (
        <ul>
          {piece.stamps.map((s) => (
            <li key={s.ref}>
              <button
                className={`stamp ${s.kind} ${open === s.ref ? 'open' : ''}`}
                aria-expanded={open === s.ref}
                onClick={() => setOpen(open === s.ref ? null : s.ref)}
              >
                {s.kind === 'related' ? '관련 본문' : s.kind === 'same' ? T.ui.stampSame : T.ui.stampSimilar} · {s.label ?? s.ref}
                <span className="stamp-toggle">{open === s.ref ? T.ui.stampClose : T.ui.stampOpen}</span>
              </button>
              {open === s.ref && <Passage refText={s.ref} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
