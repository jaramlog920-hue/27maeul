import { useEffect, useRef } from 'react'
import { CONTENT, piecesOf } from '../../content/catalog'
import { isWet, weatherOf } from '../../engine/calendar'
import { phaseOf, seasonOf } from '../../engine/clock'
import { playerTile } from '../../engine/game'
import type { Book } from '../../engine/types'
import { HEIGHT, isIndoor, TILE, VIEW_H, VIEW_W, WIDTH } from '../../engine/world'
import { createRenderer, type Renderer } from '../../render/renderer'
import { playMusic, setRain, unlockAudio } from '../../audio/sound'
import { useGame } from '../../store/game-store'

/** 탭한 화면 좌표 → 마을 칸 (카메라 반영) */
export function tileFromPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  cam: { x: number; y: number } = { x: 0, y: 0 },
  zoom = 1,
) {
  const x = Math.floor(cam.x + ((clientX - rect.left) / rect.width) * VIEW_W / zoom)
  const y = Math.floor(cam.y + ((clientY - rect.top) / rect.height) * VIEW_H / zoom)
  return { x: Math.min(WIDTH - 1, Math.max(0, x)), y: Math.min(HEIGHT - 1, Math.max(0, y)) }
}

export function GameCanvas({ zoom = 1 }: { zoom?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<Renderer | null>(null)
  const zoomRef = useRef(zoom)
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const r = createRenderer(ctx, CONTENT)
    renderer.current = r
    useGame.setState({
      capture: () => {
        try {
          return canvas.toDataURL('image/png')
        } catch {
          return null
        }
      },
    })
    const t0 = performance.now()
    let last = t0
    let raf = 0
    let audioTick = 0
    let lastError = ''
    const loop = (now: number) => {
      // 탭을 떠났다 돌아오면 dt가 커지므로 한 프레임 최대 0.05초로 자른다
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
      last = now
      // 한 프레임에서 오류가 나도 루프는 멈추지 않는다 (같은 오류는 한 번만 알린다)
      try {
        useGame.getState().frame(dt)
        // rAF가 주는 시각은 t0보다 앞설 수 있다 — 음수 시간을 막는다
        // 도트가 고르게 보이도록: 화면에 보이는 크기(기기 화소)보다 크거나 같은 정수 배로 캔버스를 키운다.
        // 정수 배가 아닌 크기로 늘리면 도트 폭이 들쭉날쭉해지고 움직일 때 울렁거린다
        const k = Math.max(1, Math.min(6, Math.ceil((canvas.clientWidth * (window.devicePixelRatio || 1)) / (VIEW_W * TILE))))
        if (canvas.width !== VIEW_W * TILE * k) {
          canvas.width = VIEW_W * TILE * k
          canvas.height = VIEW_H * TILE * k
          r.scale = k
        }
        const zoomChanged = r.zoom !== zoomRef.current
        r.zoom = zoomRef.current
        r.draw(useGame.getState().game, Math.max(0, (now - t0) / 1000), zoomChanged ? 0 : dt)
      } catch (err) {
        const msg = String(err)
        if (msg !== lastError) console.error(err)
        lastError = msg
      }
      const game = useGame.getState().game
      audioTick += dt
      if (audioTick > 1) {
        audioTick = 0
        playMusic(seasonOf(game.clock.day), phaseOf(game.clock.minute) === 'night')
        setRain(isWet(weatherOf(game.clock.day)) && weatherOf(game.clock.day) === 'rain' && !isIndoor(playerTile(game)))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    // 개발용: 화면 갱신이 멈춘 창(가려진 미리보기)에서도 시간을 흘려 확인할 수 있게 한다. 배포 빌드에는 없다.
    if (import.meta.env.DEV) {
      let simT = 0
      Object.assign(globalThis, {
        __gd: {
          store: useGame,
          step(seconds: number) {
            for (let i = 0; i < seconds / 0.05; i++) {
              useGame.getState().frame(0.05)
              simT += 0.05
            }
            r.draw(useGame.getState().game, simT, 0)
          },
          finishBook(book: Book) {
            useGame.setState((st) => {
              const ids = piecesOf(book).map((p) => p.id)
              const chapters = [...new Set(piecesOf(book).map((p) => p.chapter))]
              return { game: { ...st.game, collected: [...new Set([...st.game.collected, ...ids])], progress: { ...st.game.progress, [book]: { completed: chapters, arrangement: {} } } } }
            })
          },
        },
      })
    }
    return () => {
      cancelAnimationFrame(raf)
      useGame.setState({ capture: null })
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="world"
      width={VIEW_W * TILE}
      height={VIEW_H * TILE}
      aria-label="마을"
      onPointerDown={(e) => {
        e.preventDefault()
        unlockAudio()
        // offsetX/Y와 clientWidth/Height는 테두리를 뺀 그림 영역 기준이다
        const c = e.currentTarget
        const box = { left: 0, top: 0, width: c.clientWidth, height: c.clientHeight }
        const r = renderer.current
        const camera = r ? { x: Math.round(r.camera.x * TILE) / TILE, y: Math.round(r.camera.y * TILE) / TILE } : undefined
        useGame.getState().tap(tileFromPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, box, camera, r?.zoom))
      }}
    />
  )
}
