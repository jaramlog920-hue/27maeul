// 부지 미리보기 (계획 20 작업 6): 건축 가능한 땅을 작은 그림으로 보고, 칸을 눌러 자리를 고른 뒤 놓는다.
// 놓을 수 없으면 초록·빨강 색 대신 그 자리에서 이유 한 줄만 보인다. 한 번에 한 가지만 미리 본다.
import { useEffect, useRef, useState } from 'react'
import { fill, itemList, T } from '../../content/text'
import { BUILD_RECT, NEWLAND_VISIBLE_H, NEWLAND_W } from '../../engine/newland-config'
import { NEWLAND_MAP } from '../../engine/newland'
import { areaOf, boxOf, buildsOf, canOrder, costOf, doorOf, tilesOf, type OrderBlock } from '../../engine/newland-build'
import { isBuildKind, isDecorKind, isTileKind, SITES, type SiteKind, type TileKind } from '../../engine/newland-sites'
import { t } from '../../shared/i18n'
import { neighborById } from '../../content/catalog'
import { DREAMER } from '../../engine/newland-life'
import type { Facing, Tile } from '../../engine/types'
import { BUILDING_LABELS } from '../../render/old-village-art'
import { useGame } from '../../store/game-store'

const CELL = 8
const W = NEWLAND_W
const H = NEWLAND_VISIBLE_H

/** 새 터 바탕 글자 → 흐린 색 (T 숲 · S 서고 벽 · D 서고 문 · , 길 · > 표지 · * 꽃) */
const GROUND_COLOR: Record<string, string> = { '.': '#d6e0bd', T: '#b3c79d', S: '#cbc2b0', D: '#a8957c', ',': '#eadfc0', '>': '#d8c48a', '*': '#e3cfd3' }
export type SitePick = SiteKind | 'eraser'
/** 깐 칸의 흐린 색 (길·정원·꾸미기) */
const TILE_COLOR: Partial<Record<TileKind, string>> = { path: '#eadfc0', garden: '#9db97f', sand: '#f2d9b2', stone: '#c9baa9', soil: '#a97d60', grassTuft: '#b4cc9a', flower: '#f2d9b2', rocks: '#c3b4a4', bush: '#72976d', treeSmall: '#72976d', treeTall: '#608563', treeBig: '#608563' }

const BLOCK_TEXT: Record<OrderBlock, string> = {
  unrevealed: T.build.blockUnrevealed,
  facing: T.build.blockFacing,
  outside: T.build.blockOutside,
  overlap: T.build.blockOverlap,
  standing: T.build.blockStanding,
  door: T.build.blockDoor,
  sealed: T.build.blockSealed,
  many: T.build.blockMany,
  homes: T.build.blockHomes,
  same: T.build.blockSame,
  coins: T.build.blockCoins,
  items: T.build.blockItems,
  unknown: T.build.blockUnknown,
}
const FACING_TEXT: Partial<Record<Facing, string>> = { down: T.build.faceDown, left: T.build.faceLeft, right: T.build.faceRight }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** 건물 이름 (그림 묶음의 이름표 — 자산 쪽 값을 그대로 쓴다). 길·정원 칸은 생활 문구 */
export function siteName(k: SiteKind): string {
  if (k === 'path' || k === 'garden') return T.build[k]
  if (isDecorKind(k)) return t(`decor.${k}`)
  // 주민의 꿈터는 꿈의 주인 이름으로 (계획 18: '○○의 꿈')
  if (k === 'weaver') return fill(T.newlandLife.dream.label, { who: neighborById(DREAMER)?.role ?? '' })
  // 틸리의 꿈 (2026-10-08): 그림방
  if (k === 'gallery') return fill((T.newlandLife.dreams as Record<string, { label: string }>).tilly.label, { who: neighborById('tilly')?.role ?? '' })
  // 자란 아이의 집 겸 일터 (B18-7): 아이 이름으로
  if (k === 'kidWork') return fill(T.newlandLife.kidWork.label, { name: useGame.getState().game.child?.name ?? '' })
  return BUILDING_LABELS[SITES[k].assetId ?? k] ?? ''
}

