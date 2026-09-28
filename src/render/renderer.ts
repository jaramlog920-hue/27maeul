// 캔버스 그리기. 엔진 상태를 읽기만 하고 바꾸지 않는다.
import { barleyRipe, festivalOf, FESTIVAL_FROM, FESTIVAL_TO, grapesRipe, isWet, weatherOf } from '../engine/calendar'
import { darkness, phaseOf, seasonOf } from '../engine/clock'
import { isGrown, STRAY_SPOTS, EAVES } from '../engine/companion'
import { totalChapters } from '../engine/books'
import { straysToday, type GameState } from '../engine/game'
import { FURNITURE_DEFS, type Furniture } from '../engine/room'
import { drawDecor, lanternLights, sheepCount } from './decor'
import { FIRE, isNear, npcTile } from '../engine/neighbors'
import { babyStage, childGrowth, rainbowVisible } from '../engine/stories'
import { cameraFor, HEIGHT, isIndoor, MAP, TILE, VIEW_H, VIEW_W, WIDTH, sameTile } from '../engine/world'
import type { Facing, GameContent, Season, Tile } from '../engine/types'
import { breathOffset, dozeNod, isBlinking, lookSide, walkFrame } from './anim'
import {
  ANIMAL,
  ANIMAL_PALETTE,
  BABY,
  BUTTERFLY,
  ICON_PALETTE,
  ICONS,
  SHEEP,
  SMALL_PALETTE,
  spriteRows,
  writerPalette,
  PALETTE,
  type Pose,
  type SpriteRows,
  type Who,
} from './sprites'

const C = {
  grass: '#8cc063',
  grass2: '#7aad55',
  grass3: '#a3cf72',
  worn: '#b9b46e',
  worn2: '#c9a66b',
  path: '#d8b27a',
  path2: '#c49a62',
  floor: '#c89a66',
  floor2: '#b3875a',
  wall: '#9a7456',
  wallTop: '#c09470',
  wallDark: '#6e523c',
  leaf: '#4f8a3c',
  leaf2: '#3d7030',
  leaf3: '#6aa84f',
  trunk: '#6b4a2e',
  stone: '#aaa89e',
  stoneDark: '#7d7b72',
  water: '#5aa0d8',
  water2: '#7bb6e3',
  wood: '#a4703f',
  woodDark: '#7a5230',
  blanket: '#d9776a',
  blanketDark: '#b85e53',
  pillow: '#f3ead8',
  paper: '#f1e3bf',
  lamp: '#f5c542',
  door: '#8a5d34',
  shadow: 'rgba(40,25,10,0.22)',
  fire: '#f28c3a',
  fire2: '#f5d46a',
  reed: '#7fa35a',
  reed2: '#5f8440',
  olive: '#6f8f5a',
  olive2: '#56733f',
  vine: '#5f8f3f',
  grapes: '#6b3f7a',
  fence: '#8a6a44',
  awning: '#c85a4a',
  awning2: '#f0e0c0',
  flower: ['#f28ca0', '#f5d46a', '#ffffff', '#b48ae0'],
}

const SEASON_GRASS: Record<Season, [string, string, string]> = {
  spring: ['#8cc063', '#7aad55', '#a3cf72'],
  summer: ['#9cc25a', '#86ad4a', '#b5d06e'],
  autumn: ['#b0a95a', '#998f48', '#c4b96a'],
  winter: ['#a7b39a', '#95a088', '#bcc6b0'],
}

type Ctx = CanvasRenderingContext2D

/** 칸마다 같은 무늬가 나오도록 좌표로 만든 난수 */
function hash(x: number, y: number, i: number): number {
  let h = (x * 374761393 + y * 668265263 + i * 2147483647) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return (h ^ (h >>> 16)) / 4294967296
}

function speckle(g: Ctx, px: number, py: number, x: number, y: number, color: string, n: number) {
  g.fillStyle = color
  for (let i = 0; i < n; i++) g.fillRect(px + Math.floor(hash(x, y, i) * 15), py + Math.floor(hash(x, y, i + 50) * 15), 1, 1)
}

function drawGround(g: Ctx, ch: string, x: number, y: number, season: Season) {
  const px = x * TILE
  const py = y * TILE
  const [g1, g2, g3] = SEASON_GRASS[season]
  if ('fbdhskD'.includes(ch)) {
    g.fillStyle = C.floor
    g.fillRect(px, py, TILE, TILE)
    g.fillStyle = C.floor2
    g.fillRect(px, py + 7, TILE, 1)
    g.fillRect(px, py + 15, TILE, 1)
    g.fillRect(px + ((x + y) % 2 ? 4 : 11), py, 1, 7)
    g.fillRect(px + ((x + y) % 2 ? 10 : 2), py + 8, 1, 7)
  } else if (ch === ',' || ch === 'm' || ch === 'A' || ch === 'P') {
    g.fillStyle = C.path
    g.fillRect(px, py, TILE, TILE)
    speckle(g, px, py, x, y, C.path2, 6)
  } else if (ch === '~' || ch === '=') {
    g.fillStyle = C.water
    g.fillRect(px, py, TILE, TILE)
    g.fillStyle = C.water2
    g.fillRect(px + Math.floor(hash(x, y, 1) * 10), py + 4 + Math.floor(hash(x, y, 2) * 8), 5, 1)
  } else if (ch !== '#') {
    g.fillStyle = g1
    g.fillRect(px, py, TILE, TILE)
    speckle(g, px, py, x, y, g2, 7)
    speckle(g, px, py, x + 99, y, g3, 3)
  }
}

