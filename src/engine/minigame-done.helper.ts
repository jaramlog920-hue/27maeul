// 시험용: 손일 놀이를 다 한 상태로 만든다 (게임은 손일 결과를 보지 않고 끝났는지만 본다 — isDone)
import { HOLD_NEED, ORDER_ROUNDS, PICK_NEED, TIMING_NEED, WEAVE_NEED, type MiniState } from './minigame'

export function finishNow(s: MiniState): MiniState {
  switch (s.kind) {
    case 'mash':
      return { ...s, progress: 1 }
    case 'timing':
      return { ...s, hits: TIMING_NEED }
    case 'pick':
      return { ...s, got: PICK_NEED, items: [] }
    case 'hold':
      return { ...s, hits: HOLD_NEED, holding: false }
    case 'weave':
      return { ...s, count: WEAVE_NEED }
    case 'order':
      return { ...s, rounds: ORDER_ROUNDS }
  }
}
