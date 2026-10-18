// Shared native village facilities. Only supplied flags/weather/time are read.
import {unlocked} from '../engine/bonds'
import type {Tile,Weather} from '../engine/types'
const TILE=16
export type DecorCanvas=Pick<CanvasRenderingContext2D,'fillStyle'|'fillRect'|'strokeStyle'|'lineWidth'|'beginPath'|'moveTo'|'lineTo'|'stroke'>&{
  /** Optional event-camera footprint; ordinary world drawing keeps every native tile. */
  visibleTile?:(tile:Tile)=>boolean
}
type Ctx=DecorCanvas

const WOOD = '#b17640'
const WOOD_DARK = '#8d5829'
const FLOWERS = ['#f59eaf', '#eed584', '#ffffff', '#bd94e9']

/** Original unlocked oil-press grip; shared by world and event workshop drawing. */
export function pressHandle(g:DecorCanvas,at:Tile){
  px(g,at.x,at.y,7,-3,2,5,WOOD_DARK)
  px(g,at.x,at.y,3,-4,10,2,WOOD)
}

export function px(g: Ctx, x: number, y: number, dx: number, dy: number, w: number, h: number, c: string) {
  if(g.visibleTile&&!g.visibleTile({x,y}))return
  g.fillStyle = c
  g.fillRect(x * TILE + dx, y * TILE + dy, w, h)
}

export function bench(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 1, 11, 15, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 2, 9, 2, 5, WOOD_DARK)
  px(g, t.x, t.y, 12, 9, 2, 5, WOOD_DARK)
  px(g, t.x, t.y, 1, 7, 14, 3, WOOD)
}

export function flowers(g: Ctx, t: Tile, seed: number) {
  for (let i = 0; i < 3; i++) px(g, t.x, t.y, 2 + ((seed * 7 + i * 5) % 11), 3 + ((seed * 3 + i * 4) % 10), 2, 2, FLOWERS[(seed + i) % 4])
}

export function awning(g: Ctx, t: Tile, w: number, a: string, b: string) {
  for (let i = 0; i < w * 4; i++) px(g, t.x, t.y, i * 4, -4, 4, 6, i % 2 ? b : a)
  px(g, t.x, t.y, 0, -4, 1, 20, WOOD_DARK)
  px(g, t.x, t.y, w * 16 - 1, -4, 1, 20, WOOD_DARK)
}

export function hive(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 3, 12, 11, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 4, 5, 8, 9, '#d4ab60')
  px(g, t.x, t.y, 4, 7, 8, 1, '#ae7e32')
  px(g, t.x, t.y, 4, 10, 8, 1, '#ae7e32')
  px(g, t.x, t.y, 7, 12, 2, 2, '#492c1b')
}

export function tree(g: Ctx, t: Tile) {
  px(g, t.x, t.y, 3, 13, 11, 3, 'rgba(40,25,10,0.22)')
  px(g, t.x, t.y, 7, 9, 3, 6, '#906038')
  px(g, t.x, t.y, 2, 2, 12, 9, '#408040')
  px(g, t.x, t.y, 3, 3, 9, 6, '#509048')
}

export const LANTERNS: readonly Tile[] = [
  { x: 3, y: 8 },
  { x: 12, y: 8 },
  { x: 23, y: 11 },
  { x: 19, y: 12 },
  { x: 30, y: 12 },
  { x: 19, y: 23 },
  { x: 30, y: 23 },
  { x: 23, y: 31 },
]

