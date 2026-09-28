// 시작 화면의 살아 있는 마을 한 장면 — 실제 게임 렌더러로 그린다 (숨 쉬는 기록자, 따라다니는 고양이, 나비)
import { useEffect, useRef } from 'react'
import { CONTENT } from '../../content/catalog'
import { emptyProgress } from '../../engine/books'
import { adopt } from '../../engine/companion'
import { newGame, type GameState } from '../../engine/game'
import { TILE, VIEW_W } from '../../engine/world'
import { createRenderer } from '../../render/renderer'

const W = VIEW_W
const H = 11

function scene(): GameState {
  const g = newGame(CONTENT)
  return {
    ...g,
    // 봄날 오후, 집 앞 마당
    clock: { day: 4, minute: 15 * 60 },
    player: { ...g.player, x: 6, y: 8, facing: 'down' },
    companion: adopt('cat', '', 1, { x: 7, y: 8 }),
    offers: {},
    scenes: [],
    progress: { ...emptyProgress(), lk: { completed: [1, 2, 3, 4, 5, 6, 7], arrangement: {} } },
    trails: { '7,8': 20, '8,8': 14 },
  }
}

export function TitleScene() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const r = createRenderer(ctx, CONTENT)
    const game = scene()
    let raf = 0
    const t0 = performance.now()
    const loop = (now: number) => {
      try {
        // dt 0 → 카메라가 기록자 쪽(지도 왼쪽 위 모서리)에 바로 맞춰진다
        r.draw({ ...game, idle: { seconds: 3, action: null, cooldown: 0 } }, Math.max(0, (now - t0) / 1000), 0)
      } catch {
        /* 시작 화면은 장식 — 그림 오류로 멈추지 않는다 */
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="title-scene" width={W * TILE} height={H * TILE} aria-hidden="true" />
}
