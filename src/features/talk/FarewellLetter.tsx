// 노인이 된 이웃이 이사 가며 남긴 편지 (2026-10-07 사용자): 그동안 고마웠다는 말, 말씀 조각 하나, 선물.
// 편지 글은 게임이 지어낸 말이다 — 말씀 본문은 말씀 탭의 조각 창에서만 본다.
import { neighborById, pieceById } from '../../content/catalog'
import { callName, fill, itemList, T, withSubject } from '../../content/text'
import { personName } from '../../content/gen-text'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'

export function FarewellLetter() {
  const game = useGame((s) => s.game)
  const f = game.farewellPopup
  const close = () => {
    const g = useGame.getState().game
    const next = { ...g, farewellPopup: undefined }
    saveGame(next)
    useGame.setState({ game: next, modal: null })
  }
  if (!f) return null
  const who = neighborById(f.npc)?.role ?? ''
  const heirId = game.gen?.retired?.[f.npc]?.heir
  const heir = heirId ? personName(game, heirId) : ''
  const letters = T.gen.farewell.letters as string[]
  const body = fill(letters[f.letter % letters.length], { heir, heirSubj: withSubject(heir) })
  const piece = f.pieceId ? pieceById(f.pieceId) : undefined
  return (
    <div className="dialog farewell" role="dialog" aria-label={fill(T.gen.farewell.title, { who })}>
      <h2>{fill(T.gen.farewell.title, { who })}</h2>
      <p className="talk-popup-line">{callName(body, game.avatar?.name)}</p>
      {piece && (
        <p className="hint">
          {T.gen.farewell.piece} · {piece.ref}
        </p>
      )}
      {Object.keys(f.gift).length > 0 && <p className="hint">{fill(T.gen.farewell.gift, { items: itemList(f.gift) })}</p>}
      <div className="actions">
        <button data-close onClick={close}>{T.ui.close}</button>
      </div>
    </div>
  )
}
