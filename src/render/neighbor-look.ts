import type {NeighborDef} from '../engine/types'
import {withLookDefaults,type Avatar,type FullAvatar} from '../engine/avatar'
import type {Who,SpriteOpts} from './sprites'
type PersonExtra=Pick<SpriteOpts,'growth'|'look'|'avatar'|'elder'>
export function neighborLook(def: NeighborDef, growth?: number, dressed?: Avatar, elder = false, heir?: FullAvatar | null): { who: Who; extra: PersonExtra } {
  // 부모가 이사 간 자리는 이어받은 자녀 모습으로 (2026-10-07 사용자)
  if (heir) return { who: 'writer', extra: { look: heir.look, avatar: withLookDefaults({ ...heir, ...dressed, skin: heir.skin, look: heir.look, name: heir.name }), elder } }
  // 그림만 바꾼 외관 (appearance): 고정 도트로 그리거나, 다른 옷장 모습으로
  const ap = def.appearance
  if (ap?.sprite) return { who: ap.sprite as Who, extra: { growth: elder && ap.sprite === 'child' ? 3 : growth, elder } }
  const baseAvatar = ap?.avatar ?? def.avatar, look = ap?.look ?? def.look
  if (baseAvatar && look) {
    // 옷장에서 바꾼 배우자 모습이 있으면 그것으로
    const avatar = withLookDefaults({ look, name: def.role, ...baseAvatar, ...(dressed ?? {}) })
    return { who: 'writer', extra: { look, avatar, elder } }
  }
  return { who: def.sprite as Who, extra: { growth: elder && def.sprite === 'child' ? 3 : growth, elder } }
}

/**
 * 그림만 바꾼 외관(appearance)을 반영한 이웃 정의 — 장면·미리보기도 마을에서 보이는 모습과 같게 (2026-10-19 사용자: 바질 장면에 다른 사람이 나왔다).
 * 고정 도트로 바꾼 이웃은 avatar를 비우고 sprite를, 다른 옷장 모습으로 바꾼 이웃은 그 avatar·look을 쓴다
 */
export function shownDef(def: NeighborDef): NeighborDef
export function shownDef(def: NeighborDef | undefined): NeighborDef | undefined
export function shownDef(def: NeighborDef | undefined): NeighborDef | undefined {
  const ap = def?.appearance
  if (!def || !ap) return def
  if (ap.sprite) return { ...def, avatar: undefined, sprite: ap.sprite as NeighborDef['sprite'] }
  return { ...def, avatar: ap.avatar ?? def.avatar, look: ap.look ?? def.look }
}
/** 고정 도트로 그리는 외관이면 그 도트 (자리를 이어받은 자녀는 제 모습이라 없음) */
export function appearanceSprite(def: NeighborDef | undefined, retired = false): Who | undefined {
  return !retired && def?.appearance?.sprite ? (def.appearance.sprite as Who) : undefined
}
