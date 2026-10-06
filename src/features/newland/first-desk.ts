// "첫 장을 써 본다"가 여는 창 — 한 곳에 모았다 (계획 20 작업 4·5). 새 터 책상의 구약 칸을 연다 (창세기–신명기 방이 펼쳐져 있다).
// 책은 플레이어가 고른다 — 본문은 책을 누를 때 불러온다. 기존에 고른 책이 구약이면 그 책의 메뉴로 간다.
import type { GameState } from '../../engine/game'
import { isOtBook } from '../../engine/ot-books'
import type { Modal } from '../../store/game-store'

export function firstChapterDesk(game: GameState): Modal {
  return { kind: 'copy', view: isOtBook(game.copy.book) ? 'menu' : 'pick', tab: 'ot' }
}
