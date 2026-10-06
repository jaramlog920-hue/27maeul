import { useState } from 'react'
import { itemName, T } from '../../content/text'
import { FURNITURE } from '../../engine/room'
import { liveSpaces, spacesOf, usesFor, furnitureId } from '../../engine/spaces'
import { spaceOfPiece } from '../../engine/space-life'
import { hasFacingArt } from '../../render/furniture-facing'
import { ItemIcon } from '../../shared/ItemIcon'
import { selectedPiece, useGame } from '../../store/game-store'

/** 방 꾸미기: 가구를 고르고 집 바닥을 누른다. 놓인 것을 누르면 골라서 돌리거나 치운다 */
export function DecorateBar() {
  const decorating = useGame((s) => s.decorating)
  const level = useGame(s => s.game.homeLevel)
  const moving = useGame(s => s.decorMoving)
  const inv = useGame((s) => s.game.inv)
  const sel = useGame((s) => selectedPiece(s.game.room, s.decorSel))
  const game = useGame((s) => s.game)
  const [spaceOpen, setSpaceOpen] = useState<string | null>(null)
  const { startDecorate, stopDecorate, turnSelected, removeSelected, moveSelected, showDecorRoom, setSpaceUse, clearSpaceUse } = useGame.getState()
  if (!decorating) return null
  // 자리의 쓰임 (계획 16 작업 23): 고른 가구로 되는 쓰임만 보인다 — 없으면 단추도 없다
  const uses = sel ? usesFor(game.room, sel) : []
  const belongs = sel ? spacesOf(game.spaces ?? [], sel) : []
  const live = liveSpaces(game)
  const own = sel ? spaceOfPiece(game, sel) : undefined
  const selId = sel ? furnitureId(sel) : null
  const items = FURNITURE.filter((f) => (inv[f] ?? 0) > 0)
  return (
    <div className="decorate-bar" role="toolbar" aria-label={T.ui.decorate}>
      <p className="hint">{moving ? '옮길 방을 고르고 빈 바닥을 누르세요.' : T.ui.decorateHint}</p>
      <div className="decorate-items" role="group" aria-label="꾸밀 방 선택">
        <button onClick={() => showDecorRoom('workshop')}>작업실</button>
        {level >= 1 && <button onClick={() => showDecorRoom('partner')}>배우자방</button>}
        {level >= 2 && <button onClick={() => showDecorRoom('baby')}>아이방</button>}
        {level >= 3 && <button onClick={() => showDecorRoom('living')}>생활방</button>}
      </div>
      {sel && (
        <div className="decorate-items decorate-sel">
          <span>
            <ItemIcon id={sel.item} /> {itemName(sel.item)}
          </span>
          <button onClick={moveSelected}>{moving ? '옮기기 취소' : '옮기기'}</button>
          {hasFacingArt(sel.item) && <button onClick={turnSelected}>{T.ui.decorateTurn}</button>}
          <button onClick={removeSelected}>{T.ui.decorateTake}</button>
          {(uses.length > 0 || belongs.length > 0) && (
            <button aria-expanded={spaceOpen === selId} onClick={() => setSpaceOpen(spaceOpen === selId ? null : selId)}>{T.space.decideButton}</button>
          )}
        </div>
      )}
      {sel && spaceOpen === selId && (
        <div className="decorate-items decorate-sel" role="group" aria-label={T.space.decideTitle}>
          {belongs.map((sp) => (
            <span key={sp.id} className="hint">
              {sp.name ?? T.space.use[sp.use]} · {live.some((l) => l.id === sp.id) ? T.space.ready : T.space.resting}
            </span>
          ))}
          {uses.map((u) => (
            <button key={u} className={own?.use === u ? 'on' : ''} aria-pressed={own?.use === u} title={T.space.needs[u]} onClick={() => setSpaceUse(u)}>
              {T.space.use[u]}
            </button>
          ))}
          {own && <button onClick={() => clearSpaceUse(own.id)}>{T.space.clear}</button>}
        </div>
      )}
      <div className="decorate-items">
        {items.map((f) => (
          <button key={f} className={decorating === f ? 'on' : ''} aria-label={itemName(f)} aria-pressed={decorating === f} onClick={() => startDecorate(f)}>
            <ItemIcon id={f} /> {inv[f]}
          </button>
        ))}
        <button className="primary" onClick={stopDecorate}>
          {T.ui.decorateDone}
        </button>
      </div>
    </div>
  )
}