function drawObject(g: Ctx, ch: string, x: number, y: number, season: Season) {
  const px = x * TILE
  const py = y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  switch (ch) {
    case '#':
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 4)
      r(C.wallDark, 0, 14, 16, 2)
      r(C.wallDark, ((x * 5) % 12) + 2, 7, 3, 1)
      break
    case 'T': {
      const leaf = season === 'autumn' ? '#b8893a' : season === 'winter' ? '#6f7f63' : C.leaf
      r(C.shadow, 3, 13, 11, 3)
      r(C.trunk, 6, 10, 4, 5)
      r(C.leaf2, 1, 2, 14, 10)
      r(leaf, 2, 1, 12, 9)
      r(season === 'autumn' ? '#d0a24a' : C.leaf3, 4, 2, 4, 3)
      break
    }
    case 'w':
      r(C.shadow, 2, 13, 13, 3)
      r(C.stoneDark, 2, 4, 12, 11)
      r(C.stone, 2, 3, 12, 10)
      r(C.water, 4, 5, 8, 6)
      r(C.stoneDark, 4, 5, 8, 1)
      r(C.woodDark, 1, 0, 2, 6)
      r(C.woodDark, 13, 0, 2, 6)
      r(C.wood, 1, 0, 14, 2)
      break
    case 'b':
      r(C.woodDark, 1, 1, 14, 14)
      r(C.blanket, 2, 5, 12, 9)
      r(C.blanketDark, 2, 12, 12, 2)
      r(C.pillow, 3, 2, 10, 3)
      break
    case 'd':
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 11, 2, 4)
      r(C.woodDark, 12, 11, 2, 4)
      r(C.wood, 1, 4, 14, 8)
      r(C.woodDark, 1, 11, 14, 1)
      r(C.paper, 3, 5, 8, 5)
      r(C.woodDark, 4, 6, 6, 1)
      r(C.woodDark, 4, 8, 4, 1)
      r(C.lamp, 12, 3, 2, 3)
      break
    case 'h':
      r(C.stoneDark, 1, 2, 14, 13)
      r(C.stone, 2, 3, 12, 6)
      r('#2a1f1a', 4, 9, 8, 5)
      break
    case 's':
      r(C.woodDark, 1, 1, 14, 14)
      r(C.wood, 2, 4, 12, 1)
      r(C.wood, 2, 9, 12, 1)
      r(C.wood, 2, 14, 12, 1)
      break
    case 'k':
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 10, 2, 5)
      r(C.woodDark, 12, 10, 2, 5)
      r(C.wood, 1, 5, 14, 6)
      r(C.reed, 3, 6, 5, 2)
      r('#2a2230', 10, 6, 3, 3)
      break
    case 'B':
      r(C.shadow, 1, 11, 15, 3)
      r(C.woodDark, 2, 9, 2, 5)
      r(C.woodDark, 12, 9, 2, 5)
      r(C.wood, 1, 7, 14, 3)
      break
    case 'D':
      r(C.door, 0, 0, 16, 3)
      break
    case 'r':
      for (let i = 0; i < 5; i++) r(i % 2 ? C.reed2 : C.reed, 2 + i * 3, 2 + ((i * 5) % 4), 1, 12)
      r(C.woodDark, 3, 2, 2, 3)
      r(C.woodDark, 9, 1, 2, 3)
      break
    case 'v':
      r(C.woodDark, 0, 7, 16, 1)
      r(C.woodDark, 7, 3, 2, 12)
      r(season === 'winter' ? '#7a6a52' : C.vine, 2, 2, 12, 7)
      if (season !== 'winter') r(C.leaf3, 4, 3, 3, 2)
      break
    case 'o':
      r(C.shadow, 3, 13, 11, 3)
      r(C.trunk, 7, 9, 3, 6)
      r(C.olive2, 1, 1, 14, 10)
      r(C.olive, 2, 2, 11, 7)
      break
    case 'P':
      r(C.shadow, 1, 12, 15, 3)
      r(C.stoneDark, 1, 6, 14, 9)
      r(C.stone, 2, 7, 12, 6)
      r(C.woodDark, 7, 0, 2, 8)
      r(C.woodDark, 2, 1, 12, 2)
      break
    case 'A':
      r(C.shadow, 2, 12, 13, 3)
      r('#3f3f46', 3, 5, 10, 4)
      r('#56565e', 5, 9, 6, 5)
      r('#2a2a30', 2, 5, 2, 2)
      break
    case 'O':
      r(C.stoneDark, 1, 3, 14, 12)
      r(C.stone, 2, 4, 12, 6)
      r('#2a1f1a', 5, 9, 6, 5)
      r(C.fire, 6, 11, 4, 3)
      break
    case 'm':
      r(C.woodDark, 1, 6, 2, 10)
      r(C.woodDark, 13, 6, 2, 10)
      for (let i = 0; i < 4; i++) r(i % 2 ? C.awning2 : C.awning, i * 4, 1, 4, 5)
      r(C.wood, 1, 10, 14, 3)
      r(x < 16 ? '#e0c878' : '#6b3f7a', 3, 8, 3, 2)
      r(x < 16 ? '#f1e6cf' : '#7aa84f', 9, 8, 3, 2)
      break
    case 'x':
      r(C.fence, 0, 5, 16, 2)
      r(C.fence, 0, 10, 16, 2)
      r(C.woodDark, 2, 3, 2, 11)
      r(C.woodDark, 12, 3, 2, 11)
      break
    case 'y': {
      const col = season === 'summer' ? ['#e0c060', '#c9a24a'] : season === 'spring' ? ['#8fbf5a', '#76a648'] : season === 'autumn' ? ['#b89a5a', '#9c8048'] : ['#9a8a6a', '#86765a']
      g.fillStyle = col[1]
      g.fillRect(px, py, TILE, TILE)
      for (let i = 0; i < 4; i++) r(col[0], 1 + i * 4, 2, 2, 11)
      break
    }
    case '*':
      if (season !== 'winter')
        for (let i = 0; i < 3; i++) {
          r(C.flower[(x + y + i) % 4], 2 + Math.floor(hash(x, y, i + 7) * 11), 3 + Math.floor(hash(x, y, i + 9) * 10), 2, 2)
        }
      break
    case '=':
      r(C.wood, 0, 3, 16, 10)
      r(C.woodDark, 0, 7, 16, 1)
      r(C.woodDark, 5, 3, 1, 10)
      r(C.woodDark, 11, 3, 1, 10)
      break
  }
}

