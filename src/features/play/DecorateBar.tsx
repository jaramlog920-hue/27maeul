import { FurnitureFacingPreview } from './FurnitureFacingPreview'
import type { Facing } from '../../engine/types'
import { useState } from 'react'
import { itemName, T } from '../../content/text'
import { FURNITURE, FURNITURE_DEFS } from '../../engine/room'
import { WALL_BUILD_COINS } from '../../engine/home-walls'
import { inBuildingRoom, roomOf } from '../../engine/newland-rooms'
import { liveSpaces, spacesOf, usesFor, furnitureId } from '../../engine/spaces'
import { spaceOfPiece } from '../../engine/space-life'
import { hasFacingArt, furnitureFacings } from '../../render/furniture-facing'
import { ItemIcon } from '../../shared/ItemIcon'
import { selectedPiece, useGame } from '../../store/game-store'

/** 방 꾸미기: 가구를 고르고 집 바닥을 누른다. 놓인 것을 누르면 골라서 돌리거나 치운다 */
export function DecorateBar() {
  const decorating = useGame((s) => s.decorating)
  const facing = useGame(s => s.decorFacing)
  const setFacing = useGame(s => s.setDecorFacing)
  const level = useGame(s => s.game.homeLevel)
  const moving = useGame(s => s.decorMoving)
  const inv = useGame((s) => s.game.inv)
  const sel = useGame((s) => selectedPiece(roomOf(s.game), s.decorSel))
  const inHouse = useGame((s) => inBuildingRoom(s.game))
  const game = useGame((s) => s.game)
  const [spaceOpen, setSpaceOpen] = useState<string | null>(null)
  const { startDecorate, stopDecorate, turnSelected, removeSelected, moveSelected, selectBelow, showDecorRoom, setSpaceUse, clearSpaceUse } = useGame.getState()
  if (!decorating) return null
  // 자리의 쓰임 (계획 16 작업 23): 고른 가구로 되는 쓰임만 보인다 — 없으면 단추도 없다
  const uses = sel && !inHouse ? usesFor(game.room, sel) : []
  const belongs = sel && !inHouse ? spacesOf(game.spaces ?? [], sel) : []
  const live = liveSpaces(game)
  const own = sel && !inHouse ? spaceOfPiece(game, sel) : undefined
  const selId = sel ? furnitureId(sel) : null
  const held = FURNITURE.find(item => item === decorating)
  const directionNames: Record<Facing, string> = { down: '아래', right: '오른쪽', up: '위', left: '왼쪽' }
  const items = FURNITURE.filter((f) => (inv[f] ?? 0) > 0)
  return (
    <div className="decorate-bar" role="toolbar" aria-label={T.ui.decorate}>
      {/* 설명 줄은 옮기는 중일 때만 짧게 (2026-10-07 사용자 — 가독성) */}
      {moving && <p className="hint">빈 바닥을 누르거나, 조이스틱으로 옮긴 뒤 확인을 누르세요.</p>}
      {decorating === 'wallBuild' && <p className="hint">벽을 세울 바닥을 누르세요 · 한 칸 {WALL_BUILD_COINS}닢</p>}
      {decorating === 'wallRemove' && <p className="hint">허물 벽을 누르세요</p>}
      {/* 방이 하나뿐이면 방 고르기 단추를 보이지 않는다 */}
      {!inHouse && level >= 1 && (
        <div className="decorate-items" role="group" aria-label="꾸밀 방 선택">
          <button onClick={() => showDecorRoom('workshop')}>작업실</button>
          {level >= 1 && <button onClick={() => showDecorRoom('partner')}>배우자방</button>}
          {level >= 2 && <button onClick={() => showDecorRoom('baby')}>아이방</button>}
          {level >= 3 && <button onClick={() => showDecorRoom('living')}>생활방</button>}
        </div>
      )}
      {held && hasFacingArt(held) && FURNITURE_DEFS[held]?.layer !== 'wall' && <div className="decorate-facing" role="group" aria-label="설치할 가구 방향">
        <FurnitureFacingPreview item={held} facing={facing} />
        {/* 놓을 가구와 고른 가구를 이름 앞에서 구분한다 (2026-10-19 감사 L-64) */}
        <span>{T.ui.decorateHeld} · {itemName(held)}</span>
        {furnitureFacings(held).map(dir => <button key={dir} aria-pressed={facing === dir} onClick={() => setFacing(dir)}>{directionNames[dir]}</button>)}
      </div>}
      {sel && (
        <div className="decorate-items decorate-sel">
          <span className="decorate-sel-name">
            <ItemIcon id={sel.item} /> {held ? `${T.ui.decorateSelected} · ` : ''}{itemName(sel.item)}
          </span>
          {/* 위에 올린 물건을 고른 때 받침(탁자·협탁)째 고를 수 있게 (2026-10-19 감사 L-69) */}
          {sel.on && <button onClick={selectBelow}>{T.ui.decorateBelow}</button>}
          <button onClick={moveSelected}>{moving ? '옮기기 취소' : '옮기기'}</button>
          {hasFacingArt(sel.item) && FURNITURE_DEFS[sel.item]?.layer !== 'wall' && <button onClick={turnSelected}>{T.ui.decorateTurn}</button>}
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
        {/* 집 안 벽 (2026-10-12): 넓힌 집에서 방을 나누고 합친다 */}
        {!inHouse && level >= 1 && (
          <>
            <button className={decorating === 'wallBuild' ? 'on' : ''} aria-pressed={decorating === 'wallBuild'} onClick={() => startDecorate(decorating === 'wallBuild' ? 'pick' : 'wallBuild')}>벽 세우기</button>
            <button className={decorating === 'wallRemove' ? 'on' : ''} aria-pressed={decorating === 'wallRemove'} onClick={() => startDecorate(decorating === 'wallRemove' ? 'pick' : 'wallRemove')}>벽 허물기</button>
          </>
        )}
        <button className="primary" onClick={stopDecorate}>
          {T.ui.decorateDone}
        </button>
      </div>
    </div>
  )
}
