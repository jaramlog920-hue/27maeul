// 마음이 쌓여 마을에 생긴 것들 (6번 A·C). 모두 그림일 뿐 길을 막지 않는다.
import { unlocked } from '../engine/bonds'
import type { GameState } from '../engine/game'
import { GARDEN_TILES, isRipe } from '../engine/garden'
import { TILE } from '../engine/world'
import type { Tile, Weather } from '../engine/types'

type Ctx = CanvasRenderingContext2D

const WOOD = '#94704f'
const WOOD_DARK = '#745336'
const FLOWERS = ['#e29caa', '#d8c587', '#ffffff', '#b494d6']

function px(g: Ctx, x: number, y: number, dx: number, dy: number, w: number, h: number, c: string) {
  g.fillStyle = c
  g.fillRect(x * TILE + dx, y * TILE + dy, w, h)
}

function bench(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 1, 11, 15, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 2, 9, 2, 5, WOOD_DARK)
  px(g, t.x, t.y, 12, 9, 2, 5, WOOD_DARK)
  px(g, t.x, t.y, 1, 7, 14, 3, WOOD)
}

function flowers(g: Ctx, t: Tile, seed: number) {
  for (let i = 0; i < 3; i++) px(g, t.x, t.y, 2 + ((seed * 7 + i * 5) % 11), 3 + ((seed * 3 + i * 4) % 10), 2, 2, FLOWERS[(seed + i) % 4])
}

function awning(g: Ctx, t: Tile, w: number, a: string, b: string) {
  for (let i = 0; i < w * 4; i++) px(g, t.x, t.y, i * 4, -4, 4, 6, i % 2 ? b : a)
  px(g, t.x, t.y, 0, -4, 1, 20, WOOD_DARK)
  px(g, t.x, t.y, w * 16 - 1, -4, 1, 20, WOOD_DARK)
}

function hive(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 3, 12, 11, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 4, 5, 8, 9, '#bb9e68')
  px(g, t.x, t.y, 4, 7, 8, 1, '#907243')
  px(g, t.x, t.y, 4, 10, 8, 1, '#907243')
  px(g, t.x, t.y, 7, 12, 2, 2, '#3b2a20')
}

function tree(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 3, 13, 11, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 7, 9, 3, 6, '#694a30')
  px(g, t.x, t.y, 2, 2, 12, 9, '#56733f')
  px(g, t.x, t.y, 3, 3, 9, 6, '#6f8f5a')
}

const onGardenPlot = (t: Tile) => GARDEN_TILES.some((p) => p.x === t.x && p.y === t.y)

export const LANTERNS: readonly Tile[] = [
  { x: 5, y: 9 },
  { x: 10, y: 9 },
  { x: 23, y: 11 },
  { x: 18, y: 13 },
  { x: 30, y: 13 },
  { x: 18, y: 21 },
  { x: 30, y: 21 },
  { x: 23, y: 31 },
]

/** 여정을 다 이은 다음 날부터 나루(24열 =) 왼쪽 물 위에 머무는 큰 배의 왼쪽 위 칸 (세 칸 폭) */
export const SHIP_AT: Tile = { x: 21, y: 34 }

/**
 * 큰 배: 차분한 나뭇빛 선체와 잿빛 파랑 띠, 크림 돛 하나, 둥근 창 셋(가운데 둔 대칭), 나루에 맨 밧줄.
 * 선은 모두 2픽셀 이상 (화면이 늘어나도 일렁이지 않게), 물결에 1픽셀씩 천천히 오르내린다
 */
