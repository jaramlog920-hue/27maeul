// 캔버스 그리기. 엔진 상태를 읽기만 하고 바꾸지 않는다.
import { barleyRipe, festivalOf, FESTIVAL_FROM, FESTIVAL_TO, grapesRipe, isWet, weatherOf } from '../engine/calendar'
import { darkness, phaseOf, seasonOf } from '../engine/clock'
import { isGrown, STRAY_SPOTS, EAVES } from '../engine/companion'
import { totalChapters } from '../engine/books'
import { shelvedCount, straysToday, type GameState } from '../engine/game'
import { FURNITURE_DEFS, type Furniture } from '../engine/room'
import { FURNI_PALETTE, FURNITURE_ART } from './furniture-art'
import { drawDecor, lanternLights, sheepCount } from './decor'
import { FIRE, isNear, npcTile } from '../engine/neighbors'
import { babyStage, childGrowth, rainbowVisible } from '../engine/stories'
import { cameraFor, HEIGHT, HOME_DOOR, HOME_RECT, HOUSES, houseAt, lockedZones, tileAt, isHome, isIndoor, MAP, PLACES, ROOMS, roomAt, viewRoomAt, TILE, VIEW_H, VIEW_W, VILLAGE_H, WIDTH, sameTile } from '../engine/world'
import type { Facing, GameContent, Season, Tile } from '../engine/types'
import { breathOffset, dozeNod, isBlinking, lookSide, walkFrame } from './anim'
import { avatarKey, withLookDefaults, type FullAvatar } from '../engine/avatar'
import {
  ANIMAL,
  ANIMAL_PALETTE,
  BABY,
  BUTTERFLY,
  ICON_PALETTE,
  ICONS,
  mirror,
  SHEEP,
  SMALL_PALETTE,
  spriteRows,
  writerPalette,
  PALETTE,
  type Look,
  type Pose,
  type SpriteRows,
  type Who,
} from './sprites'

const C = {
  grass: '#bfcfa4',
  grass2: '#abc292',
  grass3: '#cfdcb6',
  worn: '#b2ae75',
  worn2: '#bca378',
  path: '#e5d3aa',
  path2: '#d6c194',
  floor: '#dbb682',
  floor2: '#c9a171',
  wall: '#f8e6c0',
  wallTop: '#fff6db',
  wallDark: '#ae9068',
  leaf: '#7b9a60',
  leaf2: '#708754',
  leaf3: '#99b67b',
  trunk: '#82684f',
  stone: '#b3ada2',
  stoneDark: '#878176',
  water: '#98c5bb',
  water2: '#bddbcc',
  wood: '#ad845d',
  woodDark: '#8e6a4d',
  blanket: '#c29095',
  blanketDark: '#a2747a',
  pillow: '#f3ead8',
  paper: '#f1e3bf',
  lamp: '#f5c542',
  door: '#987654',
  shadow: 'rgba(40,25,10,0.22)',
  fire: '#f28c3a',
  fire2: '#d8c587',
  reed: '#99b67b',
  reed2: '#7b9a60',
  olive: '#97af83',
  olive2: '#7f9a6c',
  vine: '#618747',
  grapes: '#6b4079',
  fence: '#ad845d',
  awning: '#d98a6a',
  awning2: '#fefdf8',
  flower: ['#f1b999', '#fce2a7', '#fefdf8', '#e8a88a'],
}

const SEASON_GRASS: Record<Season, [string, string, string]> = {
  spring: ['#bfcfa4', '#abc292', '#cfdcb6'],
  summer: ['#bccb96', '#a6b980', '#ccd8a8'],
  autumn: ['#cfc79a', '#bdb483', '#ddd5ac'],
  winter: ['#d3d8c6', '#c2c8b4', '#e0e4d6'],
}

type Ctx = CanvasRenderingContext2D