export function drawBondDecor(g:Ctx,f:Record<string,number>,weather:Weather,t:number,daytime:boolean,level=0,extraHivesOnly=false){
  // C2 베 짜는 이웃의 베틀
  if (level >= 2) {
    const loom = { x: 38, y: 24 }
    px(g, loom.x, loom.y, 2, 3, 2, 11, WOOD_DARK)
    px(g, loom.x, loom.y, 12, 3, 2, 11, WOOD_DARK)
    px(g, loom.x, loom.y, 2, 3, 12, 2, WOOD)
    for (let i = 0; i < 5; i++) px(g, loom.x, loom.y, 4 + i * 2, 5, 1, 7, ['#bc5a45', '#e4cf87', '#6398c0', '#8153b0', '#fbf1dc'][i])
    if (unlocked(f, 'loomAwning')) awning(g, { x: 37, y: 24 }, 2, '#8153b0', '#fbf1dc')
  }
  // C4 벌통
  if (level >= 4) {
    const hives: Tile[] = extraHivesOnly ? [] : [
      { x: 41, y: 27 },
      { x: 42, y: 27 },
    ]
    if (unlocked(f, 'moreHives')) hives.push({ x: 44, y: 27 }, { x: 45, y: 27 })
    hives.forEach((h) => hive(g, h))
    if (daytime && weather !== 'rain' && weather !== 'snow')
      for (let i = 0; i < hives.length * 2; i++) {
        const h = hives[i % hives.length]
        px(g, h.x, h.y, 8 + Math.round(Math.cos(t * 3 + i) * 7), 2 + Math.round(Math.sin(t * 4 + i * 2) * 4), 1, 1, '#322020')
      }
  }

  // A 부탁을 들어준 뒤 생긴 것들
  if (unlocked(f, 'bakeryBench')) bench(g, { x: 1, y: 13 })
  if (unlocked(f, 'childGarden')) {
    flowers(g, { x: 32, y: 13 }, 1)
    flowers(g, { x: 32, y: 14 }, 2)
    flowers(g, { x: 32, y: 15 }, 3)
  }
  if (unlocked(f, 'grapeTrellis')) {
    // 반듯하게 다시 세운 포도 시렁: 기둥 둘 + 가로대 + 덩굴
    for (const x of [41, 42, 43]) {
      px(g, x, 9, 2, 2, 2, 12, WOOD)
      px(g, x, 9, 12, 2, 2, 12, WOOD)
      px(g, x, 9, 0, 1, 16, 2, WOOD)
      px(g, x, 9, 1, 0, 14, 3, '#76ae45')
      px(g, x, 9, 6, 3, 3, 3, '#8741a3')
    }
  }
  if (unlocked(f, 'grandpaBench')) bench(g, { x: 31, y: 8 })
  if (unlocked(f, 'stallAwning')) awning(g, { x: 19, y: 13 }, 3, '#6398c0', '#eed584')
  if (unlocked(f, 'pressHandle')) {
    pressHandle(g,{x:45,y:21})
  }
  if (unlocked(f, 'oliveGrove')) {
    tree(g, { x: 41, y: 11 })
    tree(g, { x: 45, y: 15 })
  }
  if (unlocked(f, 'bigBellows')) {
    // 대장간 지붕
    for (let i = 0; i < 12; i++) px(g, 42, 20, i * 4 - 8, 1, 4, 4, i % 2 ? '#9c402f' : '#bc5a45')
  }
  if (unlocked(f, 'lanterns'))
    for (const l of LANTERNS) {
      px(g, l.x, l.y, 7, 2, 2, 12, WOOD_DARK)
      px(g, l.x, l.y, 5, 0, 6, 4, daytime ? '#e4cf87' : '#eed584')
    }
  // 바람 부는 날·맑은 날, 언덕 위에 연
  if (unlocked(f, 'kite') && daytime && (weather === 'wind' || weather === 'sunny') && (!g.visibleTile||g.visibleTile({x:15,y:12}))) {
    // 언덕 벤치 곁(15,12) 풀밭에서 띄운다
    const kx = 15 * TILE + 8 + Math.round(Math.sin(t * 0.8) * 10)
    const ky = 12 * TILE + 4 - 48 + Math.round(Math.cos(t * 1.1) * 3)
    g.strokeStyle = 'rgba(80,60,40,0.6)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(15 * TILE + 8, 12 * TILE + 4)
    g.lineTo(kx, ky + 6)
    g.stroke()
    g.fillStyle = '#d6677b'
    g.fillRect(kx - 3, ky, 6, 6)
    g.fillStyle = '#eed584'
    g.fillRect(kx - 1, ky + 2, 2, 2)
  }

}