const mapCache = new Map<Season, HTMLCanvasElement>()
function mapFor(season: Season): HTMLCanvasElement {
  let c = mapCache.get(season)
  if (c) return c
  c = document.createElement('canvas')
  c.width = WIDTH * TILE
  c.height = HEIGHT * TILE
  const g = c.getContext('2d')!
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const ch = MAP[y][x]
      drawGround(g, ch, x, y, season)
      drawObject(g, ch, x, y, season)
    }
  mapCache.set(season, c)
  return c
}

const spriteCache = new Map<string, HTMLCanvasElement>()
function paint(keyStr: string, rows: SpriteRows, palette: Record<string, string>): HTMLCanvasElement {
  let c = spriteCache.get(keyStr)
  if (c) return c
  c = document.createElement('canvas')
  c.width = Math.max(...rows.map((r) => r.length))
  c.height = rows.length
  const g = c.getContext('2d')!
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const col = palette[ch]
      if (ch === '.' || !col) return
      g.fillStyle = col
      g.fillRect(x, y, 1, 1)
    }),
  )
  spriteCache.set(keyStr, c)
  return c
}

/** 가방 아이콘 (UI에서도 쓴다) */
export function iconCanvas(id: string): HTMLCanvasElement | null {
  const rows = ICONS[id]
  return rows ? paint(`icon/${id}`, rows, ICON_PALETTE) : null
}

/** 머리 위 작은 풍선 — 몸과 일상의 표정만 (exclusion-list §1-3) */
function bubble(g: Ctx, cx: number, top: number, draw: (x: number, y: number) => void) {
  const x = Math.round(cx - 5)
  const y = Math.round(top - 10)
  g.fillStyle = '#3b2a20'
  g.fillRect(x - 1, y - 1, 12, 10)
  g.fillStyle = '#fffaf0'
  g.fillRect(x, y, 10, 8)
  g.fillRect(x + 3, y + 8, 2, 2)
  g.fillStyle = '#3b2a20'
  draw(x, y)
}

