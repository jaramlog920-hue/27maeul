// 서고 책등의 봉인: 봉인용 밀랍으로 봉인하면 붉은 봉인 (정성 등급·금테는 없앴다, 2026-09-30 사용자)
import { T } from '../../content/text'
import { canSeal } from '../../engine/game'
import type { Book } from '../../engine/types'
import { useGame } from '../../store/game-store'
import { useState } from 'react'
import { LibraryWork } from './LibraryWork'

export function SpineMarks({ book }: { book: Book }) {
  const [justSealed, setJustSealed] = useState(false)
  const game = useGame((s) => s.game)
  const seal = useGame((s) => s.seal)
  const sealed = (game.sealed ?? []).includes(book)
  const sealable = canSeal(game, book) === null
  return (
    <>
      {sealed && <span className="spine-mark seal">{T.care.sealed.replace('했다.', '')}</span>}
      {justSealed && sealed && <LibraryWork book={book} action="wax" binding={game.bound[book]} grade={game.shelved[book]} />}
      {sealable && (
        <button onClick={() => { seal(book); setJustSealed((useGame.getState().game.sealed ?? []).includes(book)) }} title={T.care.seal}>
          {T.care.seal}
        </button>
      )}
    </>
  )
}
