import type {NeighborDef} from '../engine/types'
import {withLookDefaults,type Avatar,type FullAvatar} from '../engine/avatar'
import type {Who,SpriteOpts} from './sprites'
type PersonExtra=Pick<SpriteOpts,'growth'|'look'|'avatar'|'elder'>
export function neighborLook(def: NeighborDef, growth?: number, dressed?: Avatar, elder = false, heir?: FullAvatar | null): { who: Who; extra: PersonExtra } {
  // 부모가 이사 간 자리는 이어받은 자녀 모습으로 (2026-10-07 사용자)
  if (heir) return { who: 'writer', extra: { look: heir.look, avatar: heir, elder } }
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
