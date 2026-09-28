// 마음이 쌓여 마을에 생긴 것들 (6번 A·C). 모두 그림일 뿐 길을 막지 않는다.
import { unlocked } from '../engine/bonds'
import type { GameState } from '../engine/game'
import { TILE } from '../engine/world'
import type { Tile, Weather } from '../engine/types'

type Ctx = CanvasRenderingContext2D

const WOOD = '#a4703f'
const WOOD_DARK = '#7a5230'
const FLOWERS = ['#f28ca0', '#f5d46a', '#ffffff', '#b48ae0']

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
  px(g, t.x, t.y, 4, 5, 8, 9, '#d9a84a')
  px(g, t.x, t.y, 4, 7, 8, 1, '#a9782a')
  px(g, t.x, t.y, 4, 10, 8, 1, '#a9782a')
  px(g, t.x, t.y, 7, 12, 2, 2, '#3b2a20')
}

function tree(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 3, 13, 11, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 7, 9, 3, 6, '#6b4a2e')
  px(g, t.x, t.y, 2, 2, 12, 9, '#56733f')
  px(g, t.x, t.y, 3, 3, 9, 6, '#6f8f5a')
}

export const LANTERNS: readonly Tile[] = [
  { x: 4, y: 9 },
  { x: 10, y: 9 },
  { x: 23, y: 11 },
  { x: 18, y: 13 },
  { x: 30, y: 13 },
  { x: 18, y: 21 },
  { x: 30, y: 21 },
  { x: 23, y: 31 },
]

/** 마을에 생긴 것들을 그린다 (월드 좌표, 카메라 이동이 이미 적용된 상태) */
export function drawDecor(g: Ctx, game: GameState, weather: Weather, t: number, daytime: boolean) {
  const f = game.flags
  // 잠든 뒤 소개 장면과 함께 바뀌는 단계
  const level = game.flags.villageLevel ?? 0

  // C1 꽃길: 큰길 가장자리
  if (level >= 1)
    [2, 4, 8, 13, 17, 21, 27, 32, 38].forEach((x, i) => {
      flowers(g, { x, y: 9 }, i)
      flowers(g, { x, y: 11 }, i + 3)
    })
  // C3 호숫가 쉼터
  if (level >= 3) {
    bench(g, { x: 19, y: 31 })
    bench(g, { x: 21, y: 31 })
    px(g, 30, 34, 2, 5, 12, 5, WOOD) // 작은 배
    px(g, 30, 34, 4, 4, 8, 1, WOOD_DARK)
  }
  // C2 베 짜는 이웃의 베틀
  if (level >= 2) {
    const loom = { x: 30, y: 29 }
    px(g, loom.x, loom.y, 2, 3, 2, 11, WOOD_DARK)
    px(g, loom.x, loom.y, 12, 3, 2, 11, WOOD_DARK)
    px(g, loom.x, loom.y, 2, 3, 12, 2, WOOD)
    for (let i = 0; i < 5; i++) px(g, loom.x, loom.y, 4 + i * 2, 5, 1, 7, ['#b4533f', '#e0c878', '#5f8fb4', '#7a5a9a', '#f1e6cf'][i])
    if (unlocked(f, 'loomAwning')) awning(g, { x: 29, y: 29 }, 2, '#7a5a9a', '#f1e6cf')
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
    flowers(g, { x: 34, y: 18 }, 1)
    flowers(g, { x: 35, y: 18 }, 2)
    flowers(g, { x: 38, y: 18 }, 3)
  }
  if (unlocked(f, 'grapeTrellis')) {
    // 반듯하게 다시 세운 포도 시렁: 기둥 둘 + 가로대 + 덩굴
    for (const x of [40, 41, 42]) {
      px(g, x, 9, 2, 2, 2, 12, WOOD)
      px(g, x, 9, 12, 2, 2, 12, WOOD)
      px(g, x, 9, 0, 1, 16, 2, WOOD)
      px(g, x, 9, 1, 0, 14, 3, '#6f9a4a')
      px(g, x, 9, 6, 3, 3, 3, '#7a4a8c')
    }
  }
  if (unlocked(f, 'grandpaBench')) bench(g, { x: 37, y: 6 })
  if (unlocked(f, 'stallAwning')) awning(g, { x: 19, y: 14 }, 3, '#5f8fb4', '#f5d46a')
  if (unlocked(f, 'pressHandle')) {
    px(g, 38, 25, 7, -3, 2, 5, WOOD_DARK)
    px(g, 38, 25, 3, -4, 10, 2, WOOD)
  }
  if (unlocked(f, 'oliveGrove')) {
    tree(g, { x: 39, y: 27 })
    tree(g, { x: 41, y: 26 })
  }
  if (unlocked(f, 'bigBellows')) {
    // 대장간 지붕
    for (let i = 0; i < 12; i++) px(g, 33, 24, i * 4 - 8, 1, 4, 4, i % 2 ? '#8e3f30' : '#b4533f')
  }
  if (unlocked(f, 'lanterns'))
    for (const l of LANTERNS) {
      px(g, l.x, l.y, 7, 2, 2, 12, WOOD_DARK)
      px(g, l.x, l.y, 5, 0, 6, 4, daytime ? '#e0c878' : '#f5d46a')
    }
  // 바람 부는 날·맑은 날, 언덕 위에 연
  if (unlocked(f, 'kite') && daytime && (weather === 'wind' || weather === 'sunny')) {
    const kx = 15 * TILE + 8 + Math.round(Math.sin(t * 0.8) * 10)
    const ky = 4 + Math.round(Math.cos(t * 1.1) * 3)
    g.strokeStyle = 'rgba(80,60,40,0.6)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(15 * TILE + 8, 3 * TILE + 4)
    g.lineTo(kx, ky + 6)
    g.stroke()
    g.fillStyle = '#d9536a'
    g.fillRect(kx - 3, ky, 6, 6)
    g.fillStyle = '#f5d46a'
    g.fillRect(kx - 1, ky + 2, 2, 2)
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