type EmoteId = 'z' | 'note' | 'yawn' | 'talk' | 'heart' | 'sweat' | 'hungry' | 'shiver'
function emote(g: Ctx, id: EmoteId, cx: number, top: number) {
  bubble(g, cx, top, (x, y) => {
    const f = (dx: number, dy: number, w = 1, h = 1, col = '#3b2a20') => {
      g.fillStyle = col
      g.fillRect(x + dx, y + dy, w, h)
    }
    switch (id) {
      case 'z':
        f(3, 2, 4)
        f(5, 3)
        f(4, 4)
        f(3, 5, 4)
        break
      case 'note':
        f(5, 1, 1, 5)
        f(6, 1, 2)
        f(3, 5, 3, 2)
        break
      case 'yawn':
        f(3, 2, 4)
        f(3, 5, 4)
        f(2, 3, 1, 2)
        f(7, 3, 1, 2)
        break
      case 'talk':
        f(2, 4)
        f(4, 4)
        f(6, 4)
        break
      case 'heart':
        f(2, 2, 2, 1, '#d9536a')
        f(6, 2, 2, 1, '#d9536a')
        f(1, 3, 8, 2, '#d9536a')
        f(2, 5, 6, 1, '#d9536a')
        f(4, 6, 2, 1, '#d9536a')
        break
      case 'sweat':
        f(5, 1, 1, 1, '#5aa0d8')
        f(4, 2, 3, 3, '#5aa0d8')
        f(5, 5, 1, 1, '#5aa0d8')
        break
      case 'hungry':
        f(2, 4, 6, 3, '#a4703f')
        f(3, 3, 4, 1, '#e0c878')
        break
      case 'shiver':
        f(1, 2, 1, 4, '#6fa0d0')
        f(8, 2, 1, 4, '#6fa0d0')
        f(4, 3, 2, 2, '#6fa0d0')
        break
    }
  })
}

function drawSprite(g: Ctx, c: HTMLCanvasElement, wx: number, wy: number, dy = 0) {
  // 발이 칸 아래쪽에 닿도록, 가운데 맞춤
  const px = Math.round(wx * TILE + (TILE - c.width) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - c.height - dy)
  g.fillStyle = C.shadow
  g.fillRect(px + 1, Math.round(wy * TILE) + 13, c.width - 2, 2)
  g.drawImage(c, px, py)
}

function person(who: Who, facing: Facing, frame: 0 | 1, blink: boolean, pose: Pose, season: Season, extra: { inky?: boolean; growth?: number } = {}) {
  const rows = spriteRows(who, facing, { frame, blink, pose, season, ...extra })
  const pal = who === 'writer' ? writerPalette(season) : PALETTE
  return paint(`${who}/${facing}/${frame}/${blink}/${pose}/${who === 'writer' ? season : ''}/${extra.inky ?? ''}/${extra.growth ?? ''}`, rows, pal)
}

function animal(kind: 'cat' | 'dog', form: 'adult' | 'baby' | 'curl', facing: Facing) {
  let rows: SpriteRows = ANIMAL[kind][form]
  if (facing === 'left') rows = rows.map((r) => [...r].reverse().join(''))
  return paint(`animal/${kind}/${form}/${facing === 'left' ? 'l' : 'r'}`, rows, ANIMAL_PALETTE[kind])
}

// ── 방의 가구 ──

function furnitureOrder(f: Furniture): number {
  const layer = FURNITURE_DEFS[f.item]?.layer
  if (f.on) return 3
  return layer === 'floor' ? 0 : layer === 'solid' ? 1 : 2
}

function drawFurniture(g: Ctx, f: Furniture) {
  const px = f.x * TILE
  const py = f.y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  switch (f.item) {
    case 'rug': {
      // 3×2칸 무늬 깔개
      r('#8e3f30', 1, 2, 46, 28)
      r('#b4533f', 3, 4, 42, 24)
      r('#e0c878', 6, 7, 36, 18)
      r('#b4533f', 9, 10, 30, 12)
      for (let i = 0; i < 5; i++) r('#e0c878', 12 + i * 6, 15, 3, 3)
      for (let i = 0; i < 12; i++) {
        r('#f1e6cf', 2 + i * 4, 0, 1, 2)
        r('#f1e6cf', 2 + i * 4, 30, 1, 2)
      }
      return
    }
    case 'cushion':
      r('#d9ccb0', 2, 7, 12, 8)
      r('#f6f1e6', 3, 6, 10, 7)
      r('#d9ccb0', 7, 8, 2, 2)
      return
    case 'table':
      r(C.shadow, 1, 13, 30, 3)
      r(C.woodDark, 2, 9, 2, 6)
      r(C.woodDark, 28, 9, 2, 6)
      r(C.woodDark, 0, 8, 32, 2)
      r(C.wood, 0, 3, 32, 6)
      r('#c08a55', 1, 4, 30, 1)
      return
    case 'nightstand':
      r(C.shadow, 2, 13, 13, 3)
      r(C.woodDark, 2, 4, 12, 11)
      r(C.wood, 3, 5, 10, 4)
      r(C.wood, 3, 10, 10, 4)
      r('#3b2a20', 7, 11, 2, 1)
      return
    case 'stool':
      r(C.shadow, 3, 13, 10, 3)
      r(C.woodDark, 4, 9, 2, 6)
      r(C.woodDark, 10, 9, 2, 6)
      r(C.wood, 3, 7, 10, 3)
      return
    default: {
      const ic = iconCanvas(f.item)
      // 탁자 위에 올린 것은 탁자 윗면에, 바닥의 것은 칸 가운데에
      if (ic) g.drawImage(ic, px + 4, py + (f.on ? -2 : 6))
    }
  }
}

