// "첫 장을 써 본다"가 여는 창 — 한 곳에 모았다 (계획 20 작업 4). 지금은 기존 책상(CopyDesk)을 여는 데까지이고,
// 구약 필사 책상 연결(작업 5)은 이 함수만 바꾸면 된다.
import type { GameState } from '../../engine/game'
import type { Modal } from '../../store/game-store'

export function firstChapterDesk(game: GameState): Modal {
  return { kind: 'copy', view: game.copy.book ? 'menu' : 'pick' }
}
