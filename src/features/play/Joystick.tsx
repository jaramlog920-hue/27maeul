import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { unlockAudio } from '../../audio/sound'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

/** 손가락이 가운데에서 이만큼(px) 벗어나야 걷는다 */
const DEAD_ZONE = 13
/** 손잡이가 움직이는 최대 거리(px) */
const KNOB_MAX = 22
/** 누르고 있는 동안 걸음을 이어 가는 간격(ms) — 한 칸 걷기가 끝나면 바로 다음 칸 */
const REPEAT_MS = 30
/** 네 방향 패드 한 칸(px) — 손가락에 맞게 44px */
export const PAD_CELL = 44
export const PAD_SIZE = PAD_CELL * 3

type Dir = [number, number]
export type PadZone = 'up' | 'down' | 'left' | 'right' | 'center'

const DIRS: Record<Exclude<PadZone, 'center'>, Dir> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

export function directionOf(dx: number, dy: number): Dir | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < DEAD_ZONE) return null
  return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]
}

/** 패드 가운데에서 (dx, dy)만큼 떨어진 손가락이 어느 단추 위인가 — 가운데 칸 밖이면 더 많이 벗어난 쪽 */
export function padZone(dx: number, dy: number): PadZone {
  if (Math.abs(dx) < PAD_CELL / 2 && Math.abs(dy) < PAD_CELL / 2) return 'center'
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}

/** 누르고 있는 동안 계속 걷는다. 한 칸 걷는 중이면 walk가 무시하므로 끝나는 대로 다음 칸으로 이어진다 */
function useRepeatWalk(dir: { current: Dir | null }) {
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (dir.current) useGame.getState().walk(...dir.current)
    }, REPEAT_MS)
    return () => {
      clearInterval(timer)
      dir.current = null
    }
  }, [dir])
}

function capture(event: PointerEvent) {
  unlockAudio()
  try {
    event.currentTarget.setPointerCapture(event.pointerId)
  } catch {
    /* 붙잡기에 실패해도 조이스틱은 움직인다 */
  }
}

function offset(el: HTMLElement | null, event: PointerEvent): [number, number] | null {
  const box = el?.getBoundingClientRect()
  if (!box) return null
  return [event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2)]
}

export function Joystick() {
  const enabled = useGame((s) => s.joystick)
  const shape = useGame((s) => s.joystickShape)
  const side = useGame((s) => s.joystickSide)
  // 창이 열려 있으면 걷지 못하므로 창을 가리지 않게 숨긴다
  const modalOpen = useGame((s) => s.modal !== null)
  // 아래 조작판을 쓰면 떠 있는 조이스틱은 필요 없다
  const deck = useGame((s) => s.deck)
  if (!enabled || modalOpen || deck) return null
  const sideClass = side === 'left' ? ' joystick-left' : ''
  return shape === 'round' ? <RoundStick sideClass={sideClass} /> : <DirectionPad className={`joystick dpad${sideClass}`} />
}

/** 네 방향 패드: 위·아래·왼·오른쪽 단추와 가운데 누르기 단추 (떠 있는 조이스틱·아래 조작판의 나침반이 같이 쓴다) */
export function DirectionPad({ className }: { className: string }) {
  const pad = useRef<HTMLDivElement>(null)
  const dir = useRef<Dir | null>(null)
  // 패드를 잡은 손가락 하나만 따른다 (다른 손가락을 떼도 걸음이 끊기지 않게)
  const finger = useRef<number | null>(null)
  const [zone, setZone] = useState<PadZone | null>(null)
  useRepeatWalk(dir)

  const move = (event: PointerEvent, first: boolean) => {
    const d = offset(pad.current, event)
    if (!d) return
    const next = padZone(...d)
    setZone(next)
    if (next === 'center') {
      dir.current = null
      // 가운데는 처음 눌렀을 때만 — 방향 단추에서 미끄러져 들어오면 멈추기만 한다
      if (first) useGame.getState().press()
      return
    }
    const walkDir = DIRS[next]
    const changed = walkDir !== dir.current
    dir.current = walkDir
    if (changed) useGame.getState().walk(...walkDir)
  }
  const release = (event: PointerEvent) => {
    if (finger.current !== null && event.pointerId !== finger.current) return
    finger.current = null
    dir.current = null
    setZone(null)
  }
  const cell = (z: PadZone, label: string, glyph: string) => (
    <span data-zone={z} className={zone === z ? 'pressed' : ''} aria-label={label}>
      {glyph}
    </span>
  )
  return (
    <div
      className={className}
      ref={pad}
      role="group"
      aria-label={T.controls.padLabel}
      onPointerDown={(event) => {
        if (finger.current !== null) return
        finger.current = event.pointerId
        capture(event)
        move(event, true)
      }}
      onPointerMove={(event) => {
        if (event.pointerId !== finger.current) return
        if (zone !== null && (event.buttons || event.pointerType === 'touch')) move(event, false)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      {cell('up', T.controls.up, '▲︎')}
      {cell('left', T.controls.left, '◀︎')}
      {cell('center', T.controls.center, '●')}
      {cell('right', T.controls.right, '▶︎')}
      {cell('down', T.controls.down, '▼︎')}
    </div>
  )
}

/** 둥근 조이스틱: 손잡이를 끄는 쪽으로 걷는다 */
function RoundStick({ sideClass }: { sideClass: string }) {
  const pad = useRef<HTMLDivElement>(null)
  const dir = useRef<Dir | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  useRepeatWalk(dir)

  const move = (event: PointerEvent) => {
    const d = offset(pad.current, event)
    if (!d) return
    const [dx, dy] = d
    const len = Math.hypot(dx, dy) || 1
    const k = Math.min(1, KNOB_MAX / len)
    setKnob({ x: dx * k, y: dy * k })
    const next = directionOf(dx, dy)
    const changed = next?.[0] !== dir.current?.[0] || next?.[1] !== dir.current?.[1]
    dir.current = next
    if (next && changed) useGame.getState().walk(...next)
  }
  const release = () => {
    dir.current = null
    setKnob({ x: 0, y: 0 })
  }
  return (
    <div
      className={`joystick round${sideClass}`}
      ref={pad}
      role="presentation"
      aria-label={T.controls.roundLabel}
      onPointerDown={(event) => {
        capture(event)
        move(event)
      }}
      onPointerMove={(event) => {
        if (event.buttons || event.pointerType === 'touch') move(event)
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
