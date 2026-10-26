import type { GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'

/** 모임·행사 저장은 스토어의 공통 길로 — 따로 저장하면 도감 동기화·업적 알림이 빠졌다 (2026-10-26 감사 A07) */
export function commitClub(game:GameState) {
 useGame.getState().commitGame(game)
}
