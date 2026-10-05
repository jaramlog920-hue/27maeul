import { FIXTURES } from '../engine/home-layout'
import { SPOUSE_FURNITURE } from '../engine/furniture-defs'
// 캔버스 그리기. 엔진 상태를 읽기만 하고 바꾸지 않는다.
import { barleyRipe, chimneySmoke, festivalOf, FESTIVAL_FROM, FESTIVAL_TO, grapesRipe, icyMorning, isWet, puddlesOut, weatherOf } from '../engine/calendar'
import { darkness, phaseOf, seasonOf } from '../engine/clock'
import { isGrown, STRAY_SPOTS, EAVES } from '../engine/companion'
import { totalChapters } from '../engine/books'
import { shelfRoom } from '../engine/shelf-rooms'
import { letterWaiting } from '../engine/requests'
import { childTile, childAtSchool, closedHouseIds, mailboxHasPost, storyWaiting, routineOf, SCHOOL_SEAT, shelvedCount, straysToday, weddingToday, type ActKind, type GameState, type PlayerAct } from '../engine/game'
import { furnitureUseFrame, USE_INFO, USE_PROP_PALETTE, USE_SIZE, type UseAction } from './furniture-use-motion'
import { extraUseFrame, petMotionRows, type ExtraAction } from './expansion-life-motion'
import { weddingActorFrame, type WeddingAction } from './wedding-art'
import { eventMotionFrame, type EventAction } from './event-life-motion'
import { drawEventProp, eventPropSortY } from './event-props'
import { eventPropsNow, npcEventMotion, playerEventMotion, weddingEvening, type EventMotion } from '../engine/event-scene'
import type { Activity } from '../engine/people'
import { deskTraces, type DeskTraces } from '../engine/desk-traces'
import { facingOf, FURNITURE_DEFS, type Furniture } from '../engine/room'
import { FURNI_PALETTE, FURNITURE_ART, STYLE_PALETTES } from './furniture-art'
import { SPOUSE_ROOM_ART, SPOUSE_ROOM_VIEWS } from './spouse-room-art'
import { HOME_SPACE_DIRECTIONS } from './home-space-directions'
import { currentSpouseRoom, SPOUSE_ROOM } from '../engine/spouse-room'
import { facingArt } from './furniture-facing'
import { HOME_FIXTURE_ART } from './home-space-art'
import { REMAINING_FIXTURE_ART } from './remaining-furniture-art'
import { EXPANSION_PROPS, EXPANSION_VIEWS } from './expansion-prop-art'
import { drawStall, drawStoryProps, drawVillage, registerStoryPropArt } from './story-props'
import { LIFE_GAP_PROPS, LIFE_GAP_STRUCTURES } from './life-gap-art'
import { drawDecor, lanternLights, sheepCount } from './decor'
import { FIRE, isNear, npcTile } from '../engine/neighbors'
import { babyStage, childGrowth, rainbowVisible } from '../engine/stories'
import { childMode, childStage } from '../engine/child'
import { BOARD, stoneTile, TRIP_H, TRIP_W, tripLayout, type Cell as TripCell } from '../engine/trip-board'
import { actsDoorGlows, feastToday, sideShelfSpines } from '../engine/library'
import { spineLook } from '../engine/binding'
import { ACTS_ROOM, HEB_JUD_ROOM, REV_ROOM, isRightWallDoor, LETTERS_ROOM, openDoors, cameraFor, currentHomeLevel, PAVILION_RECT, HEIGHT, HOUSE_RECT, housesNow, houseAt, LOCKED_DOORS, lockedTiles, lockedZones, tileAt, isIndoor, MAP, PLACES, ROOMS, roomAt, SIDE_DOOR, viewRoomAt, TILE, VIEW_H, VIEW_W, VILLAGE_H, WIDTH, sameTile, treeKind, type TreeKind } from '../engine/world'
import { GOSPELS, type Book, type Facing, type NeighborDef, type GameContent, type Season, type Tile } from '../engine/types'
import { breathOffset, dozeNod, isBlinking, lookSide, walkFrame } from './anim'
import { avatarKey, withLookDefaults, type Avatar, type FullAvatar } from '../engine/avatar'
import {
  animalRows,
  ANIMAL_PALETTE,
  BABY,
  BUTTERFLY,
  ICON_PALETTE,
  ICONS,
  mirror,
  recolor,
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

// 생활 확장 도트를 이야기 뒤 소품 그림으로 한 번 등록한다
registerStoryPropArt({ ...EXPANSION_PROPS, ...LIFE_GAP_PROPS }, { ...EXPANSION_VIEWS, ...LIFE_GAP_STRUCTURES })

const C = {
  // 참고 그림(2026-09-30 사용자)에 맞춘 밝고 선명한 색: 연두 풀밭, 모래빛 흙길, 맑은 하늘빛 호수, 또렷한 지붕
  // 풀은 부드러운 세이지·연두 (2026-10-04 사용자)
  grass: '#b0cc94',
  grass2: '#a6c48a',
  grass3: '#b8d29e',
  worn: '#c9c27a',
  worn2: '#d8bd84',
  path: '#ecd0a0',
  path2: '#e0c898',
  floor: '#e9c48f',
  floor2: '#d6ad76',
  wall: '#f4e0c0',
  wallTop: '#f8e8cc',
  wallDark: '#e8d0a8',
  leaf: '#509048',
  leaf2: '#408040',
  leaf3: '#74ac5c',
  trunk: '#906038',
  stone: '#bdb7ab',
  stoneDark: '#8f887c',
  water: '#60b8c4',
  water2: '#98d8e0',
  wood: '#a87850',
  woodDark: '#845038',
  blanket: '#e27d86',
  blanketDark: '#c25e6a',
  pillow: '#fff5e4',
  paper: '#fbeecb',
  lamp: '#ffd24a',
  door: '#906040',
  shadow: 'rgba(60,40,10,0.2)',
  fire: '#ff8c32',
  fire2: '#ffd873',
  reed: '#74ac5c',
  reed2: '#509048',
  olive: '#74ac5c',
  olive2: '#509048',
  vine: '#549044',
  grapes: '#7b3f96',
  fence: '#845038',
  awning: '#e2574c',
  awning2: '#fffdf6',
  flower: ['#ff9aa8', '#ffe070', '#ffffff', '#f7b5d8'],
}

const SEASON_GRASS: Record<Season, [string, string, string]> = {
  // 봄 풀빛은 참고 그림(2026-09-30 사용자)에서 뽑은 그대로
  // 봄·여름 풀은 부드러운 세이지·연두 (2026-10-04 사용자 — 참고 그림보다 한 톤 차분하게)
  spring: ['#b0cc94', '#a6c48a', '#b8d29e'],
  summer: ['#a8c48c', '#9ebc82', '#b0cc94'],
  autumn: ['#c8c88c', '#bcbc80', '#d4d49c'],
  winter: ['#dfe8dc', '#cfdacb', '#eef3ec'],
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
  // 지붕·벽·문·창틀 색은 참고 그림(2026-09-30 사용자)에서 뽑은 그대로 — 새 색 조합을 만들지 않는다
  home: { roof: ['#c07058', '#a86048', '#cc8468'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040' },
  library: { roof: ['#58984c', '#488040', '#6cac5c'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  baker: { roof: ['#a06450', '#885444', '#b07864'], pattern: 'tile', wall: '#f8c094', base: '#eeb080', window: 'square', shutter: '#ac7444', door: '#906040', awning: ['#c07058', '#f8e8cc'] },
  child: { roof: ['#58984c', '#488040', '#6cac5c'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  grandpa: { roof: ['#a06450', '#885444', '#b07864'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  weaver: { roof: ['#bc6c54', '#a45a44', '#cc8068'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  beekeeper: { roof: ['#c8a04c', '#ac883c', '#d4b060'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  postman: { roof: ['#4898a4', '#3c808c', '#5cacb8'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040' },
  apothecary: { roof: ['#b05860', '#944850', '#c06c74'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040', awning: ['#58984c', '#f8e8cc'] },
  fisher: { roof: ['#4898a4', '#3c808c', '#5cacb8'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  carpenter: { roof: ['#c8a04c', '#ac883c', '#d4b060'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  hall: { roof: ['#4880b4', '#3c6c9c', '#5c94c4'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  tripA: { roof: ['#4880b4', '#3c6c9c', '#5c94c4'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040' },
  tripB: { roof: ['#c07058', '#a86048', '#cc8468'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040', awning: ['#c07058', '#f8e8cc'] },
  tripC: { roof: ['#4898a4', '#3c808c', '#5cacb8'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  tripD: { roof: ['#a06450', '#885444', '#b07864'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'square', shutter: '#ac7444', door: '#906040', timber: '#ac7444' },
  tripE: { roof: ['#c8a04c', '#ac883c', '#d4b060'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040' },
  tripF: { roof: ['#58984c', '#488040', '#6cac5c'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'arch', shutter: '#ac7444', door: '#906040' },
  teahouse: { roof: ['#cc70a0', '#b05c88', '#d888b4'], pattern: 'tile', wall: '#f4e0c0', base: '#f0d8b0', window: 'round', shutter: '#ac7444', door: '#906040', awning: ['#cc70a0', '#f8e8cc'] },
}
const PLAIN_STYLE = HOUSE_STYLES.child
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
  // 넓힌 내 집은 본채(5칸) 창을 그대로 두고, 왼쪽에 붙인 두 칸에 창을 따로 단다
  const main = id === 'home' ? { ...h, x0: HOUSE_RECT.x0 } : h
  const k = main.x1 - main.x0 + 1 >= 7 ? 2 : 1
  const winCol = x >= main.x0 && Math.abs(x - main.doorX) === k
  const glass = '#ffca70'
  const glow = '#ffeaba'
  const frame = '#c59a61'
  const tileRect = r
  /** 창 하나 (ox: 칸 안에서 옆으로 옮기기 — 두 칸 사이에 걸친 창) */
  const window = (dy: number, ox = 0) => {
    const r = (color: string, dx: number, yy: number, w: number, hh: number) => tileRect(color, dx + ox, yy, w, hh)
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
        r('#c59a61', left ? 6 : 0, 4, 10, 12)
        r('#c59a61', left ? 7 : 0, 3, left ? 9 : 9, 1)
        r('#ffca70', wx, 6, 8, 10)
        r('#c59a61', left ? 14 : 0, 6, 2, 10)
      } else {
        r('#c59a61', left ? 6 : 0, 0, 10, 10)
        r('#ffca70', wx, 0, 8, 8)
        r('#c59a61', left ? 14 : 0, 0, 2, 8)
        r('#c59a61', wx, 4, 8, 1)
        r('#f5e0af', left ? 6 : 0, 9, 10, 2)
      }
    }
    // 위 줄(2층 높이)에는 아무것도 달지 않는다 — 창은 아래 줄에만
  } else if (!upper && winCol) {
    window(1)
    r('#c68b54', 3, 10, 10, 2) // 꽃 상자
    for (let i = 0; i < 4; i++) r(['#ffc2a0', '#fefdf8', '#feae88', '#a2cb78'][(x + i) % 4], 4 + i * 2, 9, 2, 1)
  }
  if (door && !upper) {
    // 둥근 나무 문과 놋쇠 손잡이
    const dc = ch === 'L' ? '#a96f3f' : st.door
    r(frame, 2, 1, 12, 15)
    r(dc, 3, 2, 10, 14)
    r(dc, 4, 1, 8, 1)
    r(mix(dc, '#000000', 0.18), 6, 3, 1, 13)
    r(mix(dc, '#000000', 0.18), 9, 3, 1, 13)
    r('#ffca70', 10, 9, 2, 2)
  }
  if (id === 'home' && h.x0 < HOUSE_RECT.x0) {
    // 넓힌 집(1단계): 왼쪽에 붙인 두 칸 — 이어 붙인 자리에 기둥, 두 칸 가운데에 창 하나 (본채 창은 문을 가운데 둔 대칭 그대로)
    if (x === HOUSE_RECT.x0) r(st.base, 0, 0, 2, 16)
    if (!upper && x === HOUSE_RECT.x0 - 1) {
      // 오른쪽 칸을 그릴 때 왼쪽 칸에 반쯤 걸쳐 그린다 (왼쪽 칸은 이미 그려져 있다)
      window(1, -8)
      r('#c68b54', -5, 10, 10, 2) // 꽃 상자
      for (let i = 0; i < 4; i++) r(['#ffc2a0', '#fefdf8', '#feae88', '#a2cb78'][(x + i) % 4], -4 + i * 2, 9, 2, 1)
    }
  }
  if (st.awning && !st.timber && !upper && Math.abs(x - h.doorX) <= 1) {
    // 문 위 줄무늬 차양 — 나무 줄(timber)이 있는 집에는 달지 않는다
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

function drawGround(g: Ctx, ch: string, x: number, y: number, season: Season, at: (x: number, y: number) => string = tileAt) {
  const px = x * TILE
  const py = y * TILE
  const [g1, g2, g3] = SEASON_GRASS[season]
  // 길 한가운데 놓인 벤치·우물은 풀 한 칸을 깔지 않고 길 바닥 그대로 (사용자, 2026-09-30)
  if ((ch === 'B' || ch === 'w') && [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].filter((c) => c === ',').length >= 3) ch = ','
  if (ch === '_') {
    g.fillStyle = '#15100c'
    g.fillRect(px, py, TILE, TILE)
    return
  }
  if ('fbdhskDH'.includes(ch) || (y >= VILLAGE_H && ch !== '#')) {
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
    // 풀밭이 흙길과 만나는 가장자리는 한 톤 짙게 (참고 그림처럼 풀밭 조각이 또렷하게)
    if (y < VILLAGE_H) {
      g.fillStyle = g2
      const isPath = (c: string) => c === ',' || c === 'm' || c === 'A' || c === 'P'
      if (isPath(at(x, y - 1))) g.fillRect(px, py, TILE, 2)
      if (isPath(at(x, y + 1))) g.fillRect(px, py + TILE - 2, TILE, 2)
      if (isPath(at(x - 1, y))) g.fillRect(px, py, 2, TILE)
      if (isPath(at(x + 1, y))) g.fillRect(px + TILE - 2, py, 2, TILE)
      // 계절 풀밭 (빈 풀 칸에만): 봄엔 들꽃이 늘고, 여름엔 키 큰 풀포기
      if (ch === '.' && season === 'spring' && hash(x, y, 71) < 0.12) {
        const fx = 3 + Math.floor(hash(x, y, 72) * 8)
        const fy = 3 + Math.floor(hash(x, y, 73) * 8)
        g.fillStyle = C.flower[Math.floor(hash(x, y, 74) * 4)]
        g.fillRect(px + fx, py + fy, 2, 2)
        g.fillStyle = C.flower[Math.floor(hash(x, y, 75) * 4)]
        g.fillRect(px + fx + 3, py + fy + 2, 2, 2)
      }
      if (ch === '.' && season === 'summer' && hash(x, y, 76) < 0.1) {
        const fx = 3 + Math.floor(hash(x, y, 77) * 8)
        const fy = 4 + Math.floor(hash(x, y, 78) * 5)
        g.fillStyle = '#86a868'
        g.fillRect(px + fx, py + fy + 1, 2, 6)
        g.fillRect(px + fx + 2, py + fy + 3, 2, 4)
        g.fillStyle = '#98b878'
        g.fillRect(px + fx - 2, py + fy + 3, 2, 4)
      }
    }
  }
}

/** 활엽수 잎빛: 봄은 바탕 그대로, 여름은 한 톤 짙게 [아랫잎, 바탕, 윗잎] */
const LEAVES: Record<'spring' | 'summer', [string, string, string]> = {
  spring: [C.leaf2, C.leaf, C.leaf3],
  summer: ['#3a7440', '#488444', '#669e56'],
}
/** 가을에 물든 잎 (노랑·붉은 두 가지 — 차분한 파스텔) */
const AUTUMN_LEAVES: [string, string, string][] = [
  ['#cf983a', '#e5ad55', '#f4c977'],
  ['#b8664c', '#cf8262', '#e6a283'],
]
/** 가을에 아직 물들지 않은 활엽수 — 여름보다 조금 바랜 초록 */
const AUTUMN_GREEN: [string, string, string] = ['#4c7e40', '#5e8c48', '#7da462']
/** 겨울 늘푸른나무 — 잎은 그대로, 빛만 조금 가라앉게 */
const EVERGREEN_WINTER: [string, string, string] = ['#3e7246', '#4e8050', '#6c9a66']

/**
 * 지도의 둥근 나무 한 그루 (계획 15): 나무 종류(world.treeKind)와 계절에 따라 —
 * 늘푸른나무는 한 해 내내 그대로, 활엽수·과일나무는 여름에 한 톤 짙고, 가을엔 일부만 노랑·붉게 물들어 밑에 낙엽 몇 장,
 * 겨울엔 잎 진 빈 가지. 과일나무는 봄에 흰·분홍 꽃. 선은 모두 2픽셀
 */
function drawTree(g: Ctx, x: number, y: number, season: Season, kind: TreeKind) {
  const px = x * TILE
  const py = y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  r('rgba(90,80,50,0.18)', 3, 13, 10, 2)
  if (kind !== 'evergreen' && season === 'winter') {
    // 잎 진 가지: 줄기에서 양옆으로 갈라진 2픽셀 가지
    const bark = '#8a6040'
    const twig = '#a27a58'
    r(bark, 7, 4, 2, 11)
    r(bark, 5, 8, 2, 2)
    r(bark, 3, 6, 2, 2)
    r(twig, 3, 4, 2, 2)
    r(bark, 9, 7, 2, 2)
    r(bark, 11, 5, 2, 2)
    r(twig, 11, 3, 2, 2)
    r(twig, 6, 2, 2, 2)
    r(twig, 9, 3, 2, 2)
    return
  }
  let [d, m, l] = kind === 'evergreen' ? (season === 'winter' ? EVERGREEN_WINTER : LEAVES.spring) : season === 'spring' ? LEAVES.spring : LEAVES.summer
  // 가을: 활엽수 절반쯤만 물든다 (자리마다 정해진 대로)
  const turned = season === 'autumn' && kind !== 'evergreen' && hash(x, y, 61) < 0.55
  if (season === 'autumn' && kind !== 'evergreen') [d, m, l] = turned ? AUTUMN_LEAVES[hash(x, y, 62) < 0.6 ? 0 : 1] : AUTUMN_GREEN
  r(C.trunk, 7, 10, 2, 5)
  r(d, 3, 3, 10, 8)
  r(d, 2, 5, 12, 5)
  r(d, 5, 1, 6, 11)
  r(m, 3, 2, 10, 7)
  r(m, 2, 4, 12, 4)
  r(m, 5, 1, 6, 9)
  r(l, 4, 2, 4, 3)
  r(l, 5, 1, 2, 1)
  if (turned) {
    // 나무 밑 낙엽 몇 장
    r(m, 2, 13, 2, 2)
    r(l, 11, 12, 2, 2)
    if (hash(x, y, 63) < 0.6) r(d, 5, 14, 2, 2)
  }
  if (kind === 'fruit' && season === 'spring') {
    // 흰·분홍 꽃 (짝지은 두 그루는 같은 색 — 광장 쌍은 분홍, 풀밭 쌍은 흰 꽃. 다른 색이 조금 섞인다)
    const pink = y % 2 === 0
    const main = pink ? '#f6c3d2' : '#fbf6ee'
    const other = pink ? '#fbf6ee' : '#f6c3d2'
    for (const [bx, by] of [[4, 3], [9, 2], [6, 6], [11, 6], [3, 7], [8, 9]]) r(main, bx, by, 2, 2)
    for (const [bx, by] of [[7, 1], [10, 9]]) r(other, bx, by, 2, 2)
  }
}

function drawObject(g: Ctx, ch: string, x: number, y: number, season: Season, tree: TreeKind = 'deciduous') {
  const px = x * TILE
  const py = y * TILE
  const fixture = HOME_FIXTURE_ART[ch] ?? REMAINING_FIXTURE_ART[ch]
  if (fixture) {
    g.drawImage(paint(`fixture/${ch}`, fixture.rows, FURNI_PALETTE), px, py)
    return
  }
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
      // 집 안 벽: 크림 회벽과 나무 들보.
      // 옆벽(위아래가 벽으로 이어진 칸)은 세로로 한 장처럼 — 칸마다 가로줄을 긋지 않고, 방 쪽 가장자리에만 밝은 선
      const wallAt = (xx: number, yy: number) => '#SNVFJKMCQY'.includes(tileAt(xx, yy))
      const vertical = wallAt(x, y - 1) && wallAt(x, y + 1) && !(wallAt(x - 1, y) && wallAt(x + 1, y))
      r(C.wall, 0, 0, 16, 16)
      if (vertical) {
        const inRight = !wallAt(x + 1, y) && tileAt(x + 1, y) !== '_'
        const inLeft = !wallAt(x - 1, y) && tileAt(x - 1, y) !== '_'
        if (inRight) r(C.wallTop, 14, 0, 2, 16)
        if (inLeft) r(C.wallTop, 0, 0, 2, 16)
        if (!inLeft) r(C.wallDark, 0, 0, 1, 16)
        if (!inRight) r(C.wallDark, 15, 0, 1, 16)
      } else {
        r(C.wallTop, 0, 0, 16, 2)
        r(C.wallDark, 0, 15, 16, 1)
      }
      break
    }
    case 'R':
      // 지붕은 집 하나를 통째로 나중에 그린다 (drawRoof)
      break
    case 'T':
      drawTree(g, x, y, season, tree)
      break
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
      r('#fac839', 0, 0, 16, 1)
      break
    case 'Q':
      // 한 권 선반 (사도행전 방·요한계시록 방): 복음서 선반과 같은 나무, 위 테는 방마다 —
      // 사도행전 방은 잿빛 파랑, 요한계시록 방은 옅은 라벤더 (꽂은 책은 그릴 때 얹는다)
      r(C.shadow, 0, 13, 16, 3)
      r(C.woodDark, 0, 0, 16, 14)
      r(C.wood, 1, 1, 14, 12)
      r(C.woodDark, 1, 11, 14, 2)
      r(roomAt({ x, y }) === REV_ROOM ? '#c0b5db' : '#84a0ba', 0, 0, 16, 2)
      break
    case 'M': {
      // 벽에 건 여정 판 (세 칸에 걸친 한 장): 나무 테두리와 옅은 양피지 바탕. 카드와 실은 그릴 때 얹는다
      const L = tileAt(x - 1, y) !== 'M'
      const R = tileAt(x + 1, y) !== 'M'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      r(C.woodDark, x0, 2, x1 - x0, 13)
      r('#fbedd1', x0 + (L ? 2 : 0), 4, x1 - x0 - (L ? 2 : 0) - (R ? 2 : 0), 9)
      break
    }
    case 'C': {
      // 벽에 건 일곱 교회 카드 판 (세 칸에 걸친 한 장): 여정 판과 같은 나무 테, 바탕은 옅은 잿빛 하늘색.
      // 카드 자리 일곱 칸(옅은 테)과 놓인 카드·실은 그릴 때 얹는다 (drawCardBoard)
      const L = tileAt(x - 1, y) !== 'C'
      const R = tileAt(x + 1, y) !== 'C'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      r(C.woodDark, x0, 2, x1 - x0, 13)
      r('#e9f1f5', x0 + (L ? 2 : 0), 4, x1 - x0 - (L ? 2 : 0) - (R ? 2 : 0), 9)
      break
    }
    case 'Y': {
      // 편지 방의 편지 선반 (세 칸이 한 선반): 옅은 잿빛 나무, 위 테는 방마다 — 로마서–빌레몬서 방은 연한 하늘색,
      // 히브리서–유다서 방은 연한 쑥색 (얇은 책등은 그릴 때 얹는다)
      const L = tileAt(x - 1, y) !== 'Y'
      const R = tileAt(x + 1, y) !== 'Y'
      r(C.shadow, 0, 13, 16, 3)
      r('#a08b70', 0, 0, 16, 14)
      r('#e5d6bc', L ? 2 : 0, 2, 16 - (L ? 2 : 0) - (R ? 2 : 0), 9)
      r('#a08b70', 0, 11, 16, 2)
      r(roomAt({ x, y }) === HEB_JUD_ROOM ? '#c2ddae' : '#add0e4', 0, 0, 16, 2)
      break
    }
    case 'V': {
      // 벽에 건 편지꽂이 (세 칸에 걸친 한 장): 옅은 잿빛 나무 칸칸이 접힌 크림색 편지. 막힌 칸, 누르는 곳이 아니다
      const L = tileAt(x - 1, y) !== 'V'
      const R = tileAt(x + 1, y) !== 'V'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      // 뒤판 (옅은 잿빛 나무, 테두리 2픽셀)
      r('#a08b70', x0, 3, x1 - x0, 12)
      r('#ddcab0', x0 + (L ? 2 : 0), 5, x1 - x0 - (L ? 2 : 0) - (R ? 2 : 0), 8)
      // 칸마다 접힌 편지 두 통이 주머니 위로 비죽 나와 있다 (칸 하나가 좌우 대칭 — 세 칸을 이어도 대칭)
      for (const lx of [4, 9]) {
        r('#fdf5e0', lx, 4, 3, 7)
        r('#dbeef7', lx, 4, 3, 2)
      }
      // 앞쪽 주머니 판: 윗단은 짙게
      r('#c7b49a', x0, 9, x1 - x0, 5)
      r('#a08b70', x0, 9, x1 - x0, 2)
      break
    }
    case 'F': {
      // 사랑방 벽의 의뢰 게시판 (두 칸에 걸친 한 장): 나무 판에 핀으로 꽂은 쪽지 둘씩
      const L = tileAt(x - 1, y) !== 'F'
      const R = tileAt(x + 1, y) !== 'F'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      const x0 = L ? 2 : 0
      const x1 = R ? 14 : 16
      r('#a5713d', x0, 3, x1 - x0, 11)
      r('#ce9759', x0 + (L ? 1 : 0), 4, x1 - x0 - (L ? 1 : 0) - (R ? 1 : 0), 9)
      for (const [nx, ny, h] of L ? [[4, 5, 6], [9, 6, 5]] : [[2, 6, 5], [7, 5, 6]]) {
        r('#fdf5e0', nx, ny, 4, h)
        r('#ddcab0', nx + 1, ny + 2, 2, 1)
        r('#ddcab0', nx + 1, ny + 4, 2, 1)
        r('#e35427', nx + 1, ny, 1, 1)
      }
      break
    }
    case 'N':
      // 방 벽의 창 (한 칸, 창 자체도 좌우 대칭): 잿빛 나무 창틀, 연한 하늘빛 유리, 가운데 창살
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      r('#b8a488', 3, 3, 10, 11)
      r('#dbeef7', 5, 5, 6, 7)
      r('#ebf5fa', 5, 5, 6, 2)
      r('#b8a488', 7, 5, 2, 7)
      r('#b8a488', 5, 8, 6, 2)
      r('#dacab3', 2, 13, 12, 2)
      break
    case 'J': {
      // 열린 서고 방 문: 문설주, 안쪽 방의 따뜻한 빛, 열어 둔 문짝.
      // 왼쪽 벽 문(사도행전 방·로마서–빌레몬서 방)은 문짝이 오른쪽, 오른쪽 벽 문(히브리서–유다서 방)은 좌우를 뒤집어 왼쪽
      // (문설주·불빛은 가운데 대칭이라 그대로)
      const leaf = isRightWallDoor(x, y) ? 2 : 10
      r(C.wall, 0, 0, 16, 16)
      r('#c59a61', 2, 1, 12, 15)
      r('#ffe4a9', 4, 3, 8, 13)
      r('#fff0d0', 4, 12, 8, 4)
      r(C.woodDark, leaf, 3, 4, 13)
      r(C.wood, leaf + 1, 4, 2, 12)
      break
    }
    case 'K':
      // 잠긴 방 문: 벽에 난 나무문과 자물쇠
      r(C.wall, 0, 0, 16, 16)
      r('#c59a61', 2, 1, 12, 15)
      r(C.woodDark, 3, 2, 10, 14)
      r(C.wood, 4, 3, 8, 13)
      r(C.woodDark, 8, 3, 1, 13)
      r('#8a8478', 6, 8, 4, 4)
      r('#c1b8a6', 7, 9, 2, 2)
      break
    case 'n':
      // 탁자와 식탁보
      r(C.shadow, 1, 12, 15, 3)
      r(C.woodDark, 2, 10, 2, 5)
      r(C.woodDark, 12, 10, 2, 5)
      r(C.wood, 1, 4, 14, 7)
      r('#f9efe1', 2, 4, 12, 4)
      for (let i = 0; i < 6; i++) r('#cc8989', 2 + i * 2, 7, 1, 1)
      break
    case 'g':
      // 항아리
      r(C.shadow, 3, 13, 10, 3)
      r('#d6ac89', 4, 5, 8, 9)
      r('#bd916b', 3, 7, 10, 5)
      r('#ebd0b5', 5, 6, 2, 3)
      r('#966847', 5, 3, 6, 2)
      break
    case 'p':
      // 꽃 화분
      r(C.shadow, 3, 13, 10, 3)
      r('#cc8e79', 4, 9, 8, 5)
      r('#b1705d', 4, 9, 8, 1)
      r('#81ae75', 7, 4, 2, 5)
      r('#81ae75', 4, 5, 3, 2)
      r('#81ae75', 9, 5, 3, 2)
      r('#f2aab5', 6, 1, 4, 3)
      r('#eed998', 7, 2, 2, 1)
      break
    case 'W':
      // 베틀과 짜다 만 천
      r(C.woodDark, 1, 1, 2, 14)
      r(C.woodDark, 13, 1, 2, 14)
      r(C.wood, 1, 1, 14, 2)
      for (let i = 0; i < 5; i++) r(['#db9099', '#93b9db', '#d9bc77', '#ab9dd0', '#a2cc95'][(x + i) % 5], 3 + i * 2, 3, 2, 9)
      r(C.wood, 2, 12, 12, 2)
      break
    case 'e': {
      // 깔개 (밟고 다닌다): 이어진 깔개 칸끼리는 테두리 없이 한 장으로
      const rugAt = (dx: number, dy: number) => tileAt(x + dx, y + dy) === 'e'
      const t = rugAt(0, -1) ? 0 : 2
      const b = rugAt(0, 1) ? 16 : 14
      const l = rugAt(-1, 0) ? 0 : 2
      const rr = rugAt(1, 0) ? 16 : 14
      r('#d46d46', l, t, rr - l, b - t)
      r('#e39462', l + (l ? 2 : 0), t + (t ? 2 : 0), rr - l - (l ? 2 : 0) - (rr < 16 ? 2 : 0), b - t - (t ? 2 : 0) - (b < 16 ? 2 : 0))
      // 가운데 크림 무늬 (칸마다 같은 자리에 — 이어 붙이면 줄무늬가 된다)
      r('#ffe6ba', 7, 4, 2, 2)
      r('#ffe6ba', 7, 10, 2, 2)
      break
    }
    case 'E':
      // 문깔개: 밟으면 밖으로
      r(C.wall, 0, 0, 16, 16)
      r(C.woodDark, 2, 0, 12, 16)
      r(C.wood, 3, 1, 10, 15)
      r('#f5e4bf', 4, 3, 8, 4)
      r('#ba8e7f', 3, 12, 10, 3)
      break
    case 'u':
      // 나루에 매어 둔 고깃배
      r(C.water2, 0, 12, 16, 2)
      r(C.woodDark, 1, 5, 14, 7)
      r(C.wood, 2, 5, 12, 4)
      r(C.woodDark, 7, 0, 1, 6)
      r('#fbf1dc', 8, 0, 5, 4)
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
      r('#342118', 4, 9, 8, 5)
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
      r('#2f213a', 10, 6, 3, 3)
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
      else if (sameTile({ x, y }, SIDE_DOOR)) {
        // 작업실과 새 방 사이 벽에 낸 문: 트인 바닥, 위아래 벽에 닿는 나무 문설주
        r(C.woodDark, 0, 0, 16, 3)
        r(C.woodDark, 0, 13, 16, 3)
      } else r(C.door, 0, 0, 16, 3)
      break
    }
    case 'H':
      // 다락으로 오르는 사다리: 벽에 기댄 두 기둥과 가로대, 위로 난 어두운 구멍
      r('#8f684a', 2, 0, 12, 3)
      r(C.shadow, 3, 13, 11, 3)
      r(C.woodDark, 3, 0, 2, 15)
      r(C.woodDark, 11, 0, 2, 15)
      for (const ry of [3, 7, 11]) r(C.wood, 5, ry, 6, 2)
      break
    case 'I': {
      // 다락 창 (두 칸에 걸친 창 하나 — 가운데 창살): 벽, 나무 창틀, 하늘빛 유리
      const left = tileAt(x + 1, y) === 'I'
      r(C.wall, 0, 0, 16, 16)
      r(C.wallTop, 0, 0, 16, 2)
      r('#c59a61', left ? 4 : 0, 3, 12, 11)
      r('#daeff4', left ? 6 : 0, 5, 10, 7)
      r('#edf7f7', left ? 6 : 2, 5, 4, 3)
      r('#c59a61', left ? 14 : 0, 5, 2, 7)
      r('#c59a61', left ? 6 : 0, 8, 10, 2)
      if (!left) r('#c59a61', 10, 3, 2, 11)
      r('#e9ce94', left ? 3 : 0, 13, 13, 2)
      break
    }
    case 'r': {
      // 갈대: 봄은 짧은 연두 새순, 여름은 키 큰 초록에 밤색 이삭, 가을은 갈색 줄기에 크림빛 이삭, 겨울은 마른 줄기 (줄기는 2픽셀)
      const [s1, s2, head] =
        season === 'spring'
          ? ['#9ccb6c', '#86ba5a', null]
          : season === 'summer'
            ? [C.reed, C.reed2, C.woodDark]
            : season === 'autumn'
              ? ['#c4a062', '#ab8650', '#efe0bd']
              : ['#cdbf98', '#b7a77e', null]
      const grow = season === 'spring' ? 5 : season === 'winter' ? 3 : 0
      for (const [i, sx] of [2, 6, 9, 13].entries()) {
        const top = 2 + ((i * 5) % 4) + grow
        r(i % 2 ? s2 : s1, sx, top, 2, 14 - top)
        if (head && i % 2 === 0) r(head, sx, top - 1, 2, 4)
      }
      break
    }
    case 'v':
      // 포도 덩굴: 봄은 연한 새잎이 듬성듬성, 여름은 짙게 우거지고, 가을은 잎 끝이 누렇게 (익은 포도는 그릴 때 얹는다),
      // 겨울은 잎 진 마른 덩굴만 줄을 따라
      r(C.woodDark, 0, 7, 16, 2)
      r(C.woodDark, 7, 3, 2, 12)
      if (season === 'winter') {
        r('#9a7b52', 1, 5, 6, 2)
        r('#9a7b52', 9, 5, 6, 2)
        r('#9a7b52', 3, 3, 2, 2)
        r('#9a7b52', 11, 3, 2, 2)
        r('#c2a878', 13, 9, 2, 2)
      } else if (season === 'spring') {
        r('#7fb65a', 2, 3, 5, 5)
        r('#7fb65a', 9, 3, 5, 5)
        r('#a6d07c', 3, 3, 2, 2)
        r('#a6d07c', 10, 4, 2, 2)
      } else {
        r(C.vine, 2, 2, 12, 7)
        r(C.leaf3, 4, 3, 3, 2)
        if (season === 'autumn') {
          r('#d2b158', 10, 2, 4, 3)
          r('#d2b158', 2, 6, 3, 2)
        }
      }
      break
    case 'j':
      // 들 약초: 낮은 풀포기에 잎 셋, 봄·여름·가을엔 작은 흰 꽃 (겨울엔 마른 잎)
      r('rgba(60,70,40,0.18)', 3, 12, 10, 2)
      r(season === 'winter' ? '#b6a878' : '#70b54e', 4, 7, 8, 6)
      r(season === 'winter' ? '#cabc8c' : '#8bc963', 2, 9, 4, 3)
      r(season === 'winter' ? '#cabc8c' : '#8bc963', 10, 9, 4, 3)
      r(season === 'winter' ? '#cabc8c' : '#a3da7a', 6, 4, 4, 4)
      if (season !== 'winter') {
        r('#fefdf8', 5, 5, 2, 2)
        r('#fefdf8', 9, 6, 2, 2)
      }
      break
    case 'o':
      // 올리브나무: 은빛 도는 작은 둥근 나무
      r('rgba(90,80,50,0.18)', 4, 13, 8, 2)
      r(C.trunk, 7, 10, 2, 5)
      r(C.olive2, 3, 3, 10, 7)
      r(C.olive, 4, 2, 8, 6)
      r(C.olive, 3, 4, 10, 3)
      r('#bfd7a5', 5, 3, 3, 2)
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
      r('#342118', 5, 9, 6, 5)
      r(C.fire, 6, 11, 4, 3)
      break
    case 'm':
      r(C.woodDark, 1, 6, 2, 10)
      r(C.woodDark, 13, 6, 2, 10)
      for (let i = 0; i < 4; i++) r(i % 2 ? C.awning2 : C.awning, i * 4, 1, 4, 5)
      r(C.wood, 1, 10, 14, 3)
      if (season === 'autumn') {
        // 가을 장터: 좌판 위와 밑에 수확 바구니 (석류·포도·호박·무화과 — 좌판마다 다르게)
        const left = x < 25
        const basket = (bx: number, by: number, w: number, fruit: string, fruit2: string) => {
          r('#b8864c', bx, by + 2, w, 3)
          r('#946638', bx, by + 2, w, 2)
          r(fruit, bx + 1, by, w - 2, 2)
          r(fruit2, bx + 1, by, 2, 2)
        }
        basket(2, 6, 6, left ? '#c8584c' : '#7b3f96', left ? '#e48a76' : '#a170b8')
        basket(8, 6, 6, left ? '#e0a050' : '#9a6a8c', left ? '#f2c27a' : '#b98aa8')
        basket(4, 11, 8, left ? '#e0c472' : '#c8584c', left ? '#f0dc96' : '#e48a76')
      } else {
        r(x < 16 ? '#e4cf87' : '#7a3491', 3, 8, 3, 2)
        r(x < 16 ? '#fbf1dc' : '#81b650', 9, 8, 3, 2)
      }
      break
    case 'q':
      // 문 앞 편지 바구니
      r(C.shadow, 3, 12, 10, 3)
      r(C.woodDark, 3, 7, 10, 7)
      r(C.wood, 4, 8, 8, 5)
      r('#fbf6e9', 5, 5, 6, 4)
      break
    case 'l':
      // 텃밭 흙두둑
      r('#a5713d', 1, 3, 14, 12)
      r('#8b5b2c', 1, 6, 14, 1)
      r('#8b5b2c', 1, 10, 14, 1)
      break
    case 'x':
      r(C.fence, 0, 5, 16, 2)
      r(C.fence, 0, 10, 16, 2)
      r(C.woodDark, 2, 3, 2, 11)
      r(C.woodDark, 12, 3, 2, 11)
      break
    case 'y': {
      // 보리밭: 봄은 맨흙 두둑에 연두 새싹, 여름은 누렇게 익은 보리, 가을은 벤 뒤 그루터기, 겨울은 쉬는 맨흙
      if (season === 'summer') {
        r('#c8a65b', 0, 0, 16, 16)
        for (let i = 0; i < 4; i++) {
          r('#dec374', 1 + i * 4, 2, 2, 11)
          r('#ecd690', 1 + i * 4, 2, 2, 3)
        }
      } else if (season === 'spring') {
        r('#b58d62', 0, 0, 16, 16)
        r('#a27a52', 0, 6, 16, 2)
        r('#a27a52', 0, 14, 16, 2)
        for (const row of [2, 10])
          for (let i = 0; i < 4; i++) {
            r('#a8d474', 1 + i * 4, row, 2, 4)
            r('#8cc05e', 1 + i * 4 + 2, row + 2, 2, 2)
          }
      } else if (season === 'autumn') {
        r('#d6bd84', 0, 0, 16, 16)
        r('#c4a76c', 0, 7, 16, 2)
        r('#c4a76c', 0, 14, 16, 2)
        for (const row of [4, 12]) for (let i = 0; i < 4; i++) r('#b8975a', 1 + i * 4, row, 2, 3)
      } else {
        r('#ae8d68', 0, 0, 16, 16)
        r('#9a7a56', 0, 4, 16, 2)
        r('#9a7a56', 0, 12, 16, 2)
      }
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
  const dark = season === 'winter' ? '#96ac87' : C.leaf2
  const mid = season === 'autumn' ? '#d0b460' : season === 'winter' ? '#afc09f' : C.leaf
  const light = season === 'winter' ? '#cdd8bf' : C.leaf3
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
    g.fillStyle = '#cc8989'
    g.fillRect(px + 4 + Math.floor(hash(x, y, 41) * 8), py + 6 + Math.floor(hash(x, y, 42) * 6), 2, 2)
  }
}

/** 두 색을 섞는다 (t = 0 → a, 1 → b) */
function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

/** 굴뚝의 왼쪽 끝 (지붕 왼쪽에서 몇 픽셀) — 지붕 폭의 72% 자리 */
function chimneyX(tx0: number, tx1: number): number {
  return Math.floor((tx1 - tx0 + 1) * TILE * 0.72)
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
    const cx = chimneyX(tx0, tx1)
    r('#e0a974', cx, -6, 8, 12)
    r('#9a6e45', cx - 2, -8, 12, 2)
    r(mix('#e0a974', '#9a6e45', 0.4), cx + 6, -6, 2, 12)
  }
}

/** 계절과 집 단계마다 한 장 (집을 넓히면 그 칸들의 그림이 바뀐다) */
const mapCache = new Map<string, HTMLCanvasElement>()
function mapFor(season: Season): HTMLCanvasElement {
  const cacheKey = `${season}/${currentHomeLevel()}/${openDoors().join(',')}/${currentSpouseRoom()?.id ?? ''}`
  let c = mapCache.get(cacheKey)
  if (c) return c
  c = document.createElement('canvas')
  c.width = WIDTH * TILE
  c.height = HEIGHT * TILE
  const g = c.getContext('2d')!
  for (let y = 0; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) {
      const ch = tileAt(x, y)
      drawGround(g, ch, x, y, season)
      drawObject(g, ch, x, y, season, ch === 'T' ? treeKind(x, y) : undefined)
    }
  // 집마다 지붕 하나
  for (const h of housesNow()) drawRoof(g, h.x0, h.y0, h.x1, h.y1 - 2, (HOUSE_STYLES[h.id] ?? PLAIN_STYLE).roof)
  // 집 안 가구: 바닥 것 → 큰 것 → 탁자 위 작은 것
  const layerRank = { floor: 0, solid: 1, small: 2 } as const
  for (const rm of ROOMS)
    for (const [dx, dy, item, flip] of [...rm.decor].sort((p, q) => layerRank[FURNITURE_DEFS[p[2]]?.layer ?? 'small'] - layerRank[FURNITURE_DEFS[q[2]]?.layer ?? 'small'])) {
      const a = FURNITURE_ART[item]
      if (!a) continue
      const x = rm.x0 + dx
      const y = rm.y0 + dy
      const mirrored = flip === 'flip'
      const rows = mirrored ? mirror(a.rows) : a.rows
      // 'half': 짝수 폭 가구를 홀수 폭 방 가운데에 (그림만 반 칸 오른쪽으로)
      const nudge = flip === 'half' ? TILE / 2 : 0
      g.drawImage(paint(`furni/${item}/${mirrored ? 'flip' : ''}`, rows, FURNI_PALETTE), x * TILE + nudge, y * TILE + (MAP[y][x] === 'n' ? -6 : 0))
    }
  const spouse = currentHomeLevel() >= 1 ? currentSpouseRoom() : null
  if (spouse) {
    const wall = ['wendell', 'marigold', 'tilly', 'postman'].includes(spouse.id) ? `${spouse.id}-wall` : spouse.id === 'cosmo' ? 'cosmo-keepsake' : null
    if (wall) g.drawImage(paint(`spouse-wall/${wall}`, SPOUSE_ROOM_ART[wall].rows, FURNI_PALETTE), (SPOUSE_ROOM.x0 + (spouse.id === 'cosmo' || spouse.window.x === 1 ? 4 : 1)) * TILE, SPOUSE_ROOM.y0 * TILE)
  }
  mapCache.set(cacheKey, c)
  return c
}

// ── 그날의 날씨가 땅에 남기는 것 (계획 15 작업 2) ──

const SNOW = '#f6f8fa'
const SNOW_SHADE = '#dfe7ee'
/** 풀밭 눈 더미 아래 그늘 — 겨울 풀빛(#dfe8dc)과 구별되게 조금 더 푸른 잿빛 */
const SNOW_DRIFT_SHADE = '#c8d5df'

/**
 * 눈 온 날 덮개 한 장 (집 단계·열린 문마다 한 번 굽는다): 지붕 윗줄과 굴뚝 머리, 풀밭이 길과 만나는 가장자리에 쌓인 눈,
 * 풀밭 군데군데 눈 뭉치, 늘푸른나무 머리·빈 가지 끝, 울타리·벤치·좌판 차양 위. 길은 밟혀서 거의 맨땅. 선은 모두 2픽셀 이상
 */
const snowCache = new Map<string, HTMLCanvasElement>()
function snowLayer(): HTMLCanvasElement {
  const cacheKey = `${currentHomeLevel()}/${openDoors().join(',')}`
  let c = snowCache.get(cacheKey)
  if (c) return c
  c = document.createElement('canvas')
  c.width = WIDTH * TILE
  c.height = VILLAGE_H * TILE
  const g = c.getContext('2d')!
  const f = (color: string, x: number, y: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(x, y, w, h)
  }
  const isPath = (ch: string) => ch === ',' || ch === 'm' || ch === 'A' || ch === 'P'
  const isGrassy = (ch: string) => '.*jTxoylvqO'.includes(ch)
  for (let y = 0; y < VILLAGE_H; y++)
    for (let x = 0; x < WIDTH; x++) {
      const ch = tileAt(x, y)
      const px = x * TILE
      const py = y * TILE
      if (isGrassy(ch)) {
        // 길과 만나는 가장자리에 쌓인 눈 (안쪽 끝은 들쭉날쭉)
        if (isPath(tileAt(x, y - 1))) {
          f(SNOW, px, py, TILE, 3)
          for (let i = 0; i < 4; i++) if (hash(x, y, 80 + i) < 0.5) f(SNOW, px + i * 4, py + 3, 4, 2)
        }
        if (isPath(tileAt(x, y + 1))) {
          f(SNOW, px, py + TILE - 3, TILE, 3)
          for (let i = 0; i < 4; i++) if (hash(x, y, 84 + i) < 0.5) f(SNOW, px + i * 4, py + TILE - 5, 4, 2)
        }
        if (isPath(tileAt(x - 1, y))) f(SNOW, px, py, 3, TILE)
        if (isPath(tileAt(x + 1, y))) f(SNOW, px + TILE - 3, py, 3, TILE)
        // 풀밭에 소복이 쌓인 눈 더미 (계획 15 작업 3): 겨울 풀이 이미 옅어서 흰 점만으론 맑은 날과 구별이 안 된다 —
        // 둥근 모서리 눈 더미 한두 개에 옅은 잿빛 하늘색 그늘을 아래로 받쳐 도톰해 보이게. 길에는 놓지 않는다
        // (지붕 바로 위 칸은 굴뚝이 솟아 있으니 빼고, 정자 지붕 아래도 뺀다)
        const roofed = x >= PAVILION_RECT.x0 && x <= PAVILION_RECT.x1 && y >= PAVILION_RECT.y0 && y <= PAVILION_RECT.y1
        if ((ch === '.' || ch === '*') && tileAt(x, y + 1) !== 'R' && !roofed)
          for (let i = 0; i < 2; i++) {
            if (hash(x, y, 102 + i) >= (i === 0 ? 0.75 : 0.35)) continue
            const w = 6 + 2 * Math.floor(hash(x, y, 104 + i) * 3)
            const h = 4 + 2 * Math.floor(hash(x, y, 106 + i) * 2)
            const bx = px + 2 * Math.floor(hash(x, y, 108 + i) * ((TILE - w) / 2 + 1))
            const by = py + 2 * Math.floor(hash(x, y, 110 + i) * ((TILE - h - 2) / 2 + 1))
            f(SNOW_DRIFT_SHADE, bx + 2, by + h, w - 4, 2)
            // 위는 좁고 아래는 넓은 둔덕 모양
            f(SNOW, bx + 2, by, w - 4, 2)
            f(SNOW, bx, by + 2, w, h - 2)
          }
        // 풀밭 군데군데 눈 뭉치 (빈 풀 칸에만)
        if (ch === '.' && !roofed)
          for (let i = 0; i < 3; i++) {
            const sx = 1 + Math.floor(hash(x, y, 90 + i) * 12)
            const sy = 1 + Math.floor(hash(x, y, 93 + i) * 12)
            f(SNOW, px + sx, py + sy, i === 0 ? 4 : 2, 2)
          }
      } else if (ch === ',' && hash(x, y, 96) < 0.35) {
        // 밟힌 길: 가장자리에 남은 눈 몇 점
        f('rgba(246,248,250,0.7)', px + 2 + Math.floor(hash(x, y, 97) * 10), py + 2 + Math.floor(hash(x, y, 98) * 10), 2, 2)
      }
      // 물건 위에 쌓인 눈
      if (ch === 'T') {
        if (treeKind(x, y) === 'evergreen') {
          f(SNOW, px + 5, py + 1, 6, 2)
          f(SNOW, px + 3, py + 3, 3, 2)
          f(SNOW, px + 10, py + 3, 3, 2)
        } else {
          f(SNOW, px + 3, py + 2, 2, 2)
          f(SNOW, px + 11, py + 1, 2, 2)
          f(SNOW, px + 6, py + 0, 2, 2)
          f(SNOW, px + 5, py + 6, 2, 2)
        }
      } else if (ch === 'o') f(SNOW, px + 5, py + 2, 6, 2)
      else if (ch === 'x') f(SNOW, px, py + 3, 16, 2)
      else if (ch === 'B') f(SNOW, px + 1, py + 5, 14, 2)
      else if (ch === 'm') f(SNOW, px, py, 16, 2)
      else if (ch === 'v') f(SNOW, px, py + 5, 16, 2)
    }
  // 지붕: 용마루를 덮는 윗줄 눈과 처마 쪽으로 늘어진 끝, 굴뚝 머리
  for (const h of housesNow()) {
    const ox = h.x0 * TILE
    const oy = h.y0 * TILE
    const w = (h.x1 - h.x0 + 1) * TILE
    const rh = (h.y1 - 2 - h.y0 + 1) * TILE
    for (let i = 0; i < w / 4; i++) {
      const d = hash(h.x0 + i, h.y0, 99)
      if (d < 0.55) f(SNOW_SHADE, ox + i * 4, oy + 6, 4, d < 0.25 ? 6 : 4)
      if (d < 0.55) f(SNOW, ox + i * 4, oy + 6, 4, d < 0.25 ? 4 : 2)
    }
    f(SNOW, ox, oy, w, 6)
    // 기와 띠마다 얇게 남은 눈
    for (let y = 16; y < rh - 4; y += 8) for (let i = 0; i < w / 8; i++) if (hash(h.x0 + i, h.y0 + y, 100) < 0.4) f('rgba(246,248,250,0.85)', ox + i * 8 + 2, oy + y, 6, 2)
    const cx = ox + chimneyX(h.x0, h.x1)
    f(SNOW, cx - 2, oy - 10, 12, 2)
  }
  snowCache.set(cacheKey, c)
  return c
}

/** 호숫가 정자 지붕 윗판에 쌓인 눈 (정자는 decor에서 지도 위에 덧그리므로 그 뒤에 그린다) */
function drawPavilionSnow(g: Ctx) {
  const { x0, y0, x1 } = PAVILION_RECT
  const left = x0 * TILE
  const top = y0 * TILE
  const w = (x1 - x0 + 1) * TILE
  g.fillStyle = SNOW_SHADE
  g.fillRect(left + 6, top - 9, w - 12, 3)
  g.fillStyle = SNOW
  g.fillRect(left + 6, top - 12, w - 12, 4)
  // 아랫판 처마 끝에 군데군데 남은 눈 (분홍 기와가 보이게 조금만)
  for (let i = 0; i < (w - 4) / 6; i++) if (hash(x0 + i, y0, 101) < 0.5) g.fillRect(left + 2 + i * 6, top - 6, 4, 2)
}

/** 물웅덩이가 생길 수 있는 흙길 자리 (지도에서 한 번 고른다) — 그날그날 이 중 절반이 안 되게 */
const PUDDLE_SPOTS: readonly Tile[] = (() => {
  const out: Tile[] = []
  for (let y = 1; y < VILLAGE_H - 1; y++)
    for (let x = 1; x < WIDTH - 1; x++) if (MAP[y][x] === ',' && hash(x, y, 131) < 0.045) out.push({ x, y })
  return out
})()

/** 비 온 뒤 흙길의 물웅덩이: 젖은 흙 테두리, 하늘빛 물, 빛 한 점 (비가 오는 중이면 빗방울 동그라미가 번진다) */
function drawPuddles(g: Ctx, day: number, raining: boolean, t: number) {
  for (const p of PUDDLE_SPOTS) {
    // 그날 고른 자리의 3분의 1쯤만 (광장 한 화면에 너덧 개)
    if (hash(p.x, p.y, day) >= 0.35) continue
    const big = hash(p.x, p.y, 134) < 0.5
    const w = big ? 12 : 8
    // 칸 밖으로 넘치지 않게 (테두리까지 w + 4)
    const px = p.x * TILE + 2 * Math.floor(hash(p.x, p.y, 132) * ((TILE - w - 4) / 2 + 1))
    const py = p.y * TILE + 2 * Math.floor(hash(p.x, p.y, 133) * 2)
    // 젖은 흙 테두리 2픽셀, 모서리는 깎아 둥글게
    g.fillStyle = '#d9bd8c'
    g.fillRect(px, py + 6, w + 4, 4)
    g.fillRect(px + 2, py + 4, w, 8)
    g.fillStyle = '#a9cad0'
    g.fillRect(px + 2, py + 6, w, 4)
    g.fillStyle = '#d6eaee'
    g.fillRect(px + 4, py + 6, 2, 2)
    if (raining && (t * 1.3 + hash(p.x, p.y, 135)) % 1 < 0.35) {
      g.fillStyle = 'rgba(232,244,246,0.9)'
      const rx = px + 2 + 2 * Math.floor(hash(p.x, p.y, Math.floor(t * 1.3)) * (w / 2))
      g.fillRect(rx, py + 8, 2, 2)
    }
  }
}

/** 추운 아침 호숫가 물가 한 줄 살얼음 (호수 첫 줄 위쪽 가장자리) — 8시부터 9시까지 천천히 녹는다 */
function drawShoreIce(g: Ctx, minute: number, locked: ReadonlySet<string>) {
  const a = minute < 8 * 60 ? 1 : Math.max(0, (9 * 60 - minute) / 60)
  if (a <= 0) return
  const y = 34
  for (let x = 1; x < WIDTH - 1; x++) {
    // 물 칸만 — 아직 열리지 않아 물로 덮어 그린 잔교 칸도 물로 친다
    if (tileAt(x, y) !== '~' && !(tileAt(x, y) === '=' && locked.has(`${x},${y}`))) continue
    g.fillStyle = `rgba(226, 241, 244, ${0.9 * a})`
    g.fillRect(x * TILE, y * TILE, TILE, 4)
    // 안쪽 끝은 들쭉날쭉 (4픽셀 토막마다 한 줄 더 얼거나 그늘만)
    for (let i = 0; i < 4; i++) {
      const more = hash(x, y, 136 + i) < 0.5
      g.fillStyle = more ? `rgba(226, 241, 244, ${0.9 * a})` : `rgba(196, 224, 230, ${0.8 * a})`
      g.fillRect(x * TILE + i * 4, y * TILE + 4, 4, 2)
      if (more) {
        g.fillStyle = `rgba(196, 224, 230, ${0.8 * a})`
        g.fillRect(x * TILE + i * 4, y * TILE + 6, 4, 2)
      }
    }
    g.fillStyle = `rgba(255, 255, 255, ${a})`
    g.fillRect(x * TILE + 2 + Math.floor(hash(x, y, 140) * 9), y * TILE + 1, 4, 2)
  }
}

/** 여름 맑은 날 호수 물빛: 반짝이는 하이라이트 몇 점이 켜졌다 꺼진다 */
function drawLakeGlints(g: Ctx, t: number) {
  for (let i = 0; i < 40; i++) {
    const ph = (t * 0.6 + hash(i, 7, 141)) % 1
    if (ph > 0.45) continue
    const cyc = Math.floor(t * 0.6 + hash(i, 7, 141))
    const x = 1 + Math.floor(hash(i, cyc, 142) * (WIDTH - 2))
    const y = 35 + Math.floor(hash(i, cyc, 143) * (VILLAGE_H - 37))
    if (tileAt(x, y) !== '~') continue
    g.fillStyle = ph < 0.15 || ph > 0.3 ? 'rgba(236, 250, 252, 0.6)' : 'rgba(255, 255, 255, 0.95)'
    g.fillRect(x * TILE + Math.floor(hash(i, cyc, 144) * 10), y * TILE + Math.floor(hash(i, cyc, 145) * 12), ph < 0.15 || ph > 0.3 ? 2 : 4, 2)
  }
}

/**
 * 굴뚝 연기: 굴뚝 머리에서 연한 잿빛 덩이가 피어올라 옆으로 흩어진다.
 * 겨울엔 집집마다 크고 많이, 밥 짓는 때엔 몇 집만 조금. 바람 부는 날엔 더 옆으로 눕는다
 */
function drawChimneySmoke(g: Ctx, game: GameState, kind: 'meal' | 'winter', windy: boolean, t: number) {
  const closed = closedHouseIds(game)
  const n = kind === 'winter' ? 7 : 3
  for (const h of housesNow()) {
    if (closed.includes(h.id)) continue
    if (kind === 'meal' && hash(h.x0, h.y0, 150) >= 0.5) continue
    const cx = h.x0 * TILE + chimneyX(h.x0, h.x1) + 3
    const cy = h.y0 * TILE - 10
    const seed = hash(h.x0, h.y0, 151)
    for (let i = 0; i < n; i++) {
      const ph = (t * 0.32 + seed + i / n) % 1
      const size = (kind === 'winter' ? 4 : 2) + Math.floor(ph * (kind === 'winter' ? 4 : 3))
      // 처음엔 곧게 오르다 위로 갈수록 휘고 흔들린다 (곧은 계단 기둥처럼 보이지 않게)
      const drift = ph * ph * (windy ? 24 : 10) + Math.sin(t * 1.1 + ph * 5 + seed * 6) * (0.5 + ph * 3)
      // 눈 덮인 풀밭·흰 지붕 위에서도 보이게 옅은 잿빛 보라 (흰색이면 눈에 묻힌다)
      g.fillStyle = `rgba(196, 190, 198, ${(kind === 'winter' ? 0.85 : 0.6) * (1 - ph * 0.8)})`
      g.fillRect(Math.round(cx + drift - size / 2), Math.round(cy - ph * (kind === 'winter' ? 30 : 18) - size / 2), size, size)
    }
  }
}

/** 키는 모두 몇 가지 값의 조합이라 늘어나지 않지만(옷차림 바꾸기만 조합이 는다), 혹시 몰라 넘치면 비운다 */
const SPRITE_CACHE_MAX = 800
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
  if (spriteCache.size >= SPRITE_CACHE_MAX) spriteCache.clear()
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
  g.fillStyle = '#492c1b'
  g.fillRect(x - 1, y - 1, 12, 10)
  g.fillStyle = '#fffaf0'
  g.fillRect(x, y, 10, 8)
  g.fillRect(x + 3, y + 8, 2, 2)
  g.fillStyle = '#492c1b'
  draw(x, y)
}

type EmoteId = 'z' | 'note' | 'yawn' | 'talk' | 'heart' | 'sweat' | 'hungry' | 'shiver' | 'letter'
/** 하고 있는 일 (계획 6b): 일과 자리에 선 사람 머리 위 작은 그림 — 말을 걸기 전에도 무엇을 하는지 보인다 */
const DOING: Record<Activity, string[]> = {
  press: ['.nnnnnn.', '...nn...', '.k.kk.k.', '.k.kk.k.', '.kkkkkk.', '........'],
  sort: ['.ww.ww..', '.wn.wn..', '.ww.ww..', '.kkkkkk.', '........', '........'],
  hammer: ['..kkkk..', '..kkkk..', '...nn...', '...nn...', '...nn...', '........'],
  net: ['b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '........'],
  tea: ['..w.w...', '........', '.oooooo.', '.oooooook', '..oooo.k', '........'],
  book: ['........', '.wwkwww.', '.wwkwww.', '.wwkwww.', '.nnknnn.', '........'],
  bread: ['........', '..yyyy..', '.yoyoyy.', 'yyyyyyyy', '.oooooo.', '........'],
  sheep: ['..wwww..', '.wwwwwwk', 'wwwwwwkk', '.wwwwww.', '.k.k.k..', '........'],
  herb: ['...g....', '..ggg...', '.ggggg..', '..ggg.g.', '...n.gg.', '...n....'],
  weave: ['pppppppp', 'p.p.p.p.', 'pppppppp', '.p.p.p.p', 'pppppppp', '........'],
  bee: ['..w.w...', '.ykyky..', 'ykykyk..', '.ykyky..', '........', '........'],
  grape: ['...g....', '..pp....', '.pppp...', '.ppp....', '..p.....', '........'],
  music: ['...kkk..', '...k.k..', '...k.k..', '.kkk.kk.', '.kk.....', '........'],
  rest: ['........', 'kkk.....', '..k.kk..', '.k....k.', 'kkk.kk..', '........'],
  wait: ['........', '.kk.kk..', '........', '........', '.k..k..k', '........'],
  wood: ['........', 'nnnnnnn.', 'n.n.n.nn', 'nnnnnnn.', '........', '........'],
  cat: ['.k...k..', '.kk.kk..', '.kkkkk..', '.kwkwk..', '..kkk...', '........'],
}
const DOING_COL: Record<string, string> = { k: '#492c1b', n: '#b17640', b: '#68a6da', w: '#fff7e5', o: '#eda06b', y: '#f9da72', g: '#70b54e', p: '#aa64be' }
function doingIcon(g: Ctx, kind: Activity, cx: number, top: number) {
  const rows = DOING[kind]
  if (!rows) return
  bubble(g, cx, top, (x, y) => {
    rows.forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        const c = DOING_COL[row[dx]]
        if (!c) continue
        g.fillStyle = c
        g.fillRect(x + 1 + dx, y + dy + 1, 1, 1)
      }
    })
  })
}

function emote(g: Ctx, id: EmoteId, cx: number, top: number) {
  bubble(g, cx, top, (x, y) => {
    const f = (dx: number, dy: number, w = 1, h = 1, col = '#492c1b') => {
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
        f(2, 2, 2, 1, '#d6677b')
        f(6, 2, 2, 1, '#d6677b')
        f(1, 3, 8, 2, '#d6677b')
        f(2, 5, 6, 1, '#d6677b')
        f(4, 6, 2, 1, '#d6677b')
        break
      case 'sweat':
        f(5, 1, 1, 1, '#6ca7d7')
        f(4, 2, 3, 3, '#6ca7d7')
        f(5, 5, 1, 1, '#6ca7d7')
        break
      case 'hungry':
        f(2, 4, 6, 3, '#b17640')
        f(3, 3, 4, 1, '#e4cf87')
        break
      case 'shiver':
        f(1, 2, 1, 4, '#79a9d8')
        f(8, 2, 1, 4, '#79a9d8')
        f(4, 3, 2, 2, '#79a9d8')
        break
      case 'letter':
        // 안 읽은 편지: 흰 봉투에 붉은 봉인
        f(1, 2, 8, 5, '#fff7e5')
        f(1, 2, 8, 1)
        f(1, 6, 8, 1)
        f(1, 2, 1, 5)
        f(8, 2, 1, 5)
        f(2, 3, 2, 1)
        f(6, 3, 2, 1)
        f(4, 4, 2, 1, '#c0392b')
        break
    }
  })
}

/** 이웃 그림: 연애 후보(계획 6)는 주인공 모양 고르기와 같은 머리·옷으로, 나머지는 이웃마다 정한 옷으로 */
function neighborLook(def: NeighborDef, growth?: number, dressed?: Avatar): { who: Who; extra: PersonExtra } {
  if (def.avatar && def.look) {
    // 옷장에서 바꾼 배우자 모습이 있으면 그것으로
    const avatar = withLookDefaults({ look: def.look, name: def.role, ...def.avatar, ...(dressed ?? {}) })
    return { who: 'writer', extra: { look: def.look, avatar } }
  }
  return { who: def.sprite as Who, extra: { growth } }
}
function neighborPerson(def: NeighborDef, facing: Facing, frame: 0 | 1 | 2, blink: boolean, season: Season, growth?: number, dressed?: Avatar) {
  const { who, extra } = neighborLook(def, growth, dressed)
  return person(who, facing, frame, blink, 'stand', season, extra)
}

/** 아이 요람 (계획 12): 나무 요람, 크림색 이불 */

/**
 * 마을 지도 (설정 → 마을 지도): 마을 전체를 한 장으로 — 붙박이 그림(mapFor)에서 마을 부분만 잘라 그리고,
 * 아직 열리지 않은 구역은 덤불로 덮고, 기록자 자리에 표시를 둔다. 캔버스 크기는 WIDTH×VILLAGE_H 칸
 */
export function drawVillageMap(g: Ctx, game: GameState): void {
  const season = seasonOf(game.clock.day)
  g.imageSmoothingEnabled = false
  g.drawImage(mapFor(season), 0, 0, WIDTH * TILE, VILLAGE_H * TILE, 0, 0, WIDTH * TILE, VILLAGE_H * TILE)
  coverLocked(g, game, season)
  // 주민이 함께 지은 공동 시설도 마을 그림에 남는다 (계획 16 작업 20)
  drawVillage(g, game)
}

/**
 * 아직 열리지 않은 곳을 덤불로 덮는다: 서고 권수로 열리는 구역(물만 보이고 잔교·배도 덮는다),
 * 그리고 아직 이사 오지 않은 이웃의 집 (2026-09-30 사용자 — 열리기 전엔 보이지 않게)
 */
function coverLocked(g: Ctx, game: GameState, season: Season) {
  for (const z of lockedZones(shelvedCount(game)))
    for (let y = z.y0; y <= z.y1; y++)
      for (let x = z.x0; x <= z.x1; x++) {
        const c = tileAt(x, y)
        // 잔교·배는 물로 덮어 아직 없는 것처럼 (같은 줄 옆 물 칸을 그대로 옮겨 그린다)
        if (c === '=' || c === 'u') g.drawImage(mapFor(season), (z.x0 - 1) * TILE, y * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE)
        else if (c !== '~') drawBush(g, x, y, season)
      }
  const closed = closedHouseIds(game)
  for (const h of housesNow().filter((h) => closed.includes(h.id)))
    for (let y = h.y0 - 1; y <= h.y1; y++)
      for (let x = h.x0; x <= h.x1; x++) if (y >= h.y0 || tileAt(x, y) === '.') drawBush(g, x, y, season)
}

/** 이웃 수첩에 붙이는 앞모습 한 장 */
export function neighborPortrait(def: NeighborDef, season: Season) {
  return neighborPerson(def, 'down', 0, false, season)
}

function drawSprite(g: Ctx, c: HTMLCanvasElement, wx: number, wy: number, dy = 0) {
  // 발이 칸 아래쪽에 닿도록, 가운데 맞춤
  const px = Math.round(wx * TILE + (TILE - c.width) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - c.height - dy)
  g.fillStyle = C.shadow
  g.fillRect(px + 1, Math.round(wy * TILE) + 13, c.width - 2, 2)
  g.drawImage(c, px, py)
}

type PersonExtra = { inky?: boolean; growth?: number; look?: Look; avatar?: FullAvatar; short?: number }
/** 사람 그림 캐시 키의 외형 부분 (계절·잉크·키·모습) */
function lookKey(who: Who, season: Season, extra: PersonExtra): string {
  return `${who === 'writer' ? season : season === 'winter' ? 'w' : ''}/${extra.inky ?? ''}/${extra.growth ?? ''}/${extra.short ?? ''}/${extra.look ?? ''}/${extra.avatar ? avatarKey(extra.avatar) : ''}`
}

function person(who: Who, facing: Facing, frame: 0 | 1 | 2, blink: boolean, pose: Pose, season: Season, extra: PersonExtra = {}) {
  const rows = spriteRows(who, facing, { frame, blink, pose, season, ...extra })
  const pal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  return paint(`${who}/${facing}/${frame}/${blink}/${pose}/${lookKey(who, season, extra)}`, rows, pal)
}

// ── 가구 쓰는 동작 (계획 17 작업 3) ──

/** 24×24 동작 한 장: 뒤 소품 → 사람 → 앞 소품 순으로 겹쳐 한 번만 칠해 둔다 (사람은 지금 외형의 팔레트, 소품은 소품 팔레트) */
const motionCache = new Map<string, HTMLCanvasElement>()
function motionCanvas(keyStr: string, layers: { actor: string[]; propBack: string[]; propFront: string[] }, actorPal: Record<string, string>, propPal: Record<string, string>): HTMLCanvasElement {
  let c = motionCache.get(keyStr)
  if (c) return c
  c = document.createElement('canvas')
  c.width = USE_SIZE
  c.height = USE_SIZE
  const g = c.getContext('2d')!
  for (const [rows, pal] of [[layers.propBack, propPal], [layers.actor, actorPal], [layers.propFront, propPal]] as const)
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const col = pal[ch]
        if (ch === '.' || !col) return
        g.fillStyle = col
        g.fillRect(x, y, 1, 1)
      }),
    )
  if (motionCache.size >= SPRITE_CACHE_MAX) motionCache.clear()
  motionCache.set(keyStr, c)
  return c
}

/** 되풀이 동작의 몇째 박자인지: USE_INFO의 프레임 시간(ms)을 차례로 쌓아 돈다 */
function usePhase(action: UseAction, ms: number): number {
  const d = USE_INFO[action].durations
  let m = ms % d.reduce((a, b) => a + b, 0)
  for (let i = 0; i < d.length; i++) {
    if (m < d[i]) return i
    m -= d[i]
  }
  return 0
}

/** 일어나기(단발) 네 박자 길이 — extraUseFrame의 단발 동작은 한 박자 180ms */
const RISE_SECONDS = 0.72

/** 동작 한 장. 사용 동작은 furnitureUseFrame, 일어나기는 누운 채 있다가 마지막에 extraUseFrame('rise') 한 번 */
function useFrameCanvas(who: Who, facing: Facing, kind: ActKind, elapsed: number, total: number, blink: boolean, season: Season, extra: PersonExtra): HTMLCanvasElement {
  const opts = { frame: 0 as const, blink, season, ...extra }
  const actorPal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  const look = lookKey(who, season, extra)
  // 생일 빵 촛불 불기 (계획 17 작업 5): 한 번 — 마지막 장(꺼진 초)에서 멈춘다
  if (kind === 'blowCandle') {
    const f = Math.min(3, Math.floor(elapsed / (total / 4)))
    return motionCanvas(`ev/candle/${who}/${facing}/${f}/${blink}/${look}`, eventMotionFrame(who, facing, 'blowCandle', f, opts), actorPal, FURNI_PALETTE)
  }
  if (kind === 'rise' && elapsed >= total - RISE_SECONDS) {
    const f = Math.min(3, Math.floor((elapsed - (total - RISE_SECONDS)) / (RISE_SECONDS / 4)))
    const action: ExtraAction = 'rise'
    return motionCanvas(`xuse/${who}/${facing}/${action}/${f}/${blink}/${look}`, extraUseFrame(who, facing, action, f, opts), actorPal, FURNI_PALETTE)
  }
  const action: UseAction = kind === 'rise' ? 'lie' : kind
  const phase = usePhase(action, elapsed * 1000)
  return motionCanvas(`use/${who}/${facing}/${action}/${phase}/${blink}/${look}`, furnitureUseFrame(who, facing, action, phase, opts), actorPal, USE_PROP_PALETTE)
}

/**
 * 동작 그림을 서 있는 그림과 같은 자리에: 동작 캔버스 안의 사람은 (7, 4)에서 시작하므로 서 있는 그림의 왼쪽 위에서 그만큼 뺀다.
 * 누운 몸이 아니면 서 있을 때처럼 발밑 그림자
 */
function drawUse(g: Ctx, c: HTMLCanvasElement, stand: HTMLCanvasElement, wx: number, wy: number, shadow: boolean) {
  const px = Math.round(wx * TILE + (TILE - stand.width) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - stand.height)
  if (shadow) {
    g.fillStyle = C.shadow
    g.fillRect(px + 1, Math.round(wy * TILE) + 13, stand.width - 2, 2)
  }
  g.drawImage(c, px - 7, py - 4)
}

/** 행사 동작 한 장 (계획 17 작업 4·5): 결혼식은 weddingActorFrame, 그 밖은 eventMotionFrame — 지금 외형으로 */
function eventFrameCanvas(who: Who, m: EventMotion, blink: boolean, season: Season, extra: PersonExtra): HTMLCanvasElement {
  const opts = { frame: 0 as const, blink, season, ...extra }
  const actorPal = who === 'writer' ? writerPalette(season, extra.avatar) : PALETTE
  const keyStr = `ev/${m.set}/${who}/${m.facing}/${m.action}/${m.frame}/${blink}/${lookKey(who, season, extra)}`
  const layers = m.set === 'wedding' ? weddingActorFrame(who, m.facing, m.action as WeddingAction, m.frame, opts) : eventMotionFrame(who, m.facing, m.action as EventAction, m.frame, opts)
  return motionCanvas(keyStr, layers, actorPal, FURNI_PALETTE)
}

/** 행사 동작을 서 있는 그림 자리에 */
function drawEventMotion(g: Ctx, who: Who, m: EventMotion, wx: number, wy: number, blink: boolean, season: Season, extra: PersonExtra) {
  const stand = person(who, m.facing, 0, false, 'stand', season, extra)
  drawUse(g, eventFrameCanvas(who, m, blink, season, extra), stand, wx, wy, true)
}

/** 기록자의 지금 동작 (앉는 자리가 있으면 그 칸 위에서) */
function drawPlayerAct(g: Ctx, act: PlayerAct, p: { x: number; y: number }, blink: boolean, season: Season, extra: PersonExtra) {
  const at = act.at ?? p
  const stand = person('writer', act.facing, 0, false, 'stand', season, extra)
  const c = useFrameCanvas('writer', act.facing, act.kind, act.total - act.left, act.total, blink, season, extra)
  drawUse(g, c, stand, at.x, at.y, act.kind !== 'rise')
}

function animal(kind: 'cat' | 'dog', form: 'adult' | 'baby' | 'curl', facing: Facing) {
  const side = facing === 'left' ? 'left' : 'right'
  return paint(`animal/${kind}/${form}/${side === 'left' ? 'l' : 'r'}`, animalRows(kind, form, side), ANIMAL_PALETTE[kind])
}

// ── 방의 가구 ──

/**
 * 넓은 책상. 오른쪽 칸은 서는 자리(걸어 다니는 칸)라 칸을 넘어 그리지 않는다:
 * 책상 칸 안에서 상판만 넓게, 오른쪽으로 3px 넘게 내민다(서는 자리 대부분은 비워 둔다).
 * 등잔 자리는 작은 책상과 같게(그을음·불빛이 맞도록). 바닥 가구(깔개)는 이 위에 그려진다.
 */
function drawWideDesk(g: Ctx, at: Tile, season: Season) {
  drawGround(g, 'f', at.x, at.y, season)
  const px = at.x * TILE
  const py = at.y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  r(C.shadow, 0, 12, 19, 3)
  r(C.woodDark, 1, 11, 2, 4)
  r(C.woodDark, 14, 11, 2, 4)
  r(C.wood, 0, 4, 19, 8)
  r(C.woodDark, 0, 10, 19, 2)
  // 펼친 종이와 말린 두루마리
  r(C.paper, 2, 5, 7, 5)
  r('#e9ce94', 3, 6, 5, 2)
  r(C.paper, 11, 6, 6, 3)
  r('#f5e0af', 10, 5, 2, 5)
  r('#f5e0af', 16, 5, 2, 5)
  r(C.lamp, 12, 3, 2, 3)
}

/**
 * 책상이 살아온 흔적 (계획 14 작업 7): 필사한 만큼 책상 위에 생긴 작은 물건들. 무엇이 놓이는지는 engine/desk-traces.
 * 모두 책상 칸 안(넓은 책상이면 그 상판 안)에만 — 왼쪽 뒤 펜꽂이, 오른쪽 뒤 등잔(불꽃 자리는 그대로),
 * 오른쪽 앞 종이 묶음, 왼쪽 앞 덮어 둔 완성본, 종이 아래로 늘어진 책갈피 끈, 종이 위 좋은 펜. 선은 2픽셀 이상.
 */
function drawDeskTraces(g: Ctx, at: Tile, d: DeskTraces) {
  const px = at.x * TILE
  const py = at.y * TILE
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  // 종이 묶음 자리: 작은 책상은 등잔 아래, 넓은 책상은 두루마리 옆 끝
  const stackX = d.wideDesk ? 15 : 11
  if (d.penCup) {
    // 흙 펜꽂이와 꽂아 둔 갈대 펜 (끝이 잉크에 물들었다)
    r('#e2c48a', 2, 0, 2, 3)
    r('#7d6a8c', 2, 0, 2, 2)
    r('#93654b', 1, 3, 3, 4)
    r('#c48f6b', 1, 3, 3, 2)
  }
  if (d.lamp) {
    // 흙 등잔: 불꽃 아래 낮은 몸통 (불꽃·그을음 자리는 그대로)
    r('#b07a5a', 11, 5, 4, 2)
    r(C.lamp, 12, 3, 2, 2)
  }
  if (d.pages > 0) {
    // 다 쓴 종이 묶음: 한 겹은 2픽셀, 겹마다 크림색·연한 모래색이 번갈아
    const h = d.pages * 2
    // 작은 책상은 맨 아래를 14에 놓아 세 겹이어도 등잔 몸통(5~7줄) 아래에 둔다
    const top = (d.wideDesk ? 12 : 14) - h
    for (let i = 0; i < d.pages; i++) r(i % 2 ? '#eadcb8' : '#fbf3dc', stackX, top + i * 2, 4, 2)
    // 맨 위 장에 쓴 줄 자국
    r('#b3aabb', stackX + 1, top, 2, 2)
  }
  if (d.books > 0) {
    // 덮어 둔 완성본 (두 권이면 아래에 한 권 더) — 쓰던 종이가 보이게 폭은 4
    // 위 책은 항상 8줄부터 — 펜꽂이(0~7줄)와 겹치지 않는다
    if (d.books > 1) r('#93b08f', 1, 12, 4, 2)
    const by = 8
    r('#8399bf', 1, by, 4, 2)
    r('#62779e', 1, by + 2, 4, 2)
  }
  if (d.ribbon) {
    // 종이 아래로 늘어진 책갈피 끈
    r('#c47f92', 8, 9, 2, 5)
  }
  if (d.goodPen) {
    // 좋은 펜: 종이 윗머리에 가로로 놓인 자줏빛 펜과 금빛 펜촉
    r('#6b5a7c', 5, 5, 4, 2)
    r('#e3bb55', 9, 5, 2, 2)
  }
}

/** 그을음 받이: 화덕 칸 위쪽 돌 위에 쇠판과 받침 (선은 모두 2픽셀) */
function drawSootCatcher(g: Ctx, at: Tile) {
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(at.x * TILE + dx, at.y * TILE + dy, w, h)
  }
  r('#a6947c', 2, 0, 12, 2)
  r('#917c65', 3, 2, 10, 2)
  r('#7f6d5a', 4, 4, 8, 2)
  r('#45372f', 5, 4, 2, 2)
  r('#45372f', 9, 4, 2, 2)
}

function furnitureOrder(f: Furniture): number {
  const layer = FURNITURE_DEFS[f.item]?.layer
  if (f.on) return 3
  return layer === 'floor' ? 0 : layer === 'solid' ? 1 : 2
}

/** 고른 가구 테두리: 차지한 칸 둘레에 2px 밝은 선 (방 꾸미기) */
function drawSelection(g: Ctx, tiles: readonly Tile[]) {
  if (!tiles.length) return
  const x0 = Math.min(...tiles.map((t) => t.x)) * TILE
  const y0 = Math.min(...tiles.map((t) => t.y)) * TILE
  const x1 = (Math.max(...tiles.map((t) => t.x)) + 1) * TILE
  const y1 = (Math.max(...tiles.map((t) => t.y)) + 1) * TILE
  g.strokeStyle = '#fff4dc'
  g.lineWidth = 2
  g.strokeRect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2)
}

function drawFurniture(g: Ctx, f: Furniture) {
  const px = f.x * TILE
  const py = f.y * TILE
  const fixture = FIXTURES[f.item as keyof typeof FIXTURES]
  if (fixture && !facingArt(f.item, facingOf(f))) { drawObject(g, fixture.ch, f.x, f.y, 'spring'); return }
  const custom = SPOUSE_FURNITURE[f.item]
  if (custom) {
    const a = custom.source === 'spouse-room-art'
      ? SPOUSE_ROOM_VIEWS[custom.id]?.[facingOf(f)] ?? SPOUSE_ROOM_ART[custom.id]
      : HOME_SPACE_DIRECTIONS[custom.id]?.[facingOf(f)] ?? FURNITURE_ART[custom.id]
    if (a) g.drawImage(paint(`spouse/${custom.id}/${facingOf(f)}`, a.rows.map(r => r.replaceAll('z', '.')), FURNI_PALETTE), px + (custom.pixelOffset?.x ?? 0), py + (custom.pixelOffset?.y ?? (f.on ? -6 : 0)))
    return
  }
  // 동일한 원본을 이웃집·플레이어 집·가방에 사용한다.
  // 방향 그림이 있으면 보는 쪽 그림 (계획 17 작업 2 — 옛 저장은 옛 그림 쪽), 없으면 지금 그림
  const facing = facingOf(f)
  const turned = facingArt(f.item, facing)
  const sprite = turned ?? FURNITURE_ART[f.item]
  if (sprite) {
    // 배운 생활 기술의 모습 (기획 11): 색만 바꾼다. 모르는 값은 본래 그림
    const style = f.finish ? STYLE_PALETTES[f.item]?.[f.finish] : undefined
    const palette = style ? { ...FURNI_PALETTE, ...style } : FURNI_PALETTE
    g.drawImage(paint(`${turned ? `furni/${f.item}/${facing}` : `furni/${f.item}`}/${style ? f.finish : 'plain'}`, sprite.rows, palette), px, py + (f.on ? -6 : 0))
    return
  }
  const r = (color: string, dx: number, dy: number, w: number, h: number) => {
    g.fillStyle = color
    g.fillRect(px + dx, py + dy, w, h)
  }
  switch (f.item) {
    case 'rug': {
      // 3×2칸 무늬 깔개
      r('#9c402f', 1, 2, 46, 28)
      r('#bc5a45', 3, 4, 42, 24)
      r('#e4cf87', 6, 7, 36, 18)
      r('#bc5a45', 9, 10, 30, 12)
      for (let i = 0; i < 5; i++) r('#e4cf87', 12 + i * 6, 15, 3, 3)
      for (let i = 0; i < 12; i++) {
        r('#fbf1dc', 2 + i * 4, 0, 1, 2)
        r('#fbf1dc', 2 + i * 4, 30, 1, 2)
      }
      return
    }
    case 'cushion':
      r('#e8d8b5', 2, 7, 12, 8)
      r('#fbf6e9', 3, 6, 10, 7)
      r('#e8d8b5', 7, 8, 2, 2)
      return
    case 'table':
      r(C.shadow, 1, 13, 30, 3)
      r(C.woodDark, 2, 9, 2, 6)
      r(C.woodDark, 28, 9, 2, 6)
      r(C.woodDark, 0, 8, 32, 2)
      r(C.wood, 0, 3, 32, 6)
      r('#c59260', 1, 4, 30, 1)
      return
    case 'nightstand':
      r(C.shadow, 2, 13, 13, 3)
      r(C.woodDark, 2, 4, 12, 11)
      r(C.wood, 3, 5, 10, 4)
      r(C.wood, 3, 10, 10, 4)
      r('#492c1b', 7, 11, 2, 1)
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
      g.fillStyle = i % 2 ? '#81b959' : '#c8a65b'
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
  const cols = ['#e67f7f', '#e4ac6a', '#eed584', '#82d072', '#7caae0', '#9476d6']
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

/** 책등 등급 띠: 맨 책·은박·금박 */
const GRADE_BAND = ['#dbc49c', '#d0d6e1', '#fac839']

/**
 * 큰 책등 하나 (8×10 — 서고 복음서 선반·사도행전 방·요한계시록 방, 계획 14 작업 4): 책마다 다른 색과 무늬(제본 binding.spineLook —
 * 특별 제본이면 고른 표지 색·무늬·장식), 은박·금박은 위아래 2픽셀 띠, 봉인은 아래 가운데 붉은 점. 무늬는 2픽셀 이상, 좌우 대칭
 */
function drawSpine(g: Ctx, sx: number, sy: number, book: Book, game: GameState) {
  const grade = game.shelved[book]
  if (grade === undefined) return
  const look = spineLook(book, game.bound?.[book])
  g.fillStyle = look.color
  g.fillRect(sx, sy, 8, 10)
  g.fillStyle = look.accent
  if (look.mark === 'band') {
    g.fillRect(sx, sy + 3, 8, 2)
    g.fillRect(sx, sy + 6, 8, 2)
  } else if (look.mark === 'stripe') g.fillRect(sx + 3, sy + 2, 2, 6)
  else if (look.mark === 'dot') g.fillRect(sx + 2, sy + 3, 4, 4)
  else if (look.mark === 'diamond') {
    g.fillRect(sx + 3, sy + 2, 2, 6)
    g.fillRect(sx + 2, sy + 4, 4, 2)
  }
  if (grade > 0) {
    g.fillStyle = GRADE_BAND[grade]
    g.fillRect(sx, sy, 8, 2)
    g.fillRect(sx, sy + 8, 8, 2)
  }
  if ((game.sealed ?? []).includes(book)) {
    g.fillStyle = '#db4627'
    g.fillRect(sx + 3, sy + 7, 2, 2)
  }
}

/** 아직 꽂지 않은 큰 책등 자리: 어두운 빈 칸과 2픽셀 밝은 나무 테 (빈 칸이 또렷이 보이게) */
function drawEmptySlot(g: Ctx, sx: number, sy: number) {
  g.fillStyle = 'rgba(40,25,15,0.4)'
  g.fillRect(sx, sy, 8, 10)
  g.fillStyle = 'rgba(236, 214, 170, 0.55)'
  g.fillRect(sx, sy + 8, 8, 2)
}

/**
 * 편지 방 선반의 얇은 책등 (방 표 순서) — 꽂힌 책만, 책마다 다른 색(binding.spineLook)과 가운데 장식 띠, 은박·금박이면 위아래 띠.
 * 꽂지 않은 책의 자리는 비워 둔다. 여덟 권 방은 조금 굵게
 */
const LETTER_SPINES: Record<'romPhm' | 'hebJud', { w: number; step: number }> = {
  romPhm: { w: 2, step: 3 },
  hebJud: { w: 3, step: 5 },
}
function drawLetterSpines(g: Ctx, game: GameState, room: 'romPhm' | 'hebJud') {
  const [s0] = (room === 'romPhm' ? PLACES.lettersShelf : PLACES.hebJudShelf).tiles
  const { w, step } = LETTER_SPINES[room]
  shelfRoom(room).books.forEach((b, i) => {
    const sx = s0.x * TILE + 5 + i * step
    const sy = s0.y * TILE + 2
    const grade = game.shelved[b]
    if (grade === undefined) return
    const look = spineLook(b, game.bound?.[b])
    g.fillStyle = look.color
    g.fillRect(sx, sy + 1, w, 8)
    if (look.mark !== 'none') {
      g.fillStyle = look.accent
      g.fillRect(sx, sy + 4, w, 2)
    }
    if (grade > 0) {
      g.fillStyle = GRADE_BAND[grade]
      g.fillRect(sx, sy + 1, w, 2)
      g.fillRect(sx, sy + 7, w, 2)
    }
  })
}

/**
 * 벽 카드 판의 일곱 자리와 놓인 카드 (요한계시록 방 일곱 교회 카드 판): 자리는 바탕보다 조금 짙은 옅은 칸, 놓인 카드 수만큼
 * 앞자리부터 크림색 카드 (4×6, 아래 2픽셀은 짙은 크림 테). 자리 순서 = 판 순서 — 맞는지는 그림으로 알려 주지 않는다.
 * 카드가 있으면 그 위를 잇는 실 (사도행전 여정 판과 같은 짜임), 다 놓으면(done) 실이 금빛
 */
function drawCardBoard(g: Ctx, first: Tile, placed: number, done: boolean) {
  // 판 안쪽 바탕은 첫 칸 4픽셀부터 40픽셀 (나무 테 안) — 자리 일곱 개를 6픽셀 간격으로 꼭 맞게
  const bx = first.x * TILE + 4
  const by = first.y * TILE
  const n = Math.min(placed, 7)
  for (let i = 0; i < 7; i++) {
    g.fillStyle = '#cfdde6'
    g.fillRect(bx + i * 6, by + 7, 4, 6)
  }
  if (n > 0) {
    g.fillStyle = done ? '#fac839' : '#c7aaa4'
    g.fillRect(bx, by + 5, 6 * (n - 1) + 4, 2)
  }
  for (let i = 0; i < n; i++) {
    g.fillStyle = '#fff7e5'
    g.fillRect(bx + i * 6, by + 7, 4, 4)
    g.fillStyle = '#f3e0b3'
    g.fillRect(bx + i * 6, by + 11, 4, 2)
    g.fillStyle = '#928bb9'
    g.fillRect(bx + i * 6 + 1, by + 5, 2, 2)
  }
}

/**
 * 잠긴 문틈으로 새는 불빛: 문 둘레의 은은한 빛,가운데 문틈과 문지방의 2픽셀 빛줄기, 방바닥에 번지는 빛.
 * 천천히 숨 쉬듯 밝아졌다 옅어진다 (차분한 파스텔 — 창과 같은 따뜻한 노랑)
 */
function drawDoorGlow(g: Ctx, door: Tile, t: number) {
  const px = door.x * TILE
  const py = door.y * TILE
  const breathe = 0.5 + 0.5 * Math.sin(t * 1.3)
  // 문 둘레의 은은한 빛, 오른쪽 방바닥에 계단처럼 옅어지며 번지는 빛 (픽셀 그림답게 네모로)
  glow(g, px + 9, py + 9, 24, 0.3 + 0.1 * breathe, '246, 213, 142')
  g.fillStyle = `rgba(248, 222, 160, ${0.28 + 0.1 * breathe})`
  g.fillRect(px + 16, py + 4, 6, 12)
  g.fillStyle = `rgba(248, 222, 160, ${0.16 + 0.06 * breathe})`
  g.fillRect(px + 22, py + 6, 6, 8)
  // 문틈 (자물쇠 위·아래)과 문지방: 2픽셀 빛줄기
  g.fillStyle = `rgba(248, 226, 170, ${0.75 + 0.2 * breathe})`
  g.fillRect(px + 7, py + 3, 2, 5)
  g.fillRect(px + 7, py + 12, 2, 3)
  g.fillStyle = `rgba(241, 191, 107, ${0.55 + 0.2 * breathe})`
  g.fillRect(px + 3, py + 14, 10, 2)
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
  /** 캔버스 실제 크기가 한 화면(VIEW_W×TILE)의 몇 배인가 — 도트를 정수 배로 크게 그린 뒤 브라우저가 부드럽게 줄인다 */
  scale: number
  /** 카메라 왼쪽 위 (칸) */
  camera: { x: number; y: number }
  /** 방 꾸미기에서 고른 가구가 차지한 칸 (테두리를 그린다 — 계획 17 작업 2) */
  selected: Tile[] | null
  /** 카메라가 기록자 대신 비출 칸 (방 꾸미기에서 고른 방) — 없으면 기록자 */
  look: Tile | null
  draw(game: GameState, t: number, dt: number): void
}

export function createRenderer(g: Ctx, content: GameContent): Renderer {
  g.imageSmoothingEnabled = false
  const steps: { x: number; y: number; t: number }[] = []
  /** 비·눈 발자국이 남는 실제 초 */
  const STEP_SECONDS = 12
  let lastStep = ''
  const renderer: Renderer = {
    zoom: 1,
    scale: 1,
    selected: null,
    look: null,
    camera: { x: 0, y: 0 },
    draw(game, t, dt) {
      const W = VIEW_W * TILE / renderer.zoom
      const H = VIEW_H * TILE / renderer.zoom
      const z = renderer.zoom * renderer.scale
      g.setTransform(z, 0, 0, z, 0, 0)
      g.imageSmoothingEnabled = false
      const day = game.clock.day
      const minute = game.clock.minute
      const season = seasonOf(day)
      const weather = weatherOf(day)
      const wet = isWet(weather)
      const phase = phaseOf(minute)
      const p = game.player
      const here = { x: Math.round(p.x), y: Math.round(p.y) }

      // 카메라: 부드럽게 따라간다
      const focus = renderer.look ?? p
      const target = cameraFor(focus.x, focus.y, renderer.zoom)
      const cam = renderer.camera
      if (dt <= 0 || Math.abs(target.x - cam.x) + Math.abs(target.y - cam.y) > 6) {
        cam.x = target.x
        cam.y = target.y
      } else {
        const k = Math.min(1, dt * 6)
        cam.x += (target.x - cam.x) * k
        cam.y += (target.y - cam.y) * k
      }
      // 카메라는 캔버스 실제 화소 단위로 맞춘다 (정수 배로 키웠으므로 도트는 흐려지지 않고, 움직임은 더 매끄럽다)
      const sc = renderer.scale
      const ox = Math.round(cam.x * TILE * sc) / sc
      const oy = Math.round(cam.y * TILE * sc) / sc

      const outdoors = !isIndoor(here)
      let festOn = false
      const actsGlow = actsDoorGlows(game) && roomAt(here)?.owner === 'library'
      g.save()
      try {
      g.fillStyle = '#362515'
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

      // 비·눈 오는 날 흙길에 남는 발자국 (12초 동안 옅게 사라진다 — 2026-10-05 사용자: 너무 오래·진하게 남았다)
      const stepKey = `${here.x},${here.y}`
      if (stepKey !== lastStep) {
        lastStep = stepKey
        if (wet && MAP[here.y]?.[here.x] === ',') steps.push({ x: here.x, y: here.y, t })
      }
      while (steps.length && (t - steps[0].t > STEP_SECONDS || steps[0].t > t)) steps.shift()
      for (const st of steps) {
        g.fillStyle = `rgba(80, 55, 30, ${0.2 * (1 - (t - st.t) / STEP_SECONDS)})`
        g.fillRect(st.x * TILE + 5, st.y * TILE + 6, 2, 3)
        g.fillRect(st.x * TILE + 9, st.y * TILE + 9, 2, 3)
      }

      // 그날의 날씨가 땅에 남긴 것 (계획 15 작업 2): 눈 쌓임(구운 덮개), 비 온 뒤 물웅덩이, 추운 아침 살얼음, 여름 맑은 날 물빛
      if (weather === 'snow') g.drawImage(snowLayer(), 0, 0)
      else if (puddlesOut(day, minute)) drawPuddles(g, day, weather === 'rain', t)
      if (season === 'summer' && (weather === 'sunny' || weather === 'hot') && minute >= 7 * 60 && minute < 19 * 60) drawLakeGlints(g, t)

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
        for (const t of PLACES.field.tiles) g.fillRect(t.x * TILE, t.y * TILE, TILE, TILE)
      }

      // 넓은 책상: 책상 칸 안에 상판만 넓게 (서는 자리는 덮지 않는다)
      if (PLACES.desk.tiles.length && (game.inv.wideDesk ?? 0) > 0) drawWideDesk(g, PLACES.desk.tiles[0], season)
      // 선반의 두루마리, 책상의 잉크 자국, 등잔 그을음
      const done = totalChapters(game)
      const [shelf] = PLACES.shelf.tiles
      const [desk] = PLACES.desk.tiles
      const [hearth] = PLACES.hearth.tiles
      for (let i = 0; shelf && i < Math.min(12, done); i++) {
        g.fillStyle = i % 2 ? '#f8e6b6' : '#fef1cf'
        g.fillRect(shelf.x * TILE + 3 + (i % 4) * 3, shelf.y * TILE + 1 + Math.floor(i / 4) * 5, 2, 3)
      }
      for (let i = 0; desk && i < Math.min(8, done); i++) {
        g.fillStyle = 'rgba(30, 20, 40, 0.55)'
        g.fillRect(desk.x * TILE + 2 + Math.floor(hash(i, 3, 1) * 11), desk.y * TILE + 5 + Math.floor(hash(i, 4, 1) * 6), 1, 1)
      }
      // 책상이 살아온 흔적 (계획 14 작업 7): 필사한 만큼 책갈피·펜꽂이·종이 묶음·등잔·완성본
      if (desk) drawDeskTraces(g, desk, deskTraces(game))
      // 등잔 그을음: 흔적(등잔 불꽃 자리) 위에 그려 가려지지 않는다
      const soot = Math.min(0.7, (game.flags.lampNights ?? 0) * 0.04)
      if (desk && soot > 0) {
        g.fillStyle = `rgba(30, 25, 20, ${soot})`
        g.fillRect(desk.x * TILE + 12, desk.y * TILE + 3, 2, 2)
      }
      // 그을음 받이 (계획 11 작업 1): 화덕 위의 얇은 쇠판과 그 아래 받침, 모인 그을음 두 점
      if (hearth && (game.flags['unlock:sootCatcher'] ?? 0) > 0) drawSootCatcher(g, hearth)
      // 방의 가구: 깔개 → 길을 막는 가구 → 위에 올린 작은 물건
      const ordered = [...game.room].sort((a, b) => furnitureOrder(a) - furnitureOrder(b) || a.y - b.y)
      for (const f of ordered) drawFurniture(g, f)
      if (renderer.selected) drawSelection(g, renderer.selected)
      // 이야기 뒤 소품 (계획 16 작업 4 · 계획 17): 생활 확장 도트 → 없으면 가구 그림
      drawStoryProps(g, game)
      // 내 작은 장날 좌판 (계획 16 작업 19): 영업 중일 때만
      drawStall(g, game)
      // 주민이 함께 바꾸는 마을 (계획 16 작업 20): 짓는 중이거나 완성된 공동 시설 — 같은 자리, 그림만
      drawVillage(g, game)
      // 화덕 불
      if (hearth) flame(g, hearth.x * TILE + 8, hearth.y * TILE + 14, t)
      // 행사 모닥불
      const fest = festivalOf(day)
      // 복음서 방 잔치 저녁에는 비가 와도 모닥불을 피운다
      // 결혼 잔치 날 저녁도 모닥불 (계획 6)
      festOn = (((!!fest && !wet) || feastToday(game) || weddingToday(game)) && minute >= FESTIVAL_FROM && minute < FESTIVAL_TO) || weddingEvening(game)
      if (festOn) {
        g.fillStyle = C.woodDark
        g.fillRect(FIRE.x * TILE + 3, FIRE.y * TILE + 12, 10, 3)
        flame(g, FIRE.x * TILE + 8, FIRE.y * TILE + 13, t, true)
      }
      // 행사 소품 (계획 17 작업 4·5): 바닥에 까는 것은 여기서, 서 있는 것은 아래 사람들과 줄 순서로
      const eventProps = eventPropsNow(game)
      for (const ep of eventProps) if (ep.ground) drawEventProp(g, ep)

      // 서고 안 복음서 선반: 네 칸 — 처음엔 빈 칸이 또렷이, 꽂은 책은 책마다 다른 책등(제본 모습)과 등급 띠 (계획 14 작업 4)
      if (roomAt(here)?.owner === 'library') {
        const [first] = PLACES.library.tiles
        const BAND = GRADE_BAND
        GOSPELS.forEach((b, i) => {
          const sx = first.x * TILE + 4 + i * 11
          const sy = first.y * TILE + 2
          if (game.shelved[b] === undefined) drawEmptySlot(g, sx, sy)
          else drawSpine(g, sx, sy, b, game)
        })
        // 양옆 책장: 복음서 다음에 꽂은 책(사도행전·편지·요한계시록)마다 책등 둘씩 (왼쪽·오른쪽 짝) — 처음엔 텅 빈 책장이
        // 권이 늘수록 찬다. 책마다 다른 색(제본 모습): 왼쪽은 책등 색, 오른쪽 짝은 장식 색. 은박·금박이면 위 2픽셀 띠
        for (const sp of sideShelfSpines(game.shelved)) {
          const tx = sp.side === 'left' ? first.x - 4 + sp.tile : first.x + 4 + sp.tile
          const x = tx * TILE + 2 + sp.col * 3
          const y = first.y * TILE + (sp.row === 0 ? 5 : 10)
          const look = spineLook(sp.book, game.bound?.[sp.book])
          g.fillStyle = sp.side === 'left' || look.mark === 'none' ? look.color : look.accent
          g.fillRect(x, y, 2, 4)
          if (sp.grade > 0) {
            g.fillStyle = BAND[sp.grade]
            g.fillRect(x, y, 2, 2)
          }
        }
        // 잔치 다음 날부터: 사도행전 방 문으로 새는 따뜻한 불빛
        if (actsGlow) drawDoorGlow(g, LOCKED_DOORS[0], t)
      }
      // 사도행전 방: 선반의 사도행전 책등, 벽 여정 판의 실과 카드 (모은 만큼, 다 이으면 실이 금빛)
      if (roomAt(here) === ACTS_ROOM) {
        const mid = PLACES.actsShelf.tiles[1]
        if (game.shelved.ac === undefined) drawEmptySlot(g, mid.x * TILE + 4, mid.y * TILE + 2)
        else drawSpine(g, mid.x * TILE + 4, mid.y * TILE + 2, 'ac', game)
        const [b0] = PLACES.journeyBoard.tiles
        const bx = b0.x * TILE + 4
        const by = b0.y * TILE
        const all = content.journey?.length ?? 0
        const shown = all ? Math.ceil((game.journey.length / all) * 7) : 0
        if (shown > 0) {
          g.fillStyle = (game.flags.actsShip ?? 0) > 0 ? '#fac839' : '#dd9988'
          g.fillRect(bx, by + 6, 40, 2)
        }
        for (let i = 0; i < shown; i++) {
          g.fillStyle = '#fff7e5'
          g.fillRect(bx + i * 6, by + 8, 4, 4)
          g.fillStyle = '#84a0ba'
          g.fillRect(bx + i * 6 + 1, by + 6, 2, 2)
        }
      }
      // 요한계시록 방: 한 권 선반의 요한계시록 책등, 벽 일곱 교회 카드 판의 자리·카드·실
      if (roomAt(here) === REV_ROOM) {
        const mid = PLACES.revShelf.tiles[1]
        if (game.shelved.rev === undefined) drawEmptySlot(g, mid.x * TILE + 4, mid.y * TILE + 2)
        else drawSpine(g, mid.x * TILE + 4, mid.y * TILE + 2, 'rev', game)
        drawCardBoard(g, PLACES.churchBoard.tiles[0], game.churches.length, (game.flags.churchesDone ?? 0) > 0)
      }
      // 편지 방: 편지 선반의 얇은 책등 (방 표 순서)
      if (roomAt(here) === LETTERS_ROOM) drawLetterSpines(g, game, 'romPhm')
      if (roomAt(here) === HEB_JUD_ROOM) drawLetterSpines(g, game, 'hebJud')

      // 마음이 쌓여 마을에 생긴 것들
      drawDecor(g, game, weather, t, phase === 'morning' || phase === 'day')
      // 아직 열리지 않은 구역·이사 오기 전 이웃의 집: 덤불로 덮는다 (물만 보인다)
      coverLocked(g, game, season)
      // 추운 아침 살얼음은 덮개 뒤에: 아직 안 열린 잔교는 물로 덮이므로 그 칸도 얼린다 (빈틈이 생기지 않게)
      if (icyMorning(day, minute)) drawShoreIce(g, minute, lockedTiles(shelvedCount(game)))
      // 정자 지붕의 눈 (정자는 덧그림이라 지도 덮개 위에 따로), 굴뚝 연기 (닫힌 집은 빼고)
      if (weather === 'snow') drawPavilionSnow(g)
      const smoke = chimneySmoke(day, minute)
      if (smoke !== 'none') drawChimneySmoke(g, game, smoke, weather === 'wind', t)

      type Item = { y: number; paint: () => void }
      const items: Item[] = []
      for (const ep of eventProps) if (!ep.ground) items.push({ y: eventPropSortY(ep), paint: () => drawEventProp(g, ep) })

      // 안 읽은 편지 (2026-09-30 사용자): 문 앞 편지 바구니 위에 봉투 말풍선
      if (letterWaiting(game) || mailboxHasPost(game)) {
        const bk = PLACES.basket.tiles[0]
        items.push({ y: bk.y + 0.4, paint: () => emote(g, 'letter', bk.x * TILE + 8, bk.y * TILE - 2 - Math.round(Math.sin(t * 3))) })
      }

      // 양 우리의 양 (우리를 넓히면 둘 더)
      ;[
        [4, 28],
        [6, 29],
        [5, 27.5],
        [4, 29.5],
        [6.5, 27.5],
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
              // 제 집 앉는 자리에서는 앉은 모습 (계획 17 작업 3) — 숨 쉬는 박자는 앉기 동작에 들어 있다
              paint: () => {
                const { who, extra } = neighborLook(def, growth, game.looks?.[def.id])
                const stand = person(who, 'down', 0, false, 'stand', season, extra)
                drawUse(g, useFrameCanvas(who, 'down', 'sit', t + def.id.length, 1, isBlinking(t + def.id.length), season, extra), stand, home.sit.x, home.sit.y, true)
              },
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
            const spr = neighborPerson(def, facing, moving ? walkFrame(n.walkTime) : 0, isBlinking(t + offset), season, growth, game.looks?.[def.id])
            // 행사 동작 (계획 17 작업 4·5): 결혼식의 짝, 잔치·모임 자리의 이웃 — 지금 외형으로
            const em = moving ? null : npcEventMotion(game, def.id, t)
            if (em) {
              const { who, extra } = neighborLook(def, growth, game.looks?.[def.id])
              drawEventMotion(g, who, em, n.x, n.y, isBlinking(t + offset), season, extra)
            } else drawSprite(g, spr, n.x, n.y, moving ? 0 : breathOffset(t + offset))
            // 이야기를 건넬 이웃, 기다리던 이야기(이벤트)를 품은 이웃은 머리 위에 말풍선 — 말을 걸면 열린다
            const bubbleY = n.y * TILE + TILE - spr.height - 2 - Math.round(Math.sin(t * 3))
            if (game.offers[def.id] || storyWaiting(game, def.id)) emote(g, 'talk', n.x * TILE + 8, bubbleY)
            else if (!moving) {
              // 일과 자리에서 하는 일 (계획 6b)
              const r = routineOf(game, def.id)
              if (r?.doing && Math.round(n.x) === r.at.x && Math.round(n.y) === r.at.y) doingIcon(g, r.doing, n.x * TILE + 8, n.y * TILE + TILE - spr.height - 2)
            }
          },
        })
        // 아이가 데려간 동물은 아이 곁에
        if (def.id === 'child' && game.flags.childPet) {
          const kind = game.flags.childPet === 1 ? 'cat' : 'dog'
          items.push({ y: n.y + 0.1, paint: () => drawSprite(g, animal(kind, day - (game.companion?.since ?? day) >= 10 ? 'adult' : 'baby', 'left'), n.x + 0.7, n.y + 0.1) })
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

      // 우리 아이 (계획 12): 아기는 요람, 걷는 아이는 곁을 따라다니고, 돕는 아이는 때마다 마을 곳곳에
      const kid = game.child
      // 마을을 떠난 어른 아이는 그리지 않는다
      if (kid && childMode(kid, day) !== 'away') {
        const st = childStage(kid, day)
        const mode = childMode(kid, day)
        const kidRows = () => recolor(spriteRows('child', 'down', { frame: 0, blink: isBlinking(t + 1.3), growth: 2 }), kid.look === 'boy' ? { z: 'E', Z: 'M' } : { z: 'V', Z: 'X' })
        // 걷는 아이는 아기 걸음 그림, 돕는 아이는 물 긷는 아이 그림에 옷 색만 바꿔서
        // 옷장에서 모습을 입힌 아이는 그 모습 그대로 (돕는 아이는 키가 작게, 어른은 그대로)
        const dressed = game.looks?.child ? withLookDefaults({ ...game.looks.child, skin: game.avatar?.skin ?? game.looks.child.skin }) : null
        const drawKid = (x: number, y: number, bob: number) =>
          st === 'toddler'
            ? drawSprite(g, paint('baby/walk', BABY.walk, SMALL_PALETTE), x, y, bob)
            : dressed
              ? drawSprite(g, person('writer', 'down', 0, isBlinking(t + 1.3), 'stand', season, { avatar: dressed, look: dressed.look, short: st === 'adult' ? undefined : 1 }), x, y, bob)
              : drawSprite(g, paint(`kid/${kid.look}/${isBlinking(t + 1.3)}`, kidRows(), PALETTE), x, y, bob)
        if (childAtSchool(game)) {
          // 배움터에 맡긴 날: 배움 탁자 곁에 앉아 있다
          const at = SCHOOL_SEAT
          items.push({ y: at.y, paint: () => drawKid(at.x, at.y, 0) })
        } else if (mode === 'cradle') {
          const c = childTile(game)!
          items.push({
            y: c.y,
            paint: () => {
              drawSprite(g, paint('baby/baby', BABY.baby, SMALL_PALETTE), c.x, c.y, 5 + (Math.floor(t * 1.5) % 2))
            },
          })
        } else if (mode === 'follow') {
          // 기록자 뒤에 한 걸음 떨어져 (보는 쪽의 반대편)
          const back = { left: [0.7, 0.1], right: [-0.7, 0.1], up: [0, 0.6], down: [-0.6, -0.1] }[p.facing]
          const kx = p.x + back[0]
          const ky = p.y + back[1]
          items.push({ y: ky, paint: () => drawKid(kx, ky, p.path.length ? Math.floor(t * 8) % 2 : 0) })
        } else {
          const at = childTile(game)!
          items.push({ y: at.y, paint: () => drawKid(at.x, at.y, st === 'toddler' ? 0 : breathOffset(t + 1.3)) })
        }
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
            if (comp.motion) {
              const action = comp.motion.action === 'play' ? 'play' : 'wait'
              const frame = Math.floor(t * 6) % 4
              drawSprite(g, paint(`pet/${comp.kind}/${comp.facing}/${action}/${frame}/${isGrown(comp,day)}`, petMotionRows(comp.kind, comp.facing, action, frame, !isGrown(comp,day)), ANIMAL_PALETTE[comp.kind]), comp.x, comp.y)
            } else drawSprite(g, animal(comp.kind, form, comp.facing === 'left' ? 'left' : 'right'), comp.x, comp.y, still || sleeping ? 0 : Math.floor(comp.walkTime * 8) % 2)
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
      // 가구 쓰는 동작 중이면 (계획 17 작업 3) 그 동작 그림을 지금 외형으로 — 앉는 자리가 있으면 그 칸 위에
      const act = game.act
      const playerEm = playerEventMotion(game, t)
      if (playerEm) {
        items.push({ y: p.y, paint: () => drawEventMotion(g, 'writer', playerEm, p.x, p.y, blink, season, { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined }) })
      } else if (act) {
        const ay = act.at ? act.at.y + 0.01 : p.y
        items.push({ y: ay, paint: () => drawPlayerAct(g, act, p, isBlinking(t), season, { inky: done > 0, look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined }) })
      } else items.push({
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
      for (const b of flies) items.push({ y: b.y + 0.5, paint: () => g.drawImage(paint(`bf/${b.frame}/${b.hue}`, BUTTERFLY[b.frame], { ...SMALL_PALETTE, o: b.hue ? '#99c2ea' : '#e79b77', O: b.hue ? '#719ece' : '#eed584' }), Math.round(b.x * TILE), Math.round(b.y * TILE)) })

      items.sort((a, b) => a.y - b.y).forEach((i) => i.paint())
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
          const [desk] = PLACES.desk.tiles
          const [hearth] = PLACES.hearth.tiles
          if (desk && game.lampLitDay === day) glow(g, sx(desk.x * TILE + 13), sy(desk.y * TILE + 4), 34, dark * 0.9)
          if (hearth) glow(g, sx(hearth.x * TILE + 8), sy(hearth.y * TILE + 12), 22, dark * 0.6)
          if (festOn) glow(g, sx(FIRE.x * TILE + 8), sy(FIRE.y * TILE + 8), 48, dark)
          if (actsGlow) glow(g, sx(LOCKED_DOORS[0].x * TILE + 10), sy(LOCKED_DOORS[0].y * TILE + 9), 26, dark * 0.7)
          // 집집마다 창에 불빛
          for (const [x, y] of housesNow().map((h) => [h.doorX, h.y1])) glow(g, sx(x * TILE + 8), sy(y * TILE + 4), 14, dark * 0.5)
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
    { x: 12, y: 3 },
    { x: 3, y: 9 },
    { x: 8, y: 24 },
  ]
  return centers.map((c, i) => ({
    x: c.x + Math.cos(t * 0.7 + i * 2) * 1.6,
    y: c.y + Math.sin(t * 1.1 + i) * 0.9 - 0.5,
    frame: (Math.abs(Math.floor(t * 6 + i)) % 2) as 0 | 1,
    hue: (i % 2) as 0 | 1,
  }))
}

// ── 여행 주사위 판 (새 장면): 마을과 같은 16픽셀 칸·같은 그림으로 여행지 동네를 짓고, 둘레 길 위 돌판에 칸 표시를 새긴다 ──

/** 돌판에 새기는 칸 표시 (8×8, 색보다 모양으로 구분 — k 먹, w 흰 종이, c 칸 색) */
const STONE_GLYPH: Record<TripCell, readonly string[]> = {
  start: ['.k......', '.kccc...', '.kcccc..', '.kccc...', '.k......', '.k......', '.k......', 'kkk.....'],
  plain: ['........', '........', '........', '........', '........', '........', '........', '........'],
  rest: ['...kk...', '...kk...', '..kcck..', '.kcccck.', '.kccwck.', '.kcccck.', '..kkkk..', '........'], // 샘물 한 방울
  item: ['........', '.cc..cc.', 'ccc..ccc', '.cckkcc.', '...kk...', '...kk...', '..kkkk..', '........'],
  star: ['...kk...', '...kk...', 'kkkkkkkk', '.kkkkkk.', '..kkkk..', '.kk..kk.', 'kk....kk', '........'],
  event: ['..kkkk..', '.kk..kk.', '.....kk.', '....kk..', '...kk...', '........', '...kk...', '........'],
  chest: ['........', '.kkkkkk.', 'kcccccck', 'kkkkkkkk', 'kccwwcck', 'kcccccck', 'kkkkkkkk', '........'],
  jump: ['........', 'k...k...', 'kk..kk..', 'kkk.kkk.', 'kkk.kkk.', 'kk..kk..', 'k...k...', '........'],
  greet: ['........', '.kk..kk.', 'kcckkcck', 'kcccccck', '.kcccck.', '..kcck..', '...kk...', '........'],
  kid: ['...kk...', '..kwwk..', '...kk...', '.kkkkkk.', '...kk...', '..k..k..', '.k....k.', '........'],
}
/** 돌판 표식의 색 (파스텔 — 모양이 먼저, 색은 작은 원으로만) */
const STONE_TINT: Record<TripCell, string> = {
  start: '#e3c9a0',
  plain: '#e6dccb',
  rest: '#a9d8ec',
  item: '#b8dea4',
  star: '#f5dc92',
  event: '#f4b6b0',
  chest: '#d3c0ee',
  jump: '#f7cfa6',
  greet: '#f6c2d6',
  kid: '#fbe3a8',
}

function tripMapFor(dest: 'harbor' | 'hillTown', season: Season): HTMLCanvasElement {
  const key = `trip/${dest}/${season}`
  let c = mapCache.get(key)
  if (c) return c
  const layout = tripLayout(dest)
  c = document.createElement('canvas')
  c.width = TRIP_W * TILE
  c.height = TRIP_H * TILE
  const g = c.getContext('2d')!
  const at = (x: number, y: number) => layout.map[y]?.[x] ?? '.'
  const houseOf = (x: number, y: number) => layout.houses.find((h) => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1)
  for (let y = 0; y < TRIP_H; y++)
    for (let x = 0; x < TRIP_W; x++) {
      const ch = at(x, y)
      const px = x * TILE
      const py = y * TILE
      const f = (color: string, dx: number, dy: number, w: number, h: number) => {
        g.fillStyle = color
        g.fillRect(px + dx, py + dy, w, h)
      }
      // 판석 길: 따뜻한 크림빛 돌, 줄눈은 옅게 (마을 흙길과 다른 이 동네의 길)
      if (ch === '@') {
        f('#efe4cf', 0, 0, 16, 16)
        f('#dccdb1', 0, (x + y) % 2 ? 7 : 8, 16, 1)
        f('#dccdb1', (x * 5 + y * 3) % 2 ? 5 : 10, 0, 1, 8)
        f('#dccdb1', (x * 3 + y) % 2 ? 11 : 3, 8, 1, 8)
        f('#f8f0e0', 1, 1, 3, 1)
        continue
      }
      if (ch === 'c' || ch === 'F') {
        // 벽돌 줄눈은 칸 안에서만 (옆 칸 잔디로 삐져나가지 않게)
        f('#f3e6c8', 0, 0, 16, 16)
        f('#e3d1a9', 0, 7, 16, 1)
        f('#e3d1a9', 0, 15, 16, 1)
        f('#e3d1a9', 7, 0, 1, 7)
        f('#e3d1a9', 3, 8, 1, 7)
        f('#e3d1a9', 11, 8, 1, 7)
        continue
      }
      const h = houseOf(x, y)
      drawGround(g, h || '^!A'.includes(ch) ? '.' : ch, x, y, season, (xx, yy) => {
        const n = at(xx, yy)
        return n === '@' || n === 'c' || n === 'F' ? ',' : n
      })
      if (h) {
        if (ch === '#' || ch === 'D') houseWallTile(g, x, y, ch, h.id, h)
        continue
      }
      switch (ch) {
        case '^':
          // 꽃화단: 낮은 크림빛 돌 테두리(화단 바깥쪽에만) 안에 흙, 그 위에 줄 맞춰 심은 꽃 넷 (꽃잎·가운데·줄기·잎)
          {
            const edge = '#efe4cf'
            const edgeDark = '#d8c7a6'
            f('#a8805c', 0, 0, 16, 16)
            f('#94704f', 0, 7, 16, 1)
            if (at(x, y - 1) !== '^') f(edge, 0, 0, 16, 2)
            if (at(x, y + 1) !== '^') {
              f(edge, 0, 13, 16, 3)
              f(edgeDark, 0, 15, 16, 1)
            }
            if (at(x - 1, y) !== '^') f(edge, 0, 0, 2, 16)
            if (at(x + 1, y) !== '^') f(edge, 14, 0, 2, 16)
            const petals = ['#f7b8c8', '#fde08e', '#ffffff', '#cdb8f0']
            for (const [bx, by, k] of [[3, 3, 0], [9, 3, 1], [3, 8, 2], [9, 8, 3]]) {
              const pc = petals[(k + x + y) % petals.length]
              f('#7fb86a', bx + 1, by + 3, 1, 3)
              f('#7fb86a', bx + 2, by + 4, 2, 1)
              f(pc, bx + 1, by, 1, 3)
              f(pc, bx, by + 1, 3, 1)
              f('#f2a33a', bx + 1, by + 1, 1, 1)
            }
          }
          break
        case '!':
          // 등불 기둥: 나무 기둥, 살구빛 초롱
          f('rgba(90,60,30,0.15)', 5, 14, 6, 2)
          f('#a07a58', 7, 4, 2, 11)
          f('#f3a58f', 5, 1, 6, 5)
          f('#ffe7a8', 6, 2, 4, 3)
          break
        case 'A':
          // 입구 아치 기둥
          f('#a07a58', 5, 0, 6, 16)
          f('#c49c74', 6, 0, 2, 16)
          f('#86634a', 4, 0, 8, 2)
          break
        default:
          if (ch !== '.') drawObject(g, ch, x, y, season)
      }
    }
  for (const h of layout.houses) drawRoof(g, h.x0, h.y0, h.x1, h.y1 - 2, (HOUSE_STYLES[h.id] ?? PLAIN_STYLE).roof)
  // 분수 (두 칸×두 칸): 돌바닥을 다 깐 뒤에 왼쪽 위 칸에서 한 번에
  for (let y = 0; y < TRIP_H; y++)
    for (let x = 0; x < TRIP_W; x++) {
      if (at(x, y) !== 'F' || at(x - 1, y) === 'F' || at(x, y - 1) === 'F') continue
      const f = (color: string, dx: number, dy: number, w: number, hh: number) => {
        g.fillStyle = color
        g.fillRect(x * TILE + dx, y * TILE + dy, w, hh)
      }
      f('rgba(90,60,30,0.15)', 1, 28, 30, 4)
      f('#cfc4b0', 1, 4, 30, 26)
      f('#eee6d6', 2, 3, 28, 26)
      f('#a9dbe8', 5, 6, 22, 19)
      f('#d6f0f6', 7, 8, 8, 2)
      f('#d6f0f6', 17, 18, 6, 1)
      f('#eee6d6', 13, 10, 6, 9)
      f('#d6f0f6', 15, 4, 2, 8)
      f('#ffffff', 15, 3, 2, 2)
    }
  // 입구 아치의 깃발 줄 (두 기둥 사이, 파스텔 깃발)
  const arch = layout.map.findIndex((row) => row.includes('A'))
  if (arch >= 0) {
    const xs = [...layout.map[arch]].flatMap((ch, x) => (ch === 'A' ? [x] : []))
    const ax0 = xs[0] * TILE + 8
    const ax1 = xs[xs.length - 1] * TILE + 8
    const ay = arch * TILE + 1
    g.fillStyle = '#86634a'
    g.fillRect(ax0, ay, ax1 - ax0, 2)
    const flags = ['#f4b6b0', '#fde4a6', '#a9c4ec', '#b8dea4', '#d3c0ee']
    for (let fx = ax0 + 2, k = 0; fx < ax1 - 4; fx += 6, k++) {
      g.fillStyle = flags[k % flags.length]
      g.fillRect(fx, ay + 2, 5, 3)
      g.fillRect(fx + 1, ay + 5, 3, 2)
      g.fillRect(fx + 2, ay + 7, 1, 1)
    }
  }
  // 보드 칸: 길에 놓인 표식 돌 — 모서리가 둥근 얇은 판석, 가운데 작은 색 원과 새긴 문양 (버튼처럼 두껍지 않게)
  BOARD.forEach((cell, i) => {
    const t = stoneTile(i)
    const px = t.x * TILE
    const py = t.y * TILE
    const f = (color: string, dx: number, dy: number, w: number, hh: number) => {
      g.fillStyle = color
      g.fillRect(px + dx, py + dy, w, hh)
    }
    // 판석 (모서리를 깎아 둥글게), 아래쪽에만 얇은 그늘
    f('#e2d6bf', 3, 2, 26, 28)
    f('#e2d6bf', 2, 3, 28, 26)
    f('#f7efdf', 4, 3, 24, 25)
    f('#f7efdf', 3, 4, 26, 23)
    f('rgba(120,90,50,0.16)', 4, 28, 24, 2)
    // 작은 색 원 (표식 색은 보조)
    f(STONE_TINT[cell], 9, 7, 14, 16)
    f(STONE_TINT[cell], 7, 9, 18, 12)
    STONE_GLYPH[cell].forEach((row, yy) =>
      [...row].forEach((chh, xx) => {
        if (chh === '.') return
        f(chh === 'k' ? '#6a5040' : chh === 'w' ? '#ffffff' : '#fffaf0', 8 + xx * 2, 7 + yy * 2, 2, 2)
      }),
    )
  })
  mapCache.set(key, c)
  return c
}

/** 여행 판에 서 있는 사람 (기록자·아이) */
export interface TripActor {
  x: number
  y: number
  facing: Facing
  walking: boolean
}

/** 여행 판 한 장면: 동네 그림 → 사람(발 아래 순서대로). 카메라는 판 대부분이 보이게, 가장자리에 가까울 때만 조금 움직인다 */
/** 여행 판의 사람은 두 배 크기로 (큼직한 돌판에 맞게, 도트는 정수 배라 또렷하다) */
function drawBig(g: Ctx, c: HTMLCanvasElement, wx: number, wy: number, dy = 0) {
  const k = 2
  const w = c.width * k
  const h = c.height * k
  const px = Math.round(wx * TILE + (TILE - w) / 2)
  const py = Math.round(wy * TILE + TILE - 1 - h - dy * k)
  g.fillStyle = 'rgba(90,60,30,0.18)'
  g.fillRect(px + 3, Math.round(wy * TILE) + 13, w - 6, 3)
  g.drawImage(c, px, py, w, h)
}

export function createTripRenderer(g: Ctx) {
  const cam = { x: -1, y: -1 }
  /** 화면에 보이는 칸 수 (폭은 마을과 같은 16칸 — 같은 도트 크기, 높이는 화면 비율대로) */
  const view = { scale: 1, w: VIEW_W, h: VIEW_H }
  return {
    view,
    cam,
    draw(dest: 'harbor' | 'hillTown', game: GameState, me: TripActor, kid: TripActor | null, t: number, dt: number) {
      const season = seasonOf(game.clock.day)
      const s = view.scale
      g.setTransform(s, 0, 0, s, 0, 0)
      g.imageSmoothingEnabled = false
      // 카메라: 판 가운데를 기본으로, 기록자가 화면 가장자리 3칸 안쪽에 들어가면 그만큼만 부드럽게
      const VW = view.w
      const VH = view.h
      const maxX = Math.max(0, TRIP_W - VW)
      const maxY = Math.max(0, TRIP_H - VH)
      if (cam.x < 0) {
        cam.x = Math.min(maxX, Math.max(0, me.x + 0.5 - VW / 2))
        cam.y = Math.min(maxY, Math.max(0, me.y + 0.5 - VH / 2))
      }
      const margin = 4
      let tx = cam.x
      let ty = cam.y
      if (me.x < cam.x + margin) tx = me.x - margin
      if (me.x > cam.x + VW - 1 - margin) tx = me.x - (VW - 1 - margin)
      if (me.y < cam.y + margin) ty = me.y - margin
      if (me.y > cam.y + VH - 1 - margin) ty = me.y - (VH - 1 - margin)
      tx = Math.min(maxX, Math.max(0, tx))
      ty = Math.min(maxY, Math.max(0, ty))
      const k = Math.min(1, dt * 2.5)
      cam.x += (tx - cam.x) * k
      cam.y += (ty - cam.y) * k
      const ox = Math.round((VW > TRIP_W ? -(VW - TRIP_W) / 2 : cam.x) * TILE * s) / s
      const oy = Math.round((VH > TRIP_H ? -(VH - TRIP_H) / 2 : cam.y) * TILE * s) / s
      g.fillStyle = '#cfe7b8'
      g.fillRect(0, 0, VW * TILE, VH * TILE)
      g.save()
      g.translate(-ox, -oy)
      g.drawImage(tripMapFor(dest, season), 0, 0)
      const items: { y: number; paint: () => void }[] = []
      const frameOf = (a: TripActor) => (a.walking ? walkFrame(t * 1.6) : 0)
      items.push({
        y: me.y,
        paint: () => {
          const spr = person('writer', me.facing, frameOf(me), isBlinking(t), 'stand', season, { look: game.avatar?.look, avatar: game.avatar ? withLookDefaults(game.avatar) : undefined })
          drawBig(g, spr, me.x, me.y, me.walking ? 0 : breathOffset(t))
        },
      })
      const child = game.child
      if (kid && child) {
        const grown = childStage(child, game.clock.day) !== 'toddler'
        items.push({
          y: kid.y,
          paint: () => {
            if (!grown) drawBig(g, paint('baby/walk', BABY.walk, SMALL_PALETTE), kid.x, kid.y, kid.walking ? Math.floor(t * 8) % 2 : 0)
            else {
              const rows = recolor(spriteRows('child', kid.facing, { frame: frameOf(kid), blink: isBlinking(t + 1.3), growth: 2 }), child.look === 'boy' ? { z: 'E', Z: 'M' } : { z: 'V', Z: 'X' })
              drawBig(g, paint(`kid/${child.look}/${kid.facing}/${frameOf(kid)}/${isBlinking(t + 1.3)}`, rows, PALETTE), kid.x, kid.y, kid.walking ? 0 : breathOffset(t + 1.3))
            }
          },
        })
      }
      items.sort((a, b) => a.y - b.y).forEach((it) => it.paint())
      g.restore()
    },
  }
}