function ship(g: Ctx, t: number) {
  const bob = Math.round(Math.sin(t * 1.2))
  const s = (dx: number, dy: number, w: number, h: number, c: string) => px(g, SHIP_AT.x, SHIP_AT.y, dx, dy + bob, w, h, c)
  // 물 그림자와 물결
  px(g, SHIP_AT.x, SHIP_AT.y, 4, 28, 40, 2, 'rgba(60, 90, 100, 0.2)')
  px(g, SHIP_AT.x, SHIP_AT.y, 0, 28, 4, 2, '#bddbcc')
  px(g, SHIP_AT.x, SHIP_AT.y, 44, 28, 4, 2, '#bddbcc')
  // 돛대와 활대, 돛 (돛대는 돛 위로만 보인다)
  s(23, -14, 2, 32, '#82684f')
  s(25, -14, 6, 2, '#a3b4c3')
  s(11, -10, 26, 2, '#82684f')
  s(12, -8, 24, 20, '#f1e6cf')
  s(12, 10, 24, 2, '#d6c194')
  s(12, 1, 24, 2, '#a3b4c3')
  s(12, -8, 2, 20, '#e3d3b0')
  // 난간·선체·띠
  s(4, 14, 40, 2, '#ad845d')
  s(0, 12, 4, 6, '#8e6a4d')
  s(44, 12, 4, 6, '#8e6a4d')
  s(2, 16, 44, 4, '#ad845d')
  s(2, 16, 44, 2, '#8497a8')
  s(4, 20, 40, 4, '#8e6a4d')
  s(7, 24, 34, 3, '#7a5d46')
  for (const dx of [12, 23, 34]) s(dx, 20, 2, 2, '#efe2c6')
  // 나루 말뚝에 맨 밧줄
  s(46, 14, 4, 2, '#c9b89a')
}

