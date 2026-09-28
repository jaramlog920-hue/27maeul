import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { unlockAudio } from '../../audio/sound'
import { useGame } from '../../store/game-store'

/** 손가락이 가운데에서 이만큼(px) 벗어나야 걷는다 */
const DEAD_ZONE = 13
/** 손잡이가 움직이는 최대 거리(px) */
const KNOB_MAX = 22
/** 누르고 있는 동안 걸음을 이어 가는 간격(ms) — 한 칸 걷기가 끝나면 바로 다음 칸 */
const REPEAT_MS = 30

type Dir = [number, number]

export function directionOf(dx: number, dy: number): Dir | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < DEAD_ZONE) return null
  return Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]
}

export function Joystick() {
  const enabled = useGame((s) => s.joystick)
  const pad = useRef<HTMLDivElement>(null)
  const dir = useRef<Dir | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  // 누르고 있는 동안 계속 걷는다. 한 칸 걷는 중이면 walk가 무시하므로 끝나는 대로 다음 칸으로 이어진다
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => {
      if (dir.current) useGame.getState().walk(...dir.current)
    }, REPEAT_MS)
    return () => {
      clearInterval(timer)
      dir.current = null
    }
  }, [enabled])

  if (!enabled) return null
  const move = (event: PointerEvent) => {
    const box = pad.current?.getBoundingClientRect()
    if (!box) return
    const dx = event.clientX - (box.left + box.width / 2)
    const dy = event.clientY - (box.top + box.height / 2)
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
      className="joystick"
      ref={pad}
      role="presentation"
      aria-label="모바일 이동 조이스틱"
      onPointerDown={(event) => {
        unlockAudio()
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          /* 붙잡기에 실패해도 조이스틱은 움직인다 */
        }
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