/** 집마다 다른 모양 — 지붕 무늬·벽·창·문 (아기자기한 파스텔) */
interface HouseStyle {
  /** 지붕 [바탕, 줄·테두리, 빛] */
  roof: [string, string, string]
  pattern: 'scallop' | 'stripe' | 'tile' | 'honey'
  wall: string
  base: string
  window: 'square' | 'round' | 'arch'
  shutter: string
  door: string
  timber?: string
  awning?: [string, string]
}
const HOUSE_STYLES: Record<string, HouseStyle> = {
  home: { roof: ['#b9805c', '#8e6a4d', '#d49a72'], pattern: 'tile', wall: '#f8e6c0', base: '#e5d3aa', window: 'square', shutter: '#ae9068', door: '#987654' },
  library: { roof: ['#7b9a60', '#5f7a48', '#99b67b'], pattern: 'tile', wall: '#f8e6c0', base: '#e5d3aa', window: 'arch', shutter: '#ae9068', door: '#8e6a4d' },
  baker: { roof: ['#ac7759', '#82684f', '#c98f6a'], pattern: 'tile', wall: '#eec59c', base: '#dbb682', window: 'square', shutter: '#ae9068', door: '#987654', awning: ['#d98a6a', '#fefdf8'] },
  child: { roof: ['#7b9a60', '#5f7a48', '#99b67b'], pattern: 'tile', wall: '#f8e6c0', base: '#e5d3aa', window: 'round', shutter: '#ae9068', door: '#987654' },
  grandpa: { roof: ['#a0785c', '#7a5d46', '#bf9474'], pattern: 'tile', wall: '#f3dbb0', base: '#dbc79a', window: 'square', shutter: '#ae9068', door: '#82684f', timber: '#ae9068' },
  weaver: { roof: ['#c48a66', '#9a6a4d', '#dca482'], pattern: 'tile', wall: '#f8e6c0', base: '#e5d3aa', window: 'arch', shutter: '#ae9068', door: '#987654' },
  beekeeper: { roof: ['#b99a5c', '#8e7447', '#d4b87a'], pattern: 'tile', wall: '#f3dbb0', base: '#dbc79a', window: 'round', shutter: '#ae9068', door: '#987654' },
  // 새 이웃 넷 (계획 2): 이웃과 겹치지 않는 차분한 빛 — 잿빛 파랑, 흙빛 장미, 물빛 초록, 나뭇빛
  postman: { roof: ['#8497a8', '#66788a', '#a3b4c3'], pattern: 'tile', wall: '#f3e3c4', base: '#ddd0ad', window: 'square', shutter: '#8e9aa6', door: '#7c6a58' },
  innkeeper: { roof: ['#b0786a', '#8a5a4f', '#c9968a'], pattern: 'tile', wall: '#f5dfbe', base: '#e0c9a0', window: 'arch', shutter: '#ae9068', door: '#82684f', awning: ['#a9b88f', '#fefdf8'] },
  fisher: { roof: ['#7f9f98', '#5f7d77', '#9dbab3'], pattern: 'tile', wall: '#efe2c6', base: '#d9ccab', window: 'round', shutter: '#8a9c8e', door: '#7c6a58' },
  carpenter: { roof: ['#a58a66', '#7e694c', '#c1a680'], pattern: 'tile', wall: '#f3dbb0', base: '#dbc79a', window: 'square', shutter: '#ae9068', door: '#82684f', timber: '#98795a' },
}
const PLAIN_STYLE = HOUSE_STYLES.child
/** 내 집 앞벽 (한 줄뿐이라 '아래 줄'로 그린다) */
const HOME_FRONT = { x0: HOME_RECT.x0, x1: HOME_RECT.x1, y1: HOME_RECT.y1, doorX: HOME_DOOR.x }

