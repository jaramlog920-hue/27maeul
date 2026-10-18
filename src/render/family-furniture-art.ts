import { pixels } from './home-space-art'
import type { FurnitureArt } from './furniture-art'
import type { DirectionalFurnitureArt } from './home-space-directions'

// Native 16px originals. Each silhouette has its own construction, rather than palette variants.
type Mark = readonly [string, number, number, number, number]
const art = (...r: Mark[]) => pixels(1, 1, r)
export const FAMILY_FURNITURE_ART: Record<string, FurnitureArt> = {
  wallCuckooClock: art(['W',7,11,1,4],['y',6,14,3,2],['k',3,4,10,8],['w',4,5,8,6],['R',6,1,4,1],['r',4,2,8,2],['R',2,4,12,1],['C',5,5,6,6],['c',6,6,4,4],['W',7,6,1,3],['W',8,8,2,1],['k',7,3,2,2]),
  wallMoonMobile: art(['W',7,0,1,2],['l',2,2,12,1],['C',3,3,1,4],['C',8,3,1,8],['C',12,3,1,4],['y',1,7,4,4],['y',2,6,3,6],['.',4,6,2,3],['Y',7,11,3,1],['y',8,10,1,4],['y',11,8,3,1],['Y',12,7,1,3]),
  wallFernBasket: art(['W',7,0,1,2],['C',4,2,1,6],['C',11,2,1,6],['g',7,2,1,7],['G',4,3,3,2],['g',2,5,4,1],['G',9,4,4,2],['g',11,6,3,1],['k',3,8,10,4],['w',4,9,8,4],['l',5,9,1,3],['l',8,9,1,4],['l',11,9,1,3],['g',5,7,1,8],['G',4,12,2,2]),
  wallSeaPainting: art(['k',1,2,14,12],['l',2,3,12,10],['c',3,4,10,8],['b',3,9,10,3],['B',4,11,3,1],['B',10,10,2,1],['y',10,5,2,2],['W',7,5,1,6],['C',6,6,1,3],['C',5,7,1,2],['r',5,10,6,1],['R',6,11,4,1]),
  wallPatchwork: art(['W',2,1,12,1],['y',1,1,1,2],['y',14,1,1,2],['C',3,2,10,11],['r',4,3,4,4],['b',8,3,4,4],['g',4,7,4,4],['p',8,7,4,4],['c',5,4,2,2],['Y',9,8,2,2],['l',3,13,1,2],['l',6,13,1,2],['l',9,13,1,2],['l',12,13,1,2]),
  wallKeyHooks: art(['k',1,3,14,5],['w',2,4,12,3],['l',3,4,10,1],['W',4,7,1,3],['W',10,7,1,2],['y',3,10,3,3],['.',4,11,1,1],['y',4,13,1,3],['y',5,14,2,1],['C',9,9,3,3],['.',10,10,1,1],['C',10,12,1,3]),
  wallFlowerWreath: art(['W',7,0,1,2],['g',4,2,8,2],['g',2,4,3,7],['g',11,4,3,7],['g',4,11,8,2],['G',3,4,2,2],['G',10,10,2,2],['p',4,2,3,3],['y',5,3,1,1],['C',11,5,3,3],['y',12,6,1,1],['c',3,9,3,3],['r',4,10,1,1],['r',7,11,2,3],['p',6,14,1,2],['p',9,14,1,2]),
  wallLetterPocket: art(['W',4,1,8,1],['C',3,2,1,5],['C',12,2,1,5],['k',2,6,12,8],['b',3,7,10,6],['B',3,10,10,1],['C',5,4,6,5],['c',6,5,4,3],['R',7,6,2,1],['b',4,9,8,3],['y',7,11,2,1]),
  wallBirdShelf: art(['W',3,11,2,4],['W',11,11,2,4],['k',1,10,14,2],['l',1,10,14,1],['b',4,5,6,4],['B',6,6,3,2],['b',8,3,3,4],['W',10,4,1,1],['y',11,5,2,1],['b',2,4,2,3],['W',5,9,1,1],['W',8,9,1,1]),
  wallBrassSconce: art(['W',7,2,3,10],['y',8,3,1,8],['W',4,9,5,2],['y',4,7,2,3],['k',2,3,7,4],['y',3,3,5,3],['Y',4,4,3,2],['C',4,2,3,1],['y',7,12,3,1]),
  wovenPetBed: art(['k',1,8,14,7],['w',2,7,12,7],['l',3,8,10,5],['C',3,9,10,4],['c',4,9,8,3],['w',1,12,2,2],['w',13,12,2,2],['W',2,14,12,1],['l',3,13,1,1],['l',6,13,1,1],['l',9,13,1,1],['l',12,13,1,1]),
  coolingPetMat: art(['W',1,7,14,8],['g',2,8,12,6],['G',3,8,1,6],['G',5,8,1,6],['G',7,8,1,6],['G',9,8,1,6],['G',11,8,1,6],['C',2,9,12,1],['C',2,13,12,1],['l',1,8,1,6],['l',14,8,1,6]),
  petBowlStation: art(['W',0,12,16,3],['l',1,12,14,1],['k',1,9,6,4],['C',2,9,4,3],['B',2,9,4,1],['b',3,10,2,1],['k',10,11,4,2],['c',11,11,2,1]),
  petTugMat: art(['C',1,11,14,4],['p',2,12,12,2],['W',1,8,3,5],['w',2,7,2,5],['C',3,8,3,1],['y',5,9,3,1],['C',7,10,4,1],['y',10,11,3,2],['C',9,12,2,1]),
  petPuzzleTray: art(['k',1,11,14,4],['l',2,11,12,3],['W',3,12,3,1],['W',8,12,2,1],['W',12,12,1,1],['r',3,11,2,1],['b',8,11,2,1],['y',11,13,2,1]),
  toddlerRockingHorse: art(['W',1,14,14,1],['l',2,13,12,1],['W',4,10,2,3],['W',11,10,2,3],['w',3,8,11,3],['l',4,8,8,1],['R',6,8,5,1],['w',2,4,3,6],['l',1,4,5,3],['W',2,3,1,1],['W',2,5,1,1],['C',4,6,2,1],['W',13,7,1,3]),
  childBlockMat: art(['b',1,12,14,3],['B',2,14,12,1],['r',1,10,3,3],['R',1,12,3,1],['y',11,9,3,4],['Y',11,9,3,1],['g',5,13,2,1],['c',2,10,1,1]),
  childDrawingTable: art(['W',1,13,2,3],['W',13,13,2,3],['k',0,10,16,3],['l',1,10,14,2],['c',5,10,6,2],['r',6,10,2,1],['b',8,11,2,1],['r',1,8,1,3],['y',2,9,1,2],['b',3,8,1,3]),
  childBookSeat: art(['W',2,13,12,2],['p',3,11,10,3],['c',1,11,6,2],['C',9,11,6,2],['W',7,11,2,2],['b',2,11,2,1],['g',11,11,2,1],['R',1,13,14,1]),
  toddlerDrumMat: art(['G',1,12,14,3],['g',2,14,12,1],['R',4,10,8,4],['r',5,10,6,4],['C',3,9,10,2],['c',4,9,8,1],['y',5,11,1,2],['y',10,11,1,2],['W',4,14,8,1]),
}