/** 마을에 생긴 것들을 그린다 (월드 좌표, 카메라 이동이 이미 적용된 상태) */
export function drawDecor(g: Ctx, game: GameState, weather: Weather, t: number, daytime: boolean) {
  const f = game.flags
  // 잠든 뒤 소개 장면과 함께 바뀌는 단계
  const level = game.flags.villageLevel ?? 0

  // C1 꽃길: 큰길 가장자리
  if (level >= 1)
    [2, 4, 8, 13, 17, 21, 27, 32, 38].forEach((x, i) => {
      const top = { x, y: 9 }
      if (!onGardenPlot(top)) flowers(g, top, i)
      flowers(g, { x, y: 11 }, i + 3)
    })
  // C3 호숫가 쉼터
  if (level >= 3) {
    bench(g, { x: 19, y: 31 })
    bench(g, { x: 21, y: 31 })
    px(g, 30, 34, 2, 5, 12, 5, WOOD) // 작은 배
    px(g, 30, 34, 4, 4, 8, 1, WOOD_DARK)
  }
  // 사도행전 여정을 다 이은 다음 날부터 나루 곁의 큰 배 (flags.actsShip 2)
  if ((f.actsShip ?? 0) >= 2) ship(g, t)
  // C2 베 짜는 이웃의 베틀
  if (level >= 2) {
    const loom = { x: 30, y: 29 }
    px(g, loom.x, loom.y, 2, 3, 2, 11, WOOD_DARK)
    px(g, loom.x, loom.y, 12, 3, 2, 11, WOOD_DARK)
    px(g, loom.x, loom.y, 2, 3, 12, 2, WOOD)
    for (let i = 0; i < 5; i++) px(g, loom.x, loom.y, 4 + i * 2, 5, 1, 7, ['#9f6154', '#cfbf89', '#698eaa', '#7a5d97', '#f1e6cf'][i])
    if (unlocked(f, 'loomAwning')) awning(g, { x: 29, y: 29 }, 2, '#7a5d97', '#f1e6cf')
  }
  // C4 벌통
  if (level >= 4) {
    const hives: Tile[] = [
      { x: 36, y: 30 },
      { x: 37, y: 30 },
    ]
    if (unlocked(f, 'moreHives')) hives.push({ x: 36, y: 31 }, { x: 37, y: 31 })
    hives.forEach((h) => hive(g, h))
    if (daytime && weather !== 'rain' && weather !== 'snow')
      for (let i = 0; i < hives.length * 2; i++) {
        const h = hives[i % hives.length]
        px(g, h.x, h.y, 8 + Math.round(Math.cos(t * 3 + i) * 7), 2 + Math.round(Math.sin(t * 4 + i * 2) * 4), 1, 1, '#2a2020')
      }
  }

  // A 부탁을 들어준 뒤 생긴 것들
  if (unlocked(f, 'bakeryBench')) bench(g, { x: 3, y: 18 })
  if (unlocked(f, 'childGarden')) {
    flowers(g, { x: 33, y: 18 }, 1)
    flowers(g, { x: 34, y: 18 }, 2)
    flowers(g, { x: 38, y: 18 }, 3)
  }
  if (unlocked(f, 'grapeTrellis')) {
    // 반듯하게 다시 세운 포도 시렁: 기둥 둘 + 가로대 + 덩굴
    for (const x of [40, 41, 42]) {
      px(g, x, 9, 2, 2, 2, 12, WOOD)
      px(g, x, 9, 12, 2, 2, 12, WOOD)
      px(g, x, 9, 0, 1, 16, 2, WOOD)
      px(g, x, 9, 1, 0, 14, 3, '#709252')
      px(g, x, 9, 6, 3, 3, 3, '#784d89')
    }
  }
  if (unlocked(f, 'grandpaBench')) bench(g, { x: 37, y: 6 })
  if (unlocked(f, 'stallAwning')) awning(g, { x: 19, y: 14 }, 3, '#698eaa', '#d8c587')
  if (unlocked(f, 'pressHandle')) {
    px(g, 38, 25, 7, -3, 2, 5, WOOD_DARK)
    px(g, 38, 25, 3, -4, 10, 2, WOOD)
  }
  if (unlocked(f, 'oliveGrove')) {
    tree(g, { x: 37, y: 27 })
    tree(g, { x: 41, y: 26 })
  }
  if (unlocked(f, 'bigBellows')) {
    // 대장간 지붕
    for (let i = 0; i < 12; i++) px(g, 33, 24, i * 4 - 8, 1, 4, 4, i % 2 ? '#81483d' : '#9f6154')
  }
  if (unlocked(f, 'lanterns'))
    for (const l of LANTERNS) {
      px(g, l.x, l.y, 7, 2, 2, 12, WOOD_DARK)
      px(g, l.x, l.y, 5, 0, 6, 4, daytime ? '#cfbf89' : '#d8c587')
    }
  // 바람 부는 날·맑은 날, 언덕 위에 연
  if (unlocked(f, 'kite') && daytime && (weather === 'wind' || weather === 'sunny')) {
    // 언덕 벤치 곁(15,12) 풀밭에서 띄운다
    const kx = 15 * TILE + 8 + Math.round(Math.sin(t * 0.8) * 10)
    const ky = 12 * TILE + 4 - 48 + Math.round(Math.cos(t * 1.1) * 3)
    g.strokeStyle = 'rgba(80,60,40,0.6)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(15 * TILE + 8, 12 * TILE + 4)
    g.lineTo(kx, ky + 6)
    g.stroke()
    g.fillStyle = '#be6e7c'
    g.fillRect(kx - 3, ky, 6, 6)
    g.fillStyle = '#d8c587'
    g.fillRect(kx - 1, ky + 2, 2, 2)
  }

  // 텃밭 작물: 자란 만큼 키가 크고, 다 자라면 열매 색
  for (const [k, p] of Object.entries(game.garden ?? {})) {
    const [x, y] = k.split(',').map(Number)
    const ripe = isRipe(p)
    const hgt = 3 + Math.min(p.grown, 4) * 2
    px(g, x, y, 7, 13 - hgt, 2, hgt, '#6d8747')
    if (p.grown >= 1) px(g, x, y, 5, 13 - hgt + 2, 6, 2, '#7aa84f')
    if (ripe) px(g, x, y, 6, 13 - hgt - 1, 4, 3, p.crop === 'herb' ? '#b8d27a' : '#c9b477')
    if (p.wateredDay === game.clock.day) px(g, x, y, 2, 13, 12, 2, '#5f503a')
  }
}

/** 밤에 등불 기둥이 빛나는 자리 (화면 좌표로 바꿔 불빛을 그린다) */
export function lanternLights(game: GameState): Tile[] {
  return unlocked(game.flags, 'lanterns') ? [...LANTERNS] : []
}

/** 양 우리를 넓히면 양이 둘 더 */
export function sheepCount(game: GameState): number {
  return unlocked(game.flags, 'penBig') ? 5 : 3
}