/** 앞벽 한 칸: 위 줄은 처마 그림자뿐, 아래 줄에 꽃 상자 달린 창과 문 */
function houseWallTile(g: Ctx, x: number, y: number, ch: string, id: string, h: { x0: number; x1: number; y1: number; doorX: number }) {
  const st = HOUSE_STYLES[id] ?? PLAIN_STYLE
  const px = x * TILE
  const py = y * TILE
  const r = (color: string, dx: number, dy: number, w: number, hh: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, hh)
  }
  const upper = y === h.y1 - 1
  r(st.wall, 0, 0, 16, 16)
  if (upper) r('rgba(90,60,70,0.22)', 0, 0, 16, 3)
  if (!upper) r(st.base, 0, 12, 16, 4)
  if (st.timber) {
    // 나무 들보: 위 가로대(위 줄에만), 집 양끝, 문 양옆 — 문을 가운데 두고 대칭. 선은 2픽셀 (1픽셀은 걸을 때 일렁인다)
    if (upper) r(st.timber, 0, 3, 16, 2)
    if (x === h.x0 || x === h.doorX + 1) r(st.timber, 0, 0, 2, 16)
    if (x === h.x1 || x === h.doorX - 1) r(st.timber, 14, 0, 2, 16)
  }
  if (x === h.x0) r(st.base, 0, 0, 2, 16)
  if (x === h.x1) r(st.base, 14, 0, 2, 16)

  const door = x === h.doorX
  // 창은 아래 줄에만, 문을 가운데 두고 양옆 같은 거리에
  // 넓은 집(7칸 이상)은 문에서 두 칸, 작은 집은 문 바로 옆 — 모서리에 붙지 않게
  const k = h.x1 - h.x0 + 1 >= 7 ? 2 : 1
  const winCol = Math.abs(x - h.doorX) === k
  const glass = '#f1bf6b'
  const glow = '#fce2a7'
  const frame = '#ae9068'
  const window = (dy: number) => {
    if (st.window === 'round') {
      r(frame, 4, dy + 1, 8, 6)
      r(frame, 5, dy, 6, 8)
      r(glass, 5, dy + 1, 6, 6)
      r(glow, 5, dy + 1, 2, 2)
      r(frame, 7, dy + 1, 2, 6)
      r(frame, 5, dy + 3, 6, 2)
    } else if (st.window === 'arch') {
      r(frame, 4, dy + 1, 8, 8)
      r(frame, 5, dy, 6, 1)
      r(glass, 5, dy + 1, 6, 7)
      r(glow, 5, dy + 1, 2, 3)
      r(frame, 7, dy + 1, 2, 7)
    } else {
      r(frame, 3, dy, 10, 9)
      r(glass, 4, dy + 1, 8, 7)
      r(glow, 4, dy + 1, 3, 3)
      r(frame, 7, dy + 1, 2, 7)
      r(frame, 4, dy + 4, 8, 1)
    }
  }
  if (id === 'library') {
    // 서고: 문 위에 동그란 창, 양옆에 큰 아치 창 (두 줄에 걸쳐)
    const archCols = [h.doorX - 3, h.doorX - 2, h.doorX + 2, h.doorX + 3]
    if (archCols.includes(x)) {
      const left = x === h.doorX - 3 || x === h.doorX + 2
      const wx = left ? 8 : 0
      if (upper) {
        r('#ae9068', left ? 6 : 0, 4, 10, 12)
        r('#ae9068', left ? 7 : 0, 3, left ? 9 : 9, 1)
        r('#f1bf6b', wx, 6, 8, 10)
        r('#ae9068', left ? 14 : 0, 6, 2, 10)
      } else {
        r('#ae9068', left ? 6 : 0, 0, 10, 10)
        r('#f1bf6b', wx, 0, 8, 8)
        r('#ae9068', left ? 14 : 0, 0, 2, 8)
        r('#ae9068', wx, 4, 8, 1)
        r('#e5d3aa', left ? 6 : 0, 9, 10, 2)
      }
    }
    // 위 줄(2층 높이)에는 아무것도 달지 않는다 — 창은 아래 줄에만
  } else if (!upper && winCol) {
    window(1)
    r('#ad845d', 3, 10, 10, 2) // 꽃 상자
    for (let i = 0; i < 4; i++) r(['#f1b999', '#fefdf8', '#e8a88a', '#99b67b'][(x + i) % 4], 4 + i * 2, 9, 2, 1)
  }
  if (door && !upper) {
    // 둥근 나무 문과 놋쇠 손잡이
    const dc = ch === 'L' ? '#8e6a4d' : st.door
    r(frame, 2, 1, 12, 15)
    r(dc, 3, 2, 10, 14)
    r(dc, 4, 1, 8, 1)
    r(mix(dc, '#000000', 0.18), 6, 3, 1, 13)
    r(mix(dc, '#000000', 0.18), 9, 3, 1, 13)
    r('#f1bf6b', 10, 9, 2, 2)
  }
  if (st.awning && !upper && Math.abs(x - h.doorX) <= 1) {
    // 빵집 문 위 줄무늬 차양
    for (let i = 0; i < 4; i++) r(i % 2 ? st.awning[1] : st.awning[0], i * 4, 0, 4, 4)
    for (let i = 0; i < 4; i++) r(st.awning[0], i * 4 + 1, 4, 2, 1)
  }
}