// Wall attachments always face the room. Mats/toys keep their native square footprint.
// These small pieces have no hidden cabinet backs; left view mirrors the asymmetric detail.
export const FAMILY_FURNITURE_DIRECTIONS: Record<string, DirectionalFurnitureArt> = {}
for (const [id, a] of Object.entries(FAMILY_FURNITURE_ART)) {
  FAMILY_FURNITURE_DIRECTIONS[id] = { down: a, up: a, right: a, left: { ...a, rows: a.rows.map(r => [...r].reverse().join('')) } }
}


/** 방향별 낮은 받침과 접촉 소품. 세워진 그릇·동물 도트를 90도 회전하지 않는다. */
export function petFurnitureArtRows(id: string, facing: import('../engine/types').Facing, frame = 0): string[] {
  const source = FAMILY_FURNITURE_ART[id].rows
  const p = ((frame % 4) + 4) % 4
  if (id === 'wovenPetBed' || id === 'coolingPetMat') return facing === 'left' || facing === 'up' ? source.map(r => [...r].reverse().join('')) : source
  if (facing === 'down') {
    const a = source.map(r => [...r])
    if (id === 'petBowlStation') { a[9][3] = p % 2 ? 'c' : 'b'; a[10][4] = p % 2 ? 'B' : 'b' }
    if (id === 'petTugMat') { a[9][6] = p % 2 ? '.' : 'y'; a[10][6] = p % 2 ? 'y' : 'C'; a[11][10] = p % 2 ? 'C' : 'y' }
    if (id === 'petPuzzleTray') { a[11][8] = p % 2 ? 'l' : 'b'; a[11][9] = p % 2 ? 'l' : 'b'; a[12][8] = p % 2 ? 'b' : 'W'; a[12][9] = p % 2 ? 'b' : 'W' }
    return a.map(r => r.join(''))
  }
  const [cx, cy] = { up: [12, 9], left: [8, 13], right: [8, 5] }[facing]
  const marks: Mark[] = id === 'petBowlStation'
    ? [['k',1,7,14,8],['l',2,8,12,6],['w',2,14,12,1],['W',3,9,10,1]]
    : id === 'petTugMat' ? [['r',1,9,14,6],['R',2,14,12,1],['C',2,10,12,1]]
    : [['k',1,8,14,7],['l',2,9,12,5],['W',3,13,10,1]]
  if (id === 'petBowlStation') marks.push(['C',cx-2,cy-1,5,2],['b',cx-1,cy-1,3,1],['B',cx-1,cy,3,1],[p%2?'c':'b',cx,cy-1,1,1])
  if (id === 'petTugMat') marks.push(['y',cx-2,cy,5,1],['C',cx-2+p%2,cy-1,1,3],['y',cx+1,cy-1,1,3])
  if (id === 'petPuzzleTray') marks.push(['W',cx-2,cy-1,5,3],['r',cx-1,cy,1,1],[p%2?'b':'y',cx+1,cy,1,1])
  return pixels(1,1,marks).rows
}
for (const id of ['wovenPetBed', 'coolingPetMat', 'petBowlStation', 'petTugMat', 'petPuzzleTray']) {
  const base = FAMILY_FURNITURE_ART[id]
  FAMILY_FURNITURE_DIRECTIONS[id] = Object.fromEntries((['down', 'right', 'up', 'left'] as const).map(facing => [facing, { ...base, rows: facing === 'down' ? base.rows : petFurnitureArtRows(id, facing) }])) as DirectionalFurnitureArt
}
