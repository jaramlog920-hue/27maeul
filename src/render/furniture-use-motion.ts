import type { Facing } from '../engine/types'
import { spriteRows, type SpriteOpts, type Who } from './sprites'

/** Native 24×24 poses. Appearance stays supplied by the game's character renderer. */
export const USE_SIZE = 24
export const USE_ACTIONS = ['sit', 'drink', 'read', 'craft', 'knead', 'reach', 'pet', 'lie'] as const
export type UseAction = typeof USE_ACTIONS[number]
export const USE_PROP_PALETTE: Record<string, string> = {
  a: '#fff0d0', b: '#c68b54', c: '#78bbac', d: '#878176',
  e: '#e8ae74', f: '#d46d46', g: '#a96f3f', h: '#ffeaba',
}
export const USE_INFO: Record<UseAction, { label: string; durations: number[]; furniture: string[] }> = {
  sit: { label: '앉아 쉬기', durations: [360, 360, 360, 360], furniture: ['chair', 'stool', 'longBench', 'cushion', 'mat'] },
  drink: { label: '차 마시기', durations: [450, 180, 650, 240], furniture: ['table', 'teapot'] },
  read: { label: '책 읽고 장 넘기기', durations: [650, 200, 220, 650], furniture: ['bookcase', 'lectern', 'table'] },
  craft: { label: '바느질·손일', durations: [240, 240, 240, 240], furniture: ['workbench', 'loom', 'basket'] },
  knead: { label: '반죽하기', durations: [260, 180, 260, 180], furniture: ['table', 'desk', 'wideDesk'] },
  reach: { label: '물건 꺼내고 넣기', durations: [240, 280, 380, 280], furniture: ['chest', 'supplyChest', 'cupboard', 'nightstand', 'jar', 'barrel'] },
  pet: { label: '장난감·인형 쓰다듬기', durations: [280, 220, 280, 220], furniture: ['woodToy', 'clothDoll'] },
  lie: { label: '누워 쉬기', durations: [650, 650, 650, 650], furniture: ['daybed', 'bed', 'pillows'] },
}
export interface UseMotionFrame {
  actor: string[]
  propBack: string[]
  propFront: string[]
  /** Character foot/pelvis anchor; interaction point is in the same local canvas. */
  anchor: { x: number; y: number }
  interaction: { x: number; y: number }
  duration: number
}
export function furnitureUseFrame(who: Who, facing: Facing, action: UseAction, frame: number, opts: SpriteOpts): UseMotionFrame {
  const phase = ((Math.trunc(frame) % 4) + 4) % 4
  const actor = Array.from({ length: USE_SIZE }, () => Array<string>(USE_SIZE).fill('.'))
  const prop = Array.from({ length: USE_SIZE }, () => Array<string>(USE_SIZE).fill('.'))
  // Make the left pose by mirroring a fully dressed right pose exactly once.
  const direction = facing === 'left' ? 'right' : facing
  const source = spriteRows(who, direction, { ...opts, frame: 0, pose: 'stand', blink: opts.blink || (action === 'lie' && phase !== 2) })
  const side = direction === 'right'
  const sitting = ['sit', 'drink', 'read', 'craft'].includes(action)
  const bob = (action === 'knead' || action === 'pet') && phase % 2 === 1 ? 1 : 0
  const put = (layer: string[][], x: number, y: number, c: string) => {
    if (x >= 0 && x < USE_SIZE && y >= 0 && y < USE_SIZE) layer[y][x] = c
  }
  const rect = (layer: string[][], x: number, y: number, w: number, h: number, c: string) => {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) put(layer, x + dx, y + dy, c)
  }
  source.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return
    if (action === 'lie') {
      // Lying body, distinct vertical and horizontal views, never rotates furniture.
      if (side) put(actor, 5 + y, 9 + (9 - x) + (phase === 2 && y > 6 ? 1 : 0), c)
      else put(actor, 7 + x + (phase === 2 && y > 6 ? 1 : 0), direction === 'up' ? 19 - y : 5 + y, c)
    } else {
      // Bent lap and shortened lower legs retain the selected clothing palette.
      const py = sitting && y >= source.length - 3 ? 4 + y - 2 : 4 + y
      const breath = action === 'sit' && phase === 2 && y < 7 ? 1 : 0
      put(actor, 7 + x + (sitting && side && y >= source.length - 3 ? 2 : 0), py + bob + breath, c)
    }
  }))
  let ix = side ? 18 : 12, iy = direction === 'up' ? 12 : 15
  if (action !== 'sit' && action !== 'lie') {
    // Erase resting hands before drawing the active hands; no extra pair of arms.
    for (let y = 11; y < 17; y++) for (let x = 7; x < 17; x++) {
      if (['s', '5', '!','K'].includes(actor[y][x])) actor[y][x] = '.'
    }
    if (action === 'drink') iy = phase === 1 || phase === 2 ? 10 : 14
    if (action === 'reach') { iy = 14 - [0, 2, 4, 2][phase]; ix += phase === 2 ? 1 : 0 }
    if (action === 'pet') iy = 17 + phase % 2
    if (action === 'craft' || action === 'knead') iy += phase % 2
    const hand = (x: number, y: number) => { rect(actor, x, y, 2, 2, '5'); rect(actor, x, y, 2, 1, 's') }
    hand(ix - 3, iy)
    if (!side) hand(ix + 2, iy)
    if (action === 'drink') {
      rect(prop, ix - 1, iy - 1, 3, 3, 'c'); rect(prop, ix - 1, iy - 1, 3, 1, 'a'); put(prop, ix + 2, iy, 'c')
    } else if (action === 'read') {
      rect(prop, ix - 3, iy - 1, 7, 4, 'g'); rect(prop, ix - 2, iy - 1, 5, 3, 'a'); rect(prop, ix, iy - 1, 1, 3, 'b')
      if (phase === 1 || phase === 2) rect(prop, ix + (phase === 1 ? 1 : -1), iy - 2, 1, 4, 'h')
    } else if (action === 'craft') {
      rect(prop, ix - 2, iy + 1, 5, 2, 'c'); rect(prop, ix + (phase % 2), iy - 2, 1, 3, 'd'); put(prop, ix + 1, iy, 'a')
    } else if (action === 'knead') {
      rect(prop, ix - 3, 17, 7, 1, 'b'); rect(prop, ix - 2, 16, phase % 2 ? 6 : 5, 1, 'h'); rect(prop, ix - 1, 15, 3, phase % 2 ? 1 : 2, 'a')
    } else if (action === 'reach' && phase === 2) {
      rect(prop, ix - 1, iy, 3, 3, 'e'); rect(prop, ix - 1, iy, 3, 1, 'g')
    } else if (action === 'pet') {
      rect(prop, ix - 2, 19, 5, 2, 'e'); rect(prop, ix + 1, 17, 2, 2, 'b'); put(prop, ix + 2, 17, 'g')
    }
  }
  const rows = (layer: string[][]) => layer.map(row => (facing === 'left' ? [...row].reverse() : row).join(''))
  const empty = Array<string>(USE_SIZE).fill('.'.repeat(USE_SIZE))
  return {
    actor: rows(actor), propBack: direction === 'up' ? rows(prop) : empty,
    propFront: direction === 'up' ? empty : rows(prop),
    anchor: { x: 12, y: action === 'lie' ? 14 : sitting ? 15 : 18 },
    interaction: { x: facing === 'left' ? 23 - ix : ix, y: iy }, duration: USE_INFO[action].durations[phase],
  }
}
