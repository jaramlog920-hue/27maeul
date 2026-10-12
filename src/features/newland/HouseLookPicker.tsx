// 집 모습 고르기 (2026-10-13 사용자): 처음 지을 때 지붕·벽 색, 창 모양, 장식(나무 기둥·차양)을 고르고, 고른 모습을 바로 본다.
// 줄마다 이름 칸 폭을 같게 해 색 칸이 세로로 줄이 맞는다.
import { useEffect, useRef } from 'react'
import { HOUSE_ROOFS, HOUSE_TRIMS, HOUSE_WALLS, HOUSE_WINDOWS, type HouseLook } from '../../engine/newland-house-look'
import type { BuildKind } from '../../engine/newland-sites'
import type { Facing } from '../../engine/types'
import { drawNewlandHouse, HOUSE_ART } from '../../render/newland-house-art'

/** 새 터 집 그림 (아이콘·미리보기). width는 집 단계의 가로 칸 수 */
export function HouseArt({ kind, facing = 'down', look, size = 28, width = 4 }: { kind: BuildKind; facing?: Facing; look?: HouseLook; size?: number; width?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const w = width * 16
  useEffect(() => {
    const g = ref.current?.getContext('2d')
    if (!g) return
    g.clearRect(0, 0, w, HOUSE_ART)
    drawNewlandHouse(g, kind, facing, look, false, width)
  }, [kind, facing, look, width, w])
  return <canvas ref={ref} width={w} height={HOUSE_ART} className="art-icon" style={{ width: (size * w) / HOUSE_ART, height: size, imageRendering: 'pixelated' }} aria-hidden="true" />
}

const WINDOW_SHORT = ['네모', '아치', '둥근']
const TRIM_SHORT = ['없음', '기둥', '차양']

export function HouseLookPicker({ kind, facing, look, width, onChange }: { kind: BuildKind; facing: Facing; look: HouseLook; width: number; onChange: (l: HouseLook) => void }) {
  return (
    <div className="house-look">
      <div className="house-look-art">
        <HouseArt kind={kind} facing={facing} look={look} size={72} width={width} />
      </div>
      <div className="house-look-rows">
        <span className="house-look-label">지붕</span>
        <div className="house-swatches" role="group" aria-label="지붕 색">
          {HOUSE_ROOFS.map((r, i) => (
            <button key={r.name} className={`swatch${look.roof === i ? ' on' : ''}`} aria-label={r.name} aria-pressed={look.roof === i} style={{ background: r.colors[0], borderColor: r.colors[1] }} onClick={() => onChange({ ...look, roof: i })} />
          ))}
        </div>
        <span className="house-look-label">벽</span>
        <div className="house-swatches" role="group" aria-label="벽 색">
          {HOUSE_WALLS.map((w, i) => (
            <button key={w.name} className={`swatch${look.wall === i ? ' on' : ''}`} aria-label={w.name} aria-pressed={look.wall === i} style={{ background: w.wall, borderColor: w.base }} onClick={() => onChange({ ...look, wall: i })} />
          ))}
        </div>
        <span className="house-look-label">창</span>
        <div className="house-swatches" role="group" aria-label="창 모양">
          {HOUSE_WINDOWS.map((w, i) => (
            <button key={w.id} className={`word${(look.window ?? 0) === i ? ' on' : ''}`} aria-label={w.name} aria-pressed={(look.window ?? 0) === i} onClick={() => onChange({ ...look, window: i })}>
              {WINDOW_SHORT[i]}
            </button>
          ))}
        </div>
        <span className="house-look-label">장식</span>
        <div className="house-swatches" role="group" aria-label="집 장식">
          {HOUSE_TRIMS.map((t, i) => (
            <button key={t.id} className={`word${(look.trim ?? 0) === i ? ' on' : ''}`} aria-label={t.name} aria-pressed={(look.trim ?? 0) === i} onClick={() => onChange({ ...look, trim: i })}>
              {TRIM_SHORT[i]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