// ── 날씨 입자 ──

function drawWeather(g: Ctx, weather: string, t: number, w: number, h: number) {
  if (weather === 'rain') {
    g.fillStyle = 'rgba(160, 190, 230, 0.7)'
    for (let i = 0; i < 70; i++) {
      const x = (hash(i, 1, 3) * w + t * 30) % w
      const y = (hash(i, 2, 5) * h + t * 220) % h
      g.fillRect(Math.round(x), Math.round(y), 1, 4)
    }
    g.fillStyle = 'rgba(40, 60, 90, 0.12)'
    g.fillRect(0, 0, w, h)
  } else if (weather === 'snow') {
    g.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 60; i++) {
      const x = (hash(i, 3, 3) * w + Math.sin(t + i) * 6 + t * 8) % w
      const y = (hash(i, 4, 5) * h + t * 22) % h
      g.fillRect(Math.round(x), Math.round(y), 2, 2)
    }
  } else if (weather === 'wind') {
    for (let i = 0; i < 10; i++) {
      g.fillStyle = i % 2 ? '#7aad55' : '#c9a24a'
      const x = (hash(i, 5, 3) * w + t * 90) % w
      const y = (hash(i, 6, 5) * h + Math.sin(t * 3 + i) * 10) % h
      g.fillRect(Math.round(x), Math.round(y), 2, 1)
    }
  } else if (weather === 'fog') {
    g.fillStyle = 'rgba(235, 238, 240, 0.35)'
    g.fillRect(0, 0, w, h)
  } else if (weather === 'hot') {
    g.fillStyle = 'rgba(255, 220, 150, 0.08)'
    g.fillRect(0, 0, w, h)
  }
}

function drawRainbow(g: Ctx, w: number) {
  const cols = ['#e86a6a', '#f2a64a', '#f5d46a', '#7ac76a', '#6aa0e0', '#8a6ad0']
  cols.forEach((c, i) => {
    g.strokeStyle = c
    g.globalAlpha = 0.45
    g.lineWidth = 3
    g.beginPath()
    g.arc(w / 2, 150, 120 - i * 3, Math.PI * 1.08, Math.PI * 1.92)
    g.stroke()
  })
  g.globalAlpha = 1
}