/** "닢 150 · 올리브 4 · 파피루스 3" 꼴의 드는 것 */
export function costText(kind: SiteKind, size = 1): string {
  const c = costOf(kind, size)
  return [c.coins > 0 ? fill(T.ui.coins, { n: c.coins }) : '', itemList(c.items)].filter(Boolean).join(' · ')
}

/** 놓기 하나가 그림에서 차지하는 가로·세로 칸 */
function spanOf(pick: SitePick, size: number): number {
  if (pick === 'eraser') return 1
  return isTileKind(pick) ? size : 4
}

export function SitePreview({ pick, onBack, onPlaced }: { pick: SitePick; onBack: () => void; onPlaced: () => void }) {
  const game = useGame((s) => s.game)
  const { orderSite, eraseTile } = useGame.getState()
  const kind = pick === 'eraser' ? null : pick
  const def = kind ? SITES[kind] : null
  const [facing, setFacing] = useState<Facing>('down')
  const [size, setSize] = useState<number>(def?.sizes[0] ?? 1)
  const [pos, setPos] = useState<Tile>({ x: BUILD_RECT.x0 + Math.floor((BUILD_RECT.x1 - BUILD_RECT.x0 + 1) / 2) - 1, y: BUILD_RECT.y0 + Math.floor((BUILD_RECT.y1 - BUILD_RECT.y0 + 1) / 2) - 1 })
  const ref = useRef<HTMLCanvasElement>(null)
  const span = spanOf(pick, size)
  const at = { x: clamp(pos.x, BUILD_RECT.x0, BUILD_RECT.x1 - span + 1), y: clamp(pos.y, BUILD_RECT.y0, BUILD_RECT.y1 - span + 1) }

  const block: OrderBlock | 'nothing' | null = kind ? canOrder(game, kind, at.x, at.y, facing, size) : tilesOf(game)[`${at.x},${at.y}`] ? null : 'nothing'

  useEffect(() => {
    const c = ref.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    g.clearRect(0, 0, c.width, c.height)
    // 드러난 새 터의 실제 칸 (흐린 색): 풀밭 바탕 위에 숲 가장자리·서고(벽·문)·길·표지·꽃
    g.fillStyle = GROUND_COLOR['.']
    g.fillRect(0, 0, c.width, c.height)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const color = GROUND_COLOR[NEWLAND_MAP[y]?.[x] ?? '.']
        if (!color || color === GROUND_COLOR['.']) continue
        g.fillStyle = color
        g.fillRect(x * CELL, y * CELL, CELL, CELL)
      }
    }
    // 건축할 수 있는 구역만 옅은 격자
    g.strokeStyle = 'rgba(90,110,70,0.18)'
    g.lineWidth = 1
    const gx0 = BUILD_RECT.x0 * CELL
    const gx1 = (BUILD_RECT.x1 + 1) * CELL
    const gy0 = BUILD_RECT.y0 * CELL
    const gy1 = (BUILD_RECT.y1 + 1) * CELL
    for (let i = BUILD_RECT.x0; i <= BUILD_RECT.x1 + 1; i++) {
      g.beginPath()
      g.moveTo(i * CELL + 0.5, gy0)
      g.lineTo(i * CELL + 0.5, gy1)
      g.stroke()
    }
    for (let j = BUILD_RECT.y0; j <= BUILD_RECT.y1 + 1; j++) {
      g.beginPath()
      g.moveTo(gx0, j * CELL + 0.5)
      g.lineTo(gx1, j * CELL + 0.5)
      g.stroke()
    }
    const cell = (t: Tile, color: string) => {
      g.fillStyle = color
      g.fillRect(t.x * CELL + 1, t.y * CELL + 1, CELL - 1, CELL - 1)
    }
    for (const [k, v] of Object.entries(tilesOf(game))) {
      const [x, y] = k.split(',').map(Number)
      cell({ x, y }, TILE_COLOR[v] ?? '#9db97f')
    }
    for (const b of buildsOf(game)) {
      const color = b.state === 'done' ? (b.kind === 'home' ? '#a98d74' : '#e2d6b5') : '#d9bf9f'
      for (const t of areaOf(b.kind, b.x, b.y)) cell(t, color)
      const d = doorOf(b.kind, b.x, b.y, b.facing)
      if (d) cell(d.door, '#f4ecd8')
    }
    // 미리 볼 자리: 색을 바꾸지 않고 점선 테두리만
    const box = isBuildKind(kind) ? boxOf(at.x, at.y) : areaOf(kind ?? 'path', at.x, at.y, size)
    const x0 = Math.min(...box.map((t) => t.x))
    const y0 = Math.min(...box.map((t) => t.y))
    g.strokeStyle = '#3d4f7a'
    g.lineWidth = 2
    g.setLineDash([4, 3])
    g.strokeRect(x0 * CELL + 1, y0 * CELL + 1, span * CELL - 2, span * CELL - 2)
    g.setLineDash([])
    if (kind && isBuildKind(kind) && SITES[kind].doors) {
      const d = doorOf(kind, at.x, at.y, facing)
      if (d) {
        g.fillStyle = '#3d4f7a'
        g.fillRect(d.door.x * CELL + 2, d.door.y * CELL + 2, CELL - 4, CELL - 4)
      }
    }
  }, [game, kind, at.x, at.y, facing, size, span])

  const onTap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const cx = Math.floor(((e.clientX - r.left) / r.width) * W)
    const cy = Math.floor(((e.clientY - r.top) / r.height) * H)
    const off = span > 1 ? 1 : 0
    setPos({ x: cx - off, y: cy - off })
  }
  const move = (dx: number, dy: number) => setPos({ x: at.x + dx, y: at.y + dy })

  const name = kind ? siteName(kind) : T.build.eraser
  const reason = block === null ? null : block === 'nothing' ? T.build.blockNothing : BLOCK_TEXT[block]

  const place = () => {
    if (block !== null) return
    if (kind) {
      const ok = orderSite(kind, at.x, at.y, facing, size)
      if (ok && (isBuildKind(kind))) onPlaced()
    } else eraseTile(at.x, at.y)
  }

  return (
    <div className="site-preview">
      <h2>{name}</h2>
      <canvas ref={ref} className="site-canvas" width={W * CELL} height={H * CELL} role="img" aria-label={T.build.preview} onPointerDown={onTap} />
      <div className="site-move" role="group" aria-label={T.build.preview}>
        <button aria-label={T.build.left} onClick={() => move(-1, 0)}>{T.build.markLeft}</button>
        <button aria-label={T.build.up} onClick={() => move(0, -1)}>{T.build.markUp}</button>
        <button aria-label={T.build.downMove} onClick={() => move(0, 1)}>{T.build.markDown}</button>
        <button aria-label={T.build.right} onClick={() => move(1, 0)}>{T.build.markRight}</button>
      </div>
      {def && def.sizes.length > 1 && (
        <div className="tabs" role="group" aria-label={T.build.size}>
          {def.sizes.map((n) => (
            <button key={n} className={size === n ? 'on' : ''} aria-pressed={size === n} onClick={() => setSize(n)}>
              {n === 1 ? T.build.size1 : T.build.size3}
            </button>
          ))}
        </div>
      )}
      {def && def.facings.length > 1 && (
        <div className="tabs" role="group" aria-label={T.build.facing}>
          <span className="site-facing-label">{T.build.facing}</span>
          {def.facings.map((f) => (
            <button key={f} className={facing === f ? 'on' : ''} aria-pressed={facing === f} onClick={() => setFacing(f)}>
              {FACING_TEXT[f]}
            </button>
          ))}
        </div>
      )}
      {kind && (
        <p className="hint">
          {fill(T.build.cost, { cost: costText(kind, size) })}
          {(isBuildKind(kind)) && ` · ${T.build.days}`}
        </p>
      )}
      {reason && (
        <p className="site-reason" role="status">
          {reason}
        </p>
      )}
      <div className="actions menu column">
        <button className="primary" disabled={block !== null} onClick={place}>
          {kind ? T.build.place : T.build.clear}
        </button>
        <button onClick={onBack}>{T.build.back}</button>
      </div>
    </div>
  )
}
