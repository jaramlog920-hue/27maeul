import type { ChildStage } from '../engine/child'
import { withLookDefaults, type FullAvatar } from '../engine/avatar'
import type { GameState } from '../engine/game'

/** Select existing art and height for the player's child. */
export function playerChildSprite(stage: ChildStage, dressed: boolean) {
  return {
    who: stage === 'toddler' || stage === 'adult' || dressed ? 'writer' as const : 'child' as const,
    short: stage === 'toddler' ? 0 : stage === 'adult' ? undefined : 1,
  }
}

/**
 * 우리 아이의 모습 — 옷장에서 입힌 모습이 있으면 그대로(피부는 부모 것), 없으면 기본 모습.
 * 마을의 아이 그림과 공동주택 2층(독립한 아이)이 같은 모습을 쓴다 (2026-10-12 점검 MOB-05)
 */
export function playerChildAvatar(game: Pick<GameState, 'child' | 'avatar' | 'looks'>): FullAvatar {
  const skin = game.avatar?.skin
  const dressed = game.looks?.child
  if (dressed) return withLookDefaults({ ...dressed, skin: skin ?? dressed.skin })
  return withLookDefaults({ look: game.child?.look === 'boy' ? 'm' : 'f', name: game.child?.name ?? '', skin: skin ?? 1 })
}
