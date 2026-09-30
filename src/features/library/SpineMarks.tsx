// 서고 책등의 정성 표시 (계획 13): 정성 들인 장이 반을 넘으면 금테, 봉인용 밀랍으로 봉인하면 붉은 봉인
import { CONTENT } from '../../content/catalog'
import { T } from '../../content/text'
import { chaptersOf } from '../../engine/books'
import { goldTrim } from '../../engine/fixtures'
import { canSeal } from '../../engine/game'
import type { Book } from '../../engine/types'
import { useGame } from '../../store/game-store'

export function SpineMarks({ book }: { book: Book }) {
  const game = useGame((s) => s.game)
  const seal = useGame((s) => s.seal)
  const gold = goldTrim(game.careful?.[book], chaptersOf(book, CONTENT).length)
  const sealed = (game.sealed ?? []).includes(book)
  const sealable = canSeal(game, book) === null
  return (
    <>
      {gold && <span className="spine-mark gold">{T.care.goldTrim}</span>}
      {sealed && <span className="spine-mark seal">{T.care.sealed.replace('했다.', '')}</span>}
      {sealable && (
        <button onClick={() => seal(book)} title={T.care.seal}>
          {T.care.seal}
        </button>
      )}
    </>
  )
}
