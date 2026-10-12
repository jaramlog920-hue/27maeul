// 생활 기능 자체를 검증하는 테스트용: 해금에 필요한 실제 완필 진행을 갖춘 상태.
import { newGame, recordProgress, type GameState } from './game'
import { BOOKS, type GameContent } from './types'
import { NT_CHAPTER_COUNTS } from './progression'

export function establishedGame(content: GameContent, count = 8) {
  const s = newGame(content)
  const order = [...BOOKS].sort((a, b) => NT_CHAPTER_COUNTS[a] - NT_CHAPTER_COUNTS[b])
  for (const book of order.slice(0, count)) s.progress[book].completed = Array.from({ length: NT_CHAPTER_COUNTS[book] }, (_, i) => i + 1)
  return recordProgress(s).state
}

/** 개편 이전 저장의 생활 동작을 검증하는 기존 시나리오용. */
export function legacyGame(content: GameContent, avatar?: Parameters<typeof newGame>[1]): GameState {
  const s = newGame(content, avatar)
  return { ...s, flags: { ...s.flags, growthLegacy: 1 } }
}