function glow(g: Ctx, x: number, y: number, radius: number, alpha: number, color = '255, 200, 110') {
  const grad = g.createRadialGradient(x, y, 2, x, y, radius)
  grad.addColorStop(0, `rgba(${color}, ${alpha})`)
  grad.addColorStop(1, `rgba(${color}, 0)`)
  g.fillStyle = grad
  g.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

function flame(g: Ctx, px: number, py: number, t: number, big = false) {
  const f = Math.floor(t * 8) % 3
  const s = big ? 2 : 1
  g.fillStyle = C.fire
  g.fillRect(px - 2 * s, py - (4 + f) * s, 4 * s, (4 + f) * s)
  g.fillStyle = C.fire2
  g.fillRect(px - 1 * s, py - (3 + ((f + 1) % 3)) * s, 2 * s, (3 + ((f + 1) % 3)) * s)
}

// ── 그리기 ──

export interface Renderer {
  zoom: number
  /** 카메라 왼쪽 위 (칸) */
  camera: { x: number; y: number }
  draw(game: GameState, t: number, dt: number): void
}

export function createRenderer(g: Ctx, content: GameContent): Renderer {
  g.imageSmoothingEnabled = false
  const steps: { x: number; y: number; t: number }[] = []
  let lastStep = ''
  const renderer: Renderer = {
    zoom: 1,
    camera: { x: 0, y: 0 },
    draw(game, t, dt) {
      const W = VIEW_W * TILE / renderer.zoom
      const H = VIEW_H * TILE / renderer.zoom
      g.setTransform(renderer.zoom, 0, 0, renderer.zoom, 0, 0)
      const day = game.clock.day
      const minute = game.clock.minute
      const season = seasonOf(day)
      const weather = weatherOf(day)
      const wet = isWet(weather)
      const phase = phaseOf(minute)
      const p = game.player
      const here = { x: Math.round(p.x), y: Math.round(p.y) }

      // 카메라: 부드럽게 따라간다
      const target = cameraFor(p.x, p.y, renderer.zoom)
      const cam = renderer.camera
      if (dt <= 0 || Math.abs(target.x - cam.x) + Math.abs(target.y - cam.y) > 6) {
        cam.x = target.x
        cam.y = target.y
      } else {
        const k = Math.min(1, dt * 6)
        cam.x += (target.x - cam.x) * k
        cam.y += (target.y - cam.y) * k
      }
      const ox = Math.round(cam.x * TILE)
      const oy = Math.round(cam.y * TILE)

      const outdoors = !isIndoor(here)
      let festOn = false
      g.save()
      try {
      g.fillStyle = '#2b2118'
      g.fillRect(0, 0, W, H)
      g.translate(-ox, -oy)
      g.drawImage(mapFor(season), 0, 0)

      // 오솔길: 자주 밟은 풀밭
      for (const [k, n] of Object.entries(game.trails)) {
        if (n < 12) continue
        const [x, y] = k.split(',').map(Number)
        g.fillStyle = n >= 40 ? C.worn2 : C.worn
        g.globalAlpha = n >= 40 ? 0.9 : 0.5
        g.fillRect(x * TILE + 3, y * TILE + 4, 10, 8)
        g.fillRect(x * TILE + 5, y * TILE + 2, 6, 12)
        g.globalAlpha = 1
      }

      // 비·눈 오는 날 흙길에 남는 발자국 (1분 동안 옅어진다)
      const stepKey = `${here.x},${here.y}`
      if (stepKey !== lastStep) {
        lastStep = stepKey
        if (wet && MAP[here.y]?.[here.x] === ',') steps.push({ x: here.x, y: here.y, t })
      }
      while (steps.length && (t - steps[0].t > 60 || steps[0].t > t)) steps.shift()
      for (const st of steps) {
        g.fillStyle = `rgba(80, 55, 30, ${0.5 * (1 - (t - st.t) / 60)})`
        g.fillRect(st.x * TILE + 5, st.y * TILE + 6, 2, 3)
        g.fillRect(st.x * TILE + 9, st.y * TILE + 9, 2, 3)
      }

      // 눈 쌓인 땅
      if (weather === 'snow') {
        g.fillStyle = 'rgba(255,255,255,0.35)'
        g.fillRect(0, 0, WIDTH * TILE, HEIGHT * TILE)
      }

      // 익은 포도
      if (grapesRipe(day))
        MAP.forEach((row, y) =>
          [...row].forEach((ch, x) => {
            if (ch !== 'v') return
            g.fillStyle = C.grapes
            g.fillRect(x * TILE + 3, y * TILE + 6, 2, 3)
            g.fillRect(x * TILE + 10, y * TILE + 5, 2, 3)
          }),
        )
      if (barleyRipe(day)) {
        g.fillStyle = 'rgba(255, 230, 140, 0.25)'
        g.fillRect(13 * TILE, 19 * TILE, 7 * TILE, 6 * TILE)
      }

      // 선반의 두루마리, 책상의 잉크 자국, 등잔 그을음
      const done = totalChapters(game)
      for (let i = 0; i < Math.min(12, done); i++) {
        g.fillStyle = i % 2 ? '#e9d9b0' : '#f3e6c4'
        g.fillRect(9 * TILE + 3 + (i % 4) * 3, 3 * TILE + 1 + Math.floor(i / 4) * 5, 2, 3)
      }
      for (let i = 0; i < Math.min(8, done); i++) {
        g.fillStyle = 'rgba(30, 20, 40, 0.55)'
        g.fillRect(3 * TILE + 2 + Math.floor(hash(i, 3, 1) * 11), 5 * TILE + 5 + Math.floor(hash(i, 4, 1) * 6), 1, 1)
      }
      const soot = Math.min(0.7, (game.flags.lampNights ?? 0) * 0.04)
      if (soot > 0) {
        g.fillStyle = `rgba(30, 25, 20, ${soot})`
        g.fillRect(3 * TILE + 12, 5 * TILE + 3, 2, 2)
      }
      // 방의 가구: 깔개 → 길을 막는 가구 → 위에 올린 작은 물건
      const ordered = [...game.room].sort((a, b) => furnitureOrder(a) - furnitureOrder(b) || a.y - b.y)
      for (const f of ordered) drawFurniture(g, f)
      // 화덕 불
      flame(g, 6 * TILE + 8, 3 * TILE + 14, t)
      // 행사 모닥불
      const fest = festivalOf(day)
      festOn = !!fest && !wet && minute >= FESTIVAL_FROM && minute < FESTIVAL_TO
      if (festOn) {
        g.fillStyle = C.woodDark
        g.fillRect(FIRE.x * TILE + 3, FIRE.y * TILE + 12, 10, 3)
        flame(g, FIRE.x * TILE + 8, FIRE.y * TILE + 13, t, true)
      }

      // 마음이 쌓여 마을에 생긴 것들
      drawDecor(g, game, weather, t, phase === 'morning' || phase === 'day')

      type Item = { y: number; paint: () => void }
      const items: Item[] = []

      // 양 우리의 양 (우리를 넓히면 둘 더)
      ;[
        [4, 21],
        [6, 22],
        [5, 20.5],
        [4, 22.5],
        [6.5, 20.5],
      ].slice(0, sheepCount(game)).forEach(([sx, sy], i) => {
        const x = sx + Math.sin(t * 0.3 + i * 2) * 0.6
        const y = sy + Math.cos(t * 0.23 + i) * 0.5
        items.push({ y, paint: () => drawSprite(g, paint(`sheep/${Math.sin(t * 0.3 + i * 2) > 0 ? 'r' : 'l'}`, Math.sin(t * 0.3 + i * 2) > 0 ? SHEEP : SHEEP.map((r) => [...r].reverse().join('')), SMALL_PALETTE), x, y) })
      })

      // 이웃
      for (const def of content.neighbors) {
        const n = game.npcs[def.id]
        if (!n?.visible) continue
        const moving = n.path.length > 0
        const facing = moving ? n.facing : 'down'
        const offset = def.id.length * 0.37
        const growth = def.id === 'child' ? childGrowth(day) : undefined
        items.push({
          y: n.y,
          paint: () => {
            const spr = person(def.sprite as Who, facing, moving ? walkFrame(n.walkTime) : 0, isBlinking(t + offset), 'stand', season, { growth })
            drawSprite(g, spr, n.x, n.y, moving ? 0 : breathOffset(t + offset))
            if (game.offers[def.id]) emote(g, 'talk', n.x * TILE + 8, n.y * TILE + TILE - spr.height - 2 - Math.round(Math.sin(t * 3)))
          },
        })
        // 아이가 데려간 동물은 아이 곁에
        if (def.id === 'child' && game.flags.childPet) {
          const kind = game.flags.childPet === 1 ? 'cat' : 'dog'
          items.push({ y: n.y + 0.1, paint: () => drawSprite(g, animal(kind, day - (game.companion?.since ?? day) >= 10 ? 'adult' : 'baby', 'right'), n.x + 0.7, n.y + 0.1) })
        }
        // 빵집 아기
        if (def.id === 'baker' && !moving && !wet) {
          const st = babyStage(day)
          if (st !== 'none')
            items.push({
              y: n.y + 0.05,
              paint: () => {
                const rows = BABY[st]
                const bx = st === 'crawl' ? n.x - 0.8 + Math.sin(t * 0.8) * 0.3 : n.x - 0.6
                drawSprite(g, paint(`baby/${st}`, rows, SMALL_PALETTE), bx, n.y, st === 'baby' ? 6 : 0)
              },
            })
        }
      }

      // 떠돌이 새끼들
      for (const a of straysToday(game)) {
        const s = STRAY_SPOTS[a]
        items.push({ y: s.y, paint: () => drawSprite(g, animal(a, 'baby', Math.sin(t + (a === 'cat' ? 0 : 2)) > 0 ? 'right' : 'left'), s.x, s.y, Math.floor(t * 2) % 2) })
      }

      // 동반 동물
      const comp = game.companion
      if (comp) {
        const cTile = { x: Math.round(comp.x), y: Math.round(comp.y) }
        const still = comp.path.length === 0
        const sleeping = still && ((wet && sameTile(cTile, EAVES) && !isIndoor(here)) || (game.idle.seconds > 15 && isNear(cTile, here)))
        const form = sleeping ? 'curl' : isGrown(comp, day) ? 'adult' : 'baby'
        items.push({
          y: comp.y,
          paint: () => {
            drawSprite(g, animal(comp.kind, form, comp.facing === 'left' ? 'left' : 'right'), comp.x, comp.y, still || sleeping ? 0 : Math.floor(comp.walkTime * 8) % 2)
            if (sleeping && Math.floor(t / 3) % 3 === 0) emote(g, 'z', comp.x * TILE + 8, comp.y * TILE + 8)
          },
        })
      }

      // 기록자
      const kind = game.idle.action?.kind
      const moving = p.path.length > 0
      let facing: Facing = p.facing
      let pose: Pose = 'stand'
      const idleLong = !moving && !kind && game.idle.seconds > 2
      // 가까이 지나가는 이웃에게 손 흔들기
      const nearNpc = Object.values(game.npcs).find((n) => n.visible && isNear(npcTile(n), here, 2))
      if (idleLong && nearNpc && t % 5 < 1.2) {
        facing = 'down'
        pose = 'wave'
      }
      // 비가 오면 손바닥을 내밀어 본다
      if (idleLong && outdoors && weather === 'rain' && t % 7 < 1.5) {
        facing = 'down'
        pose = 'handUp'
      }
      // 나비를 눈으로 따라간다
      const flies = butterflies(season, wet, phase, t)
      const fly = flies.find((b) => Math.abs(b.x - p.x) < 3 && Math.abs(b.y - p.y) < 3)
      if (idleLong && fly && pose === 'stand') facing = fly.x < p.x ? 'left' : 'right'
      // 동물이 곁에 오면 쪼그려 앉는다
      if (idleLong && comp && isNear({ x: Math.round(comp.x), y: Math.round(comp.y) }, here) && game.idle.seconds % 12 > 8) {
        facing = 'down'
        pose = 'crouch'
      }
      if (kind === 'look') facing = lookSide(t)
      if (kind === 'greet' || kind === 'doze') facing = 'down'
      if (kind === 'stretch') {
        facing = 'down'
        pose = 'handUp'
      }
      if (kind === 'wrist') {
        facing = 'down'
        pose = Math.floor(t * 4) % 2 ? 'wave' : 'stand'
      }
      const frame = moving ? walkFrame(p.walkTime) : 0
      const blink = kind === 'doze' || kind === 'yawn' || isBlinking(t)
      const lift = moving ? 0 : kind === 'stretch' ? 1 : kind === 'doze' ? -dozeNod(t) : breathOffset(t)
      items.push({
        y: p.y,
        paint: () => {
          const spr = person('writer', facing, frame, blink, pose, season, { inky: done > 0 })
          drawSprite(g, spr, p.x, p.y, lift)
          const top = Math.round(p.y * TILE) + TILE - spr.height - 2
          const cx = Math.round(p.x * TILE) + 8
          if (kind === 'doze') emote(g, 'z', cx, top)
          else if (kind === 'hum') emote(g, 'note', cx, top - Math.round(Math.sin(t * 4)))
          else if (kind === 'yawn') emote(g, 'yawn', cx, top)
          else if (pose === 'crouch') emote(g, 'heart', cx, top)
          else if (!moving && game.needs.hunger >= 70 && t % 9 < 1.6) emote(g, 'hungry', cx, top)
          else if (!moving && game.needs.cold >= 60 && t % 6 < 1.4) emote(g, 'shiver', cx, top)
          else if (!moving && outdoors && weather === 'hot' && minute > 11 * 60 && minute < 16 * 60 && t % 8 < 1.4) emote(g, 'sweat', cx, top)
          // 겨울 바깥의 입김
          if (outdoors && season === 'winter' && t % 2.4 < 0.8) {
            g.fillStyle = 'rgba(255,255,255,0.7)'
            const k = (t % 2.4) / 0.8
            g.fillRect(cx + (facing === 'left' ? -6 : 4) - Math.round(k * 2), top + 12 - Math.round(k * 3), 2 + Math.round(k), 2)
          }
        },
      })

      // 나비
      for (const b of flies) items.push({ y: b.y + 0.5, paint: () => g.drawImage(paint(`bf/${b.frame}/${b.hue}`, BUTTERFLY[b.frame], { ...SMALL_PALETTE, o: b.hue ? '#8fb8e0' : '#f28c5a', O: b.hue ? '#6a95c4' : '#f5d46a' }), Math.round(b.x * TILE), Math.round(b.y * TILE)) })

      items.sort((a, b) => a.y - b.y).forEach((i) => i.paint())
      } finally {
        // 도중에 오류가 나도 좌표 이동이 쌓이지 않게 반드시 되돌린다
        g.restore()
      }

      // 날씨·무지개·밤 (화면 좌표)
      if (outdoors) drawWeather(g, weather, t, W, H)
      else if (wet) {
        g.fillStyle = 'rgba(40, 60, 90, 0.08)'
        g.fillRect(0, 0, W, H)
      }
      if (rainbowVisible(day, minute) && outdoors) drawRainbow(g, W)
      const dark = darkness(minute)
      if (dark > 0) {
        g.fillStyle = `rgba(20, 22, 60, ${dark})`
        g.fillRect(0, 0, W, H)
        if (dark > 0.15) {
          const sx = (wx: number) => wx - ox
          const sy = (wy: number) => wy - oy
          if (game.lampLitDay === day) glow(g, sx(3 * TILE + 13), sy(5 * TILE + 4), 34, dark * 0.9)
          glow(g, sx(6 * TILE + 8), sy(3 * TILE + 12), 22, dark * 0.6)
          if (festOn) glow(g, sx(FIRE.x * TILE + 8), sy(FIRE.y * TILE + 8), 48, dark)
          // 집집마다 창에 불빛
          for (const [x, y] of [[5, 11], [23, 11], [23, 4]]) glow(g, sx(x * TILE + 8), sy(y * TILE + 4), 14, dark * 0.5)
          // 길가의 등불
          for (const l of lanternLights(game)) glow(g, sx(l.x * TILE + 8), sy(l.y * TILE + 2), 26, dark * 0.8)
        }
      }
    },
  }
  return renderer
}

interface Fly {
  x: number
  y: number
  frame: 0 | 1
  hue: 0 | 1
}
/** 봄·여름 낮의 나비 (그리기와 기록자의 눈길이 같은 자리를 쓴다) */
export function butterflies(season: Season, wet: boolean, phase: string, t: number): Fly[] {
  if (wet || (season !== 'spring' && season !== 'summer') || (phase !== 'morning' && phase !== 'day')) return []
  const centers: Tile[] = [
    { x: 14, y: 2 },
    { x: 8, y: 9 },
    { x: 16, y: 21 },
  ]
  return centers.map((c, i) => ({
    x: c.x + Math.cos(t * 0.7 + i * 2) * 1.6,
    y: c.y + Math.sin(t * 1.1 + i) * 0.9 - 0.5,
    frame: (Math.abs(Math.floor(t * 6 + i)) % 2) as 0 | 1,
    hue: (i % 2) as 0 | 1,
  }))
}
