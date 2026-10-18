import type { FullAvatar } from '../engine/avatar'
import type { Facing } from '../engine/types'
import type { ChildFurnitureId, PetFurnitureId } from '../engine/family-furniture'
import { petFurnitureAction } from '../engine/family-furniture'
import { FAMILY_FURNITURE_DIRECTIONS, petFurnitureArtRows } from './family-furniture-art'
import { motionBodyRows } from './motion-body'
import { petMotionRows, petStillRows } from './pet-art'

const grid = () => Array.from({ length: 32 }, () => Array<string>(32).fill('.'))
type Grid = ReturnType<typeof grid>
const put = (a: Grid, x: number, y: number, c: string) => { if (a[y]?.[x] !== undefined) a[y][x] = c }
const rect = (a: Grid, x: number, y: number, w: number, h: number, c: string) => {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(a, xx, yy, c)
}
const stamp = (a: Grid, rows: string[], x: number, y: number) => rows.forEach((r, yy) => [...r].forEach((c, xx) => { if (c !== '.') put(a, x + xx, y + yy, c) }))
const rows = (a: Grid) => a.map(r => r.join(''))

/** Shared by the game and the contact sheet. Canvas/ground anchor never changes between phases. */
export function childFurnitureFrame(id: ChildFurnitureId, facing: Facing, frame: number, avatar: FullAvatar, toddler: boolean) {
  const p = ((frame % 4) + 4) % 4, actor = grid(), object = grid(), front = grid()
  const body = motionBodyRows('writer', facing, { avatar, look: avatar.look, short: toddler ? 0 : 1, frame: 0, blink: p === 3, pose: 'stand' })
  const horse = id === 'toddlerRockingHorse', bob = horse ? [0, -1, 0, 0][p] : 0
  const ax = Math.floor((32 - body[0].length) / 2), ay = 29 - body.length + bob
  stamp(object, FAMILY_FURNITURE_DIRECTIONS[id][facing].rows, 8, 16)
  // Preserve the full torso. Only the last three leg rows bend into a seated pose.
  stamp(actor, body.slice(0, -3), ax, ay)
  const kneeY = ay + body.length - 3
  const side = facing === 'left' || facing === 'right'
  const knees = side ? [ax + (facing === 'right' ? 5 : 1), ax + (facing === 'right' ? 7 : 3)] : [ax + 1, ax + 7]
  for (const x of knees) {
    rect(actor, x, kneeY, 2, 2, 'd'); rect(actor, x, kneeY + 2, 2, 1, '2')
  }
  // Compact bent elbows beside the torso; palms never cross the face.
  const hy = Math.max(ay + 8, 25 + bob)
  const leftX = ax - (id === 'childBlockMat' && (p === 1 || p === 2) ? 1 : 0)
  const handYs = id === 'toddlerDrumMat' ? [hy - p % 2, hy - (1 - p % 2)] : [hy, hy - (id === 'childBookSeat' && p === 1 ? 1 : 0)]
  for (const [i, x] of [leftX, ax + body[0].length - 2].entries()) {
    const y = handYs[i]
    rect(actor, x, y - 1, 2, 1, 'r'); rect(actor, x, y, 2, 1, 's'); rect(actor, x, y + 1, 2, 1, '5')
  }
  if (id === 'childBlockMat') {
    rect(front, 9, 29, 3, 2, 'y')
    if (p >= 1) rect(front, 9, 27, 3, 2, 'b')
    if (p >= 2) rect(front, 9, 25, 3, 2, 'r')
    if (p === 3) rect(front, 10, 25, 1, 1, 'c')
  } else if (id === 'childDrawingTable') {
    rect(front, 13, 26, 6, 2, 'c')
    rect(front, 14 + p % 3, 26, 1, 1, 'r')
    rect(front, 18 + p % 2, 25, 1, 2, 'W')
  } else if (id === 'childBookSeat') {
    rect(front, 10, 26, 5, 3, 'c'); rect(front, 16, 26, 5, 3, 'C')
    rect(front, 15, 26, 1, 3, 'W'); rect(front, 11, 27, 2, 1, 'g')
    rect(front, 17 - p % 2, 26, 1 + p % 2, 3, 'c')
  } else if (id === 'toddlerDrumMat') {
    rect(front, 11, 25, 10, 2, 'C'); rect(front, 12, 25, 8, 1, 'c')
    // The palms alternate one pixel above the drum rim, connected to their sleeves.
  } else if (horse) {
    // Legs straddle the saddle; feet remain below the seat and above its runners.
    rect(actor, 11, 26 + bob, 2, 3, 'r'); rect(actor, 19, 26 + bob, 2, 3, 'r')
    rect(actor, 11, 29 + bob, 2, 1, 'W'); rect(actor, 19, 29 + bob, 2, 1, 'W')
  }
  // Objects stay below the eyes. Keep gripping fingertips above paper/instruments.
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if ('s5'.includes(actor[y][x])) front[y][x] = '.'
  return { actor: rows(actor), furniture: rows(object), front: rows(front), anchor: { x: 16, y: 32 }, duration: 300 }
}

export function petFurnitureRows(id: PetFurnitureId, kind: 'cat' | 'dog', facing: Facing, frame: number, baby: boolean): string[] {
  const action = petFurnitureAction(id)
  const side: Facing = { down: 'left' as const, right: 'up' as const, up: 'right' as const, left: 'down' as const }[facing]
  if (action === 'sleep') {
    const r = petStillRows(kind, 'curl', baby)
    return side === 'right' ? r.map(row => [...row].reverse().join('')) : r
  }
  // Bowl and toys sit on the left of the mat; the muzzle faces their contact edge.
  const r = petMotionRows(kind, side, action === 'tug' ? 'play' : 'sniff', frame, baby).map(row => [...row])
  if (action === 'drink' && frame % 2) {
    // Tiny visible tongue at the lowered muzzle, keeping both eyes intact.
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (r[y][x] === 'n' && y + 1 < 16) r[y + 1][x] = 'w'
  }
  return r.map(row => row.join(''))
}

/** Object response shares the installed piece's coordinates, never an extra automatic prop. */
export function petFurnitureObjectRows(id: PetFurnitureId, facing: Facing, frame: number): string[] {
  return petFurnitureArtRows(id, facing, frame)
}