/** 칸마다 같은 무늬가 나오도록 좌표로 만든 난수 */
function hash(x: number, y: number, i: number): number {
  let h = (x * 374761393 + y * 668265263 + i * 2147483647) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  // ^ 는 부호 있는 32비트를 돌려준다 — >>> 0 으로 0 이상으로 만들어야 점이 옆 칸으로 새지 않는다
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function speckle(g: Ctx, px: number, py: number, x: number, y: number, color: string, n: number) {
  g.fillStyle = color
  for (let i = 0; i < n; i++) g.fillRect(px + Math.floor(hash(x, y, i) * 15), py + Math.floor(hash(x, y, i + 50) * 15), 1, 1)
}

function drawGround(g: Ctx, ch: string, x: number, y: number, season: Season) {
  const px = x * TILE
  const py = y * TILE
  const [g1, g2, g3] = SEASON_GRASS[season]
  if (ch === '_') {
    g.fillStyle = '#15100c'
    g.fillRect(px, py, TILE, TILE)
    return
  }
  if ('fbdhskD'.includes(ch) || (y >= VILLAGE_H && ch !== '#')) {
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
  } else if (ch === '~' || ch === '=' || ch === 'u' || (ch === 'r' && y >= 33)) {
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
    case 'S': {
      const h = houseAt(x, y)
      if (h) {
        houseWallTile(g, x, y, ch, h.id, h)
        break
      }
      if (y === HOME_RECT.y1 && x >= HOME_RECT.x0 && x <= HOME_RECT.x1) {
        houseWallTile(g, x, y, ch, 'home', HOME_FRONT)
        break
      }
      // 내 집 벽: 크림 회벽과 나무 들보
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      r(C.wallDark, 0, 15, 16, 1)
      break
    }
    case 'R':
      // 지붕은 집 하나를 통째로 나중에 그린다 (drawRoof)
      break
    case 'T': {
      // 둥근 나무: 그림자, 짧은 줄기, 어두운 아랫잎 → 바탕 → 밝은 윗잎
      const [d, m, l] =
        season === 'autumn' ? ['#b08a4a', '#c9a060', '#dcbb7c'] : season === 'winter' ? ['#8f9c86', '#a6b19c', '#c2cab8'] : [C.leaf2, C.leaf, C.leaf3]
      r('rgba(90,80,50,0.18)', 3, 13, 10, 2)
      r(C.trunk, 7, 10, 2, 5)
      r(d, 3, 3, 10, 8)
      r(d, 2, 5, 12, 5)
      r(d, 5, 1, 6, 11)
      r(m, 3, 2, 10, 7)
      r(m, 2, 4, 12, 4)
      r(m, 5, 1, 6, 9)
      r(l, 4, 2, 4, 3)
      r(l, 5, 1, 2, 1)
      break
    }
    case 'L': {
      const h = houseAt(x, y)
      if (h) houseWallTile(g, x, y, ch, h.id, h)
      break
    }
    case 'G':
      // 복음서 선반 (꽂힌 책은 그릴 때 얹는다)
      r(C.shadow, 0, 13, 16, 3)
      r(C.woodDark, 0, 0, 16, 14)
      r(C.wood, 1, 1, 14, 12)
      r(C.woodDark, 1, 12, 14, 1)
      r('#d9b44a', 0, 0, 16, 1)
      break
    case 'K':
      // 잠긴 방 문: 벽에 난 나무문과 자물쇠
      r(C.wall, 0, 0, 16, 16)
      r('#ae9068', 2, 1, 12, 15)
      r(C.woodDark, 3, 2, 10, 14)
      r(C.wood, 4, 3, 8, 13)
      r(C.woodDark, 8, 3, 1, 13)
      r('#8a8478', 6, 8, 4, 4)
      r('#b3ada2', 7, 9, 2, 2)
      break
    case 'n':
      // 탁자와 식탁보
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 10, 2, 5)
      r(C.woodDark, 12, 10, 2, 5)
      r(C.wood, 1, 4, 14, 7)
      r('#efe4d4', 2, 4, 12, 4)
      for (let i = 0; i < 6; i++) r('#b98a8a', 2 + i * 2, 7, 1, 1)
      break
    case 'g':
      // 항아리
      r(C.shadow, 3, 13, 10, 3)
      r('#c2a48a', 4, 5, 8, 9)
      r('#a88a70', 3, 7, 10, 5)
      r('#dcc6b0', 5, 6, 2, 3)
      r('#7f6450', 5, 3, 6, 2)
      break
    case 'p':
      // 꽃 화분
      r(C.shadow, 3, 13, 10, 3)
      r('#b78b7c', 4, 9, 8, 5)
      r('#9b7063', 4, 9, 8, 1)
      r('#7f9c77', 7, 4, 2, 5)
      r('#7f9c77', 4, 5, 3, 2)
      r('#7f9c77', 9, 5, 3, 2)
      r('#e1a6af', 6, 1, 4, 3)
      r('#dbca97', 7, 2, 2, 1)
      break
    case 'W':
      // 베틀과 짜다 만 천
      r(C.woodDark, 1, 1, 2, 14)
      r(C.woodDark, 13, 1, 2, 14)
      r(C.wood, 1, 1, 14, 2)
      for (let i = 0; i < 5; i++) r(['#c89097', '#93afc8', '#c3ae7b', '#a59bbf', '#9dbb94'][(x + i) % 5], 3 + i * 2, 3, 2, 9)
      r(C.wood, 2, 12, 12, 2)
      break
    case 'e': {
      // 깔개 (밟고 다닌다): 이어진 깔개 칸끼리는 테두리 없이 한 장으로
      const rugAt = (dx: number, dy: number) => tileAt(x + dx, y + dy) === 'e'
      const t = rugAt(0, -1) ? 0 : 2
      const b = rugAt(0, 1) ? 16 : 14
      const l = rugAt(-1, 0) ? 0 : 2
      const rr = rugAt(1, 0) ? 16 : 14
      r('#b86e52', l, t, rr - l, b - t)
      r('#c98f6a', l + (l ? 2 : 0), t + (t ? 2 : 0), rr - l - (l ? 2 : 0) - (rr < 16 ? 2 : 0), b - t - (t ? 2 : 0) - (b < 16 ? 2 : 0))
      // 가운데 크림 무늬 (칸마다 같은 자리에 — 이어 붙이면 줄무늬가 된다)
      r('#f3dbb0', 7, 4, 2, 2)
      r('#f3dbb0', 7, 10, 2, 2)
      break
    }
    case 'E':
      // 문깔개: 밟으면 밖으로
      r(C.wall, 0, 0, 16, 16)
      r(C.woodDark, 2, 0, 12, 16)
      r(C.wood, 3, 1, 10, 15)
      r('#e7d8b8', 4, 3, 8, 4)
      r('#a88a80', 3, 12, 10, 3)
      break
    case 'u':
      // 나루에 매어 둔 고깃배
      r(C.water2, 0, 12, 16, 2)
      r(C.woodDark, 1, 5, 14, 7)
      r(C.wood, 2, 5, 12, 4)
      r(C.woodDark, 7, 0, 1, 6)
      r('#f1e6cf', 8, 0, 5, 4)
      break
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
    case 'D': {
      const h = houseAt(x, y)
      if (h) houseWallTile(g, x, y, ch, h.id, h)
      else if (y === HOME_RECT.y1) houseWallTile(g, x, y, ch, 'home', HOME_FRONT)
      else r(C.door, 0, 0, 16, 3)
      break
    }
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
      // 올리브나무: 은빛 도는 작은 둥근 나무
      r('rgba(90,80,50,0.18)', 4, 13, 8, 2)
      r(C.trunk, 7, 10, 2, 5)
      r(C.olive2, 3, 3, 10, 7)
      r(C.olive, 4, 2, 8, 6)
      r(C.olive, 3, 4, 10, 3)
      r('#b5c7a2', 5, 3, 3, 2)
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
      r(x < 16 ? '#cfbf89' : '#6b4079', 3, 8, 3, 2)
      r(x < 16 ? '#f1e6cf' : '#7a9c5b', 9, 8, 3, 2)
      break
    case 'q':
      // 문 앞 편지 바구니
      r(C.shadow, 3, 12, 10, 3)
      r(C.woodDark, 3, 7, 10, 7)
      r(C.wood, 4, 8, 8, 5)
      r('#f6f1e6', 5, 5, 6, 4)
      break
    case 'l':
      // 텃밭 흙두둑
      r('#8a6a4a', 1, 3, 14, 12)
      r('#735538', 1, 6, 14, 1)
      r('#735538', 1, 10, 14, 1)
      break
    case 'x':
      r(C.fence, 0, 5, 16, 2)
      r(C.fence, 0, 10, 16, 2)
      r(C.woodDark, 2, 3, 2, 11)
      r(C.woodDark, 12, 3, 2, 11)
      break
    case 'y': {
      const col = season === 'summer' ? ['#c7b379', '#b09863'] : season === 'spring' ? ['#8eaf6a', '#769955'] : season === 'autumn' ? ['#ab9567', '#927d52'] : ['#9a8a6a', '#86765a']
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

/** 길을 막은 덤불 한 칸 */
function drawBush(g: Ctx, x: number, y: number, season: Season) {
  const px = x * TILE
  const py = y * TILE
  const dark = season === 'winter' ? '#8f9c86' : C.leaf2
  const mid = season === 'autumn' ? '#b8a468' : season === 'winter' ? '#a6b19c' : C.leaf
  const light = season === 'winter' ? '#c2cab8' : C.leaf3
  g.fillStyle = dark
  g.fillRect(px, py + 2, TILE, TILE - 2)
  for (let i = 0; i < 5; i++) {
    const bx = px + Math.floor(hash(x, y, i + 20) * 11)
    const by = py + Math.floor(hash(x, y, i + 30) * 9)
    g.fillStyle = mid
    g.fillRect(bx, by, 6, 5)
    g.fillStyle = light
    g.fillRect(bx + 1, by, 3, 2)
  }
  // 가끔 작은 열매
  if (hash(x, y, 40) < 0.3) {
    g.fillStyle = '#b98a8a'
    g.fillRect(px + 4 + Math.floor(hash(x, y, 41) * 8), py + 6 + Math.floor(hash(x, y, 42) * 6), 2, 2)
  }
}

/** 두 색을 섞는다 (t = 0 → a, 1 → b) */
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/**
 * 네모난 기와지붕 하나 (칸 tx0..tx1, ty0..ty1): 용마루, 양옆 테두리, 처마, 옅은 기와 띠.
 * 화면이 정수배가 아닌 크기로 늘어나도 일렁이지 않게 선은 모두 2픽셀 이상.
 */
function drawRoof(g: Ctx, tx0: number, ty0: number, tx1: number, ty1: number, [c1, c2, c3]: [string, string, string], chimney = true) {
  const ox = tx0 * TILE
  const oy = ty0 * TILE
  const W = (tx1 - tx0 + 1) * TILE
  const H = (ty1 - ty0 + 1) * TILE
  const r = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(ox + x, oy + y, w, h)
  }
  r(c1, 0, 0, W, H)
  const band = mix(c1, c2, 0.25)
  for (let y = 8; y < H - 4; y += 8) r(band, 0, y, W, 2) // 기와 띠
  r(c2, 0, 0, W, 4) // 용마루
  r(c3, 0, 0, W, 2)
  r(c2, 0, 0, 2, H) // 양옆 테두리
  r(c2, W - 2, 0, 2, H)
  r(c2, 0, H - 4, W, 4) // 처마
  r(mix(c2, '#000000', 0.15), 0, H - 2, W, 2)
  if (chimney) {
    const cx = Math.floor(W * 0.72)
    r('#c9a079', cx, -6, 8, 12)
    r('#82684f', cx - 2, -8, 12, 2)
    r(mix('#c9a079', '#82684f', 0.4), cx + 6, -6, 2, 12)
  }
}

/** 내 집 지붕: 밖에서는 이웃집처럼 지붕이 덮이고, 들어가면 벗겨져 안이 보인다 */
function drawHomeRoof(g: Ctx) {
  const { x0, y0, x1, y1 } = HOME_RECT
  drawRoof(g, x0, y0, x1, y1 - 1, HOUSE_STYLES.home.roof)
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
  // 집마다 지붕 하나
  for (const h of HOUSES) drawRoof(g, h.x0, h.y0, h.x1, h.y1 - 2, (HOUSE_STYLES[h.id] ?? PLAIN_STYLE).roof)
  // 집 안 가구: 바닥 것 → 큰 것 → 탁자 위 작은 것
  const layerRank = { floor: 0, solid: 1, small: 2 } as const
  for (const rm of ROOMS)
    for (const [dx, dy, item, flip] of [...rm.decor].sort((p, q) => layerRank[FURNITURE_DEFS[p[2]]?.layer ?? 'small'] - layerRank[FURNITURE_DEFS[q[2]]?.layer ?? 'small'])) {
      const a = FURNITURE_ART[item]
      if (!a) continue
      const x = rm.x0 + dx
      const y = rm.y0 + dy
      const rows = flip ? mirror(a.rows) : a.rows
      g.drawImage(paint(`furni/${item}/${flip ?? ''}`, rows, FURNI_PALETTE), x * TILE, y * TILE + (MAP[y][x] === 'n' ? -6 : 0))
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
        f(2, 2, 2, 1, '#be6e7c')
        f(6, 2, 2, 1, '#be6e7c')
        f(1, 3, 8, 2, '#be6e7c')
        f(2, 5, 6, 1, '#be6e7c')
        f(4, 6, 2, 1, '#be6e7c')
        break
      case 'sweat':
        f(5, 1, 1, 1, '#729dc0')
        f(4, 2, 3, 3, '#729dc0')
        f(5, 5, 1, 1, '#729dc0')
        break
      case 'hungry':
        f(2, 4, 6, 3, '#94704f')
        f(3, 3, 4, 1, '#cfbf89')
        break
      case 'shiver':
        f(1, 2, 1, 4, '#7da0c2')
        f(8, 2, 1, 4, '#7da0c2')
        f(4, 3, 2, 2, '#7da0c2')
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

function person(
  who: Who,
  facing: Facing,
  frame: 0 | 1,
  blink: boolean,
  pose: Pose,
  season: Season,
  extra: { inky?: boolean; growth?: number; look?: Look; avatar?: FullAvatar } = {},
) {
  const rows = spriteRows(who, facing, { frame, blink, pose, season, ...extra })
  const pal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  return paint(
    `${who}/${facing}/${frame}/${blink}/${pose}/${who === 'writer' ? season : ''}/${extra.inky ?? ''}/${extra.growth ?? ''}/${extra.look ?? ''}/${extra.avatar ? avatarKey(extra.avatar) : ''}`,
    rows,
    pal,
  )
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
      r('#81483d', 1, 2, 46, 28)
      r('#9f6154', 3, 4, 42, 24)
      r('#cfbf89', 6, 7, 36, 18)
      r('#9f6154', 9, 10, 30, 12)
      for (let i = 0; i < 5; i++) r('#cfbf89', 12 + i * 6, 15, 3, 3)
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
      r('#ae8a67', 1, 4, 30, 1)
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
      const a = FURNITURE_ART[f.item]
      if (a) {
        // 가구 그림 (탁자 위에 올린 작은 것은 조금 위로)
        g.drawImage(paint(`furni/${f.item}`, a.rows, FURNI_PALETTE), px, py + (f.on ? -6 : 0))
        return
      }
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
      g.fillStyle = i % 2 ? '#7ca260' : '#b09863'
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
  const cols = ['#d08282', '#cba271', '#d8c587', '#82ba77', '#80a2ca', '#907ac0']
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
        g.fillRect(0, 0, WIDTH * TILE, VILLAGE_H * TILE)
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
        g.fillRect(12 * TILE, 25 * TILE, 8 * TILE, 6 * TILE)
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

      // 서고 안 복음서 선반: 네 칸, 꽂은 책은 책등 색과 등급 띠(맨 책·은박·금박)
      if (roomAt(here)?.owner === 'library') {
        const [first] = PLACES.library.tiles
        const SPINE: Record<string, string> = { mt: '#8a6a6a', mk: '#6a7a8a', lk: '#7a8a6a', jn: '#8a7a5a' }
        const BAND = ['#c9b89a', '#c7ccd4', '#d9b44a']
        ;(['mt', 'mk', 'lk', 'jn'] as const).forEach((b, i) => {
          const sx = first.x * TILE + 4 + i * 11
          const sy = first.y * TILE + 2
          const grade = game.shelved[b]
          if (grade === undefined) {
            g.fillStyle = 'rgba(40,25,15,0.35)'
            g.fillRect(sx, sy + 1, 8, 9)
            return
          }
          g.fillStyle = SPINE[b]
          g.fillRect(sx, sy, 8, 10)
          g.fillStyle = BAND[grade]
          g.fillRect(sx, sy + 2, 8, 2)
          g.fillRect(sx, sy + 7, 8, 1)
        })
      }

      // 마음이 쌓여 마을에 생긴 것들
      drawDecor(g, game, weather, t, phase === 'morning' || phase === 'day')
      // 아직 열리지 않은 구역: 땅을 덮은 덤불 (물·집은 그대로 보인다)
      for (const z of lockedZones(shelvedCount(game)))
        for (let y = z.y0; y <= z.y1; y++)
          for (let x = z.x0; x <= z.x1; x++) if (!'~=uR#DS'.includes(tileAt(x, y))) drawBush(g, x, y, season)

      type Item = { y: number; paint: () => void }
      const items: Item[] = []

      // 양 우리의 양 (우리를 넓히면 둘 더)
      ;[
        [4, 27],
        [6, 28],
        [5, 26.5],
        [4, 28.5],
        [6.5, 26.5],
      ].slice(0, sheepCount(game)).forEach(([sx, sy], i) => {
        const x = sx + Math.sin(t * 0.3 + i * 2) * 0.6
        const y = sy + Math.cos(t * 0.23 + i) * 0.5
        items.push({ y, paint: () => drawSprite(g, paint(`sheep/${Math.sin(t * 0.3 + i * 2) > 0 ? 'r' : 'l'}`, Math.sin(t * 0.3 + i * 2) > 0 ? SHEEP : SHEEP.map((r) => [...r].reverse().join('')), SMALL_PALETTE), x, y) })
      })

      // 이웃
      for (const def of content.neighbors) {
        const n = game.npcs[def.id]
        if (!n?.visible) {
          // 집에 들어간 이웃: 내가 그 집 안에 있으면 방 안 자리에 서 있다 (밤 열 시 이후엔 잔다)
          const home = ROOMS.find((rm) => rm.owner === def.id)
          const movedIn = !def.joinsAt || (game.flags.villageLevel ?? 0) >= def.joinsAt
          if (n && home && movedIn && roomAt(here) === home && minute >= 5 * 60 && minute < 22 * 60) {
            const growth = def.id === 'child' ? childGrowth(day) : undefined
            items.push({
              y: home.sit.y,
              paint: () => drawSprite(g, person(def.sprite as Who, 'down', 0, isBlinking(t + def.id.length), 'stand', season, { growth }), home.sit.x, home.sit.y, breathOffset(t + def.id.length)),
            })
          }
          continue
        }
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
          const spr = person('writer', facing, frame, blink, pose, season, { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined })
          drawSprite(g, spr, p.x, p.y, lift)
          const top = Math.round(p.y * TILE) + TILE - spr.height - 2
          const cx = Math.round(p.x * TILE) + 8
          if (kind === 'doze') emote(g, 'z', cx, top)
          else if (kind === 'hum') emote(g, 'note', cx, top - Math.round(Math.sin(t * 4)))
          else if (kind === 'yawn') emote(g, 'yawn', cx, top)
          else if (pose === 'crouch') emote(g, 'heart', cx, top)
          else if (!moving && game.needs.hunger >= 70 && t % 9 < 1.6) emote(g, 'hungry', cx, top)
          else if (!moving && game.needs.cold >= 60 && t % 6 < 1.4) emote(g, 'shiver', cx, top)
          else if (!moving && game.needs.heat >= 60 && t % 8 < 1.4) emote(g, 'sweat', cx, top)
          // 겨울 바깥의 입김
          if (outdoors && season === 'winter' && t % 2.4 < 0.8) {
            g.fillStyle = 'rgba(255,255,255,0.7)'
            const k = (t % 2.4) / 0.8
            g.fillRect(cx + (facing === 'left' ? -6 : 4) - Math.round(k * 2), top + 12 - Math.round(k * 3), 2 + Math.round(k), 2)
          }
        },
      })

      // 나비
      for (const b of flies) items.push({ y: b.y + 0.5, paint: () => g.drawImage(paint(`bf/${b.frame}/${b.hue}`, BUTTERFLY[b.frame], { ...SMALL_PALETTE, o: b.hue ? '#98b8d7' : '#d0977c', O: b.hue ? '#7696b8' : '#d8c587' }), Math.round(b.x * TILE), Math.round(b.y * TILE)) })

      items.sort((a, b) => a.y - b.y).forEach((i) => i.paint())
      // 내 집은 밖에 있을 때 지붕을 덮는다 (사람·동물을 그린 뒤)
      if (!isHome(here)) drawHomeRoof(g)
      const room = viewRoomAt(here)
      if (room) {
        const rx = room.x0 * TILE
        const ry = room.y0 * TILE
        const rw = room.w * TILE
        const rh = room.h * TILE
        g.fillStyle = '#1c1510'
        g.fillRect(ox - TILE, oy - TILE, W + 2 * TILE, ry - oy + TILE)
        g.fillRect(ox - TILE, ry + rh, W + 2 * TILE, oy + H - ry - rh + TILE)
        g.fillRect(ox - TILE, ry, rx - ox + TILE, rh)
        g.fillRect(rx + rw, ry, ox + W - rx - rw + TILE, rh)
      }
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
          for (const [x, y] of [[5, 17], [36, 17], [35, 5], [28, 28], [42, 31], [24, 5]]) glow(g, sx(x * TILE + 8), sy(y * TILE + 4), 14, dark * 0.5)
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
