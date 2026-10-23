// 기록자의 쉬는 동작 (설계 2.6-1). 몸과 일상의 동작만 — 성경 이야기에 대한 반응은 없다 (exclusion-list §1-4).
// 기록자는 스스로 동작을 고르지 않는다 — stepControlledIdle이 누른 인사 같은 동작을 끝까지 보일 뿐이다.

export type IdleKind = 'look' | 'stretch' | 'yawn' | 'hum' | 'doze' | 'greet' | 'wrist'
export interface IdleAction {
  kind: IdleKind
  left: number
}
export interface IdleState {
  seconds: number
  action: IdleAction | null
  cooldown: number
}

/** 동작 사이 쉬는 시간 */
export const IDLE_GAP = 3

export const DURATION: Record<IdleKind, number> = {
  look: 2.5,
  stretch: 2,
  yawn: 1.8,
  hum: 3,
  doze: Number.POSITIVE_INFINITY,
  greet: 1.5,
  wrist: 2,
}

export const IDLE_RESET: IdleState = { seconds: 0, action: null, cooldown: 0 }

/** 플레이어가 기록자를 누르면 화면 쪽을 돌아본다 */
export function greet(): IdleState {
  return { seconds: 0, action: { kind: 'greet', left: DURATION.greet }, cooldown: IDLE_GAP }
}

/** 기록자의 동작은 누른 것만 — 멈춘 시간은 동물 친구를 위해 세지만, 스스로 동작을 고르지는 않는다 */
export function stepControlledIdle(idle: IdleState, dt: number): IdleState {
  const action = idle.action && Number.isFinite(idle.action.left) && idle.action.left > dt
    ? { ...idle.action, left: idle.action.left - dt } : null
  return { seconds: idle.seconds + dt, action, cooldown: 0 }
}
