// 方向 UI・배치・저장에는 아직 연결하지 않는, Claude 인계용 4방향 원본.
// 이미지를 90도 회전하지 않는다. 세워진 가구의 측면/뒷면은 별도로 그린다.
import { HOME_SPACE_ART, pixels } from './home-space-art'
import type { FurnitureArt } from './furniture-art'

export type FurnitureFacing = 'down' | 'up' | 'left' | 'right'
export const FURNITURE_FACINGS: readonly FurnitureFacing[] = ['down', 'up', 'left', 'right']
export type DirectionalFurnitureArt = Record<FurnitureFacing, FurnitureArt>
const flip = (a: FurnitureArt): FurnitureArt => ({ ...a, rows: a.rows.map(row => [...row].reverse().join('')) })

function views(front: FurnitureArt, back: FurnitureArt, right: FurnitureArt): DirectionalFurnitureArt {
  return { down: front, up: back, left: flip(right), right }
}
function cabinetFront(w: number, books: boolean, back = false): FurnitureArt {
  const width = w * 16
  const base = pixels(w, 1, [
    ['z',2,15,width-4,1], ['k',2,1,width-4,14], ['w',3,2,width-6,12],
    ['l',3,2,width-6,1], ['W',3,8,width-6,1],
  ])
  if (back) {
    for(let x=6;x<width-3;x+=5) for(let y=4;y<14;y++) base.rows[y]=base.rows[y].slice(0,x)+'W'+base.rows[y].slice(x+1)
    return base
  }
  return HOME_SPACE_ART[books ? 'bookcase' : 'cupboard']
}
function cabinetSide(depth: number): FurnitureArt {
  return pixels(1,depth,[
    ['z',3,depth*16-2,10,2], ['k',3,2,10,depth*16-3], ['w',4,3,8,depth*16-5],
    ['l',4,3,8,2], ['W',10,6,1,depth*16-9], ['W',5,8,1,depth*16-11],
  ])
}
function longSeat(back: boolean, bed: boolean): FurnitureArt {
  return pixels(2,1,[
    ['z',2,14,28,2], ['W',4,12,3,3], ['W',25,12,3,3],
    ['k',2,3,28,10], ['w',3,4,26,8], ['l',3,4,26,2],
    [back?'w':bed?'c':'b',4,7,24,4], [back?'W':bed?'C':'B',4,11,24,1],
    ['k',2,5,2,7], ['k',28,5,2,7],
  ])
}
function seatSide(bed: boolean): FurnitureArt {
  return pixels(1,2,[
    ['z',2,29,12,2], ['W',3,26,2,4], ['W',11,26,2,4],
    ['k',2,3,12,25], ['w',3,4,10,23], ['l',3,4,10,3],
    [bed?'c':'b',4,8,8,16], [bed?'C':'B',4,24,8,2],
    ['k',2,7,2,19], ['k',12,7,2,19],
    [bed?'b':'l',5,9,6,bed?4:1],
  ])
}
const chairFront=pixels(1,1,[
  ['z',2,14,12,2], ['k',2,1,12,11], ['l',3,2,10,2], ['w',3,4,10,3],
  ['b',3,7,10,3], ['B',3,10,10,1], ['W',3,12,2,3], ['W',11,12,2,3],
])
const chairBack=pixels(1,1,[
  ['z',2,14,12,2], ['k',2,1,12,11], ['l',3,2,10,2], ['w',3,4,10,7],
  ['W',5,4,1,7], ['W',10,4,1,7], ['W',3,12,2,3], ['W',11,12,2,3],
])
const tableSide=pixels(1,2,[
  ['z',2,29,12,2], ['W',3,25,3,5], ['W',10,25,3,5],
  ['k',2,3,12,23], ['l',3,4,10,19], ['w',3,23,10,2],
  ['C',5,4,6,19], ['c',6,4,4,18], ['b',6,11,4,3],
])
const rugSide=pixels(1,2,[
  ['C',2,3,12,27], ['W',3,4,10,25], ['C',4,5,8,23], ['c',5,7,6,19],
  ['r',4,5,8,2], ['r',4,26,8,2], ['b',6,12,4,8], ['B',7,14,2,4],
])
const lecternBack=pixels(1,1,[
  ['z',3,14,10,1], ['W',7,8,2,6], ['k',2,3,12,7],
  ['w',3,4,10,4], ['l',3,4,10,1], ['W',4,6,8,1], ['w',4,13,8,1],
])
const lecternSide=pixels(1,1,[
  ['z',3,14,10,1], ['W',7,7,2,7], ['w',4,13,8,1],
  ['k',3,3,3,3], ['k',5,5,3,3], ['k',7,7,6,3],
  ['C',4,3,2,2], ['c',6,5,2,2], ['C',8,7,4,1],
])
const potFront=pixels(1,1,[
  ['z',3,14,10,1], ['k',6,6,4,2], ['k',4,8,8,6], ['c',5,9,6,3],
  ['C',5,12,6,1], ['b',7,10,2,1], ['k',3,9,2,3], ['k',11,9,2,3],
])
const potBack=pixels(1,1,[
  ['z',3,14,10,1], ['k',6,6,4,2], ['k',4,8,8,6], ['C',5,9,6,4],
  ['k',6,8,4,3], ['c',7,9,2,1],
])
const chestBack=pixels(1,1,[
  ['z',2,15,12,1], ['k',2,5,12,10], ['l',3,6,10,2],
  ['w',3,8,10,6], ['W',3,9,10,1], ['s',4,9,2,1], ['s',10,9,2,1],
])
const chestSide=pixels(1,1,[
  ['z',3,15,10,1], ['k',3,5,10,10], ['l',4,6,8,2], ['w',4,8,8,6],
  ['W',4,9,8,1], ['W',6,11,1,3], ['W',10,11,1,3],
])
const nightBack=pixels(1,1,[
  ['z',2,14,12,2], ['k',2,5,12,9], ['l',3,5,10,2], ['w',3,8,10,5],
  ['W',7,8,1,5], ['W',3,14,2,1], ['W',11,14,2,1],
])
const nightSide=pixels(1,1,[
  ['z',3,14,10,2], ['k',3,5,10,9], ['l',4,5,8,2], ['w',4,8,8,5],
  ['W',10,8,1,5], ['W',4,14,2,1], ['W',10,14,2,1],
])
const toyFront=pixels(1,1,[
  ['z',3,14,10,1], ['k',5,5,6,5], ['l',6,6,4,3], ['W',6,7,1,1],
  ['k',4,10,8,3], ['l',5,10,6,2], ['W',4,13,2,1], ['W',10,13,2,1],
])
const toyBack=pixels(1,1,[
  ['z',3,14,10,1], ['k',5,5,6,5], ['w',6,6,4,3],
  ['k',4,10,8,3], ['l',5,10,6,2], ['W',7,9,2,3], ['W',4,13,2,1], ['W',10,13,2,1],
])
const dollBack=pixels(1,1,[
  ['z',5,14,7,1], ['C',6,4,5,4], ['c',7,4,3,2], ['r',5,8,7,5],
  ['R',8,8,1,5], ['C',3,8,2,2], ['C',12,8,2,2], ['W',6,13,2,1], ['W',9,13,2,1],
])
const dollSide=pixels(1,1,[
  ['z',5,14,6,1], ['C',6,4,4,4], ['c',8,5,3,2], ['r',6,8,4,5],
  ['p',7,8,3,3], ['C',9,9,2,2], ['W',6,13,2,1], ['W',9,13,2,1],
])

// 대칭인 소품도 네 방향 키를 제공한다. 같은 그림을 공유하는 것은 의도적이다.
function symmetric(a: FurnitureArt): DirectionalFurnitureArt {
  return { down:a, up:a, left:a, right:a }
}
const bowlUp=flip(HOME_SPACE_ART.fruitBowl)
const basketSide=pixels(1,1,[
  ['z',3,14,10,1], ['k',7,4,2,5], ['l',7,5,1,3], ['k',3,8,10,6],
  ['l',4,9,8,4], ['w',4,11,8,1], ['w',6,9,1,4], ['w',10,9,1,4],
])
const supplyBack=pixels(1,1,[
  ['z',2,15,12,1], ['c',4,3,3,5], ['b',9,4,3,4], ['k',2,5,12,10],
  ['w',3,6,10,8], ['l',3,6,10,2], ['W',3,9,10,1], ['s',4,9,2,1], ['s',10,9,2,1],
])
const supplySide=pixels(1,1,[
  ['z',3,15,10,1], ['c',5,3,3,5], ['b',9,4,2,4], ['k',3,7,10,8],
  ['w',4,8,8,6], ['l',4,8,8,2], ['s',4,11,2,2], ['s',10,11,2,2],
])

export const HOME_SPACE_DIRECTIONS: Record<string, DirectionalFurnitureArt> = {
  table: views(HOME_SPACE_ART.table, HOME_SPACE_ART.table, tableSide),
  chair: views(chairFront, chairBack, HOME_SPACE_ART.chair),
  stool: symmetric(HOME_SPACE_ART.stool),
  teapot: views(potFront,potBack,flip(HOME_SPACE_ART.teapot)),
  cupboard: views(HOME_SPACE_ART.cupboard,cabinetFront(2,false,true),cabinetSide(2)),
  fruitBowl: views(HOME_SPACE_ART.fruitBowl,bowlUp,HOME_SPACE_ART.fruitBowl),
  supplyChest: views(HOME_SPACE_ART.supplyChest,supplyBack,supplySide),
  basket: views(HOME_SPACE_ART.basket,HOME_SPACE_ART.basket,basketSide),
  chest: views(HOME_SPACE_ART.chest,chestBack,chestSide),
  longBench: views(HOME_SPACE_ART.longBench,longSeat(true,false),seatSide(false)),
  daybed: views(HOME_SPACE_ART.daybed,longSeat(true,true),seatSide(true)),
  cushion: symmetric(HOME_SPACE_ART.cushion),
  pillows: views(HOME_SPACE_ART.pillows,flip(HOME_SPACE_ART.pillows),HOME_SPACE_ART.pillows),
  mat: views(HOME_SPACE_ART.mat,HOME_SPACE_ART.mat,rugSide),
  woodToy: views(toyFront,toyBack,HOME_SPACE_ART.woodToy),
  clothDoll: views(HOME_SPACE_ART.clothDoll,dollBack,dollSide),
  bookcase: views(HOME_SPACE_ART.bookcase,cabinetFront(1,true,true),cabinetSide(1)),
  lectern: views(HOME_SPACE_ART.lectern,lecternBack,lecternSide),
  nightstand: views(HOME_SPACE_ART.nightstand,nightBack,nightSide),
  lantern: symmetric(HOME_SPACE_ART.lantern),
}

// 옛 그림은 chair가 right, 주전자는 left, 나무 장난감은 right를 보고 있었다.
export const HOME_SPACE_LEGACY_FACING: Record<string, FurnitureFacing> = Object.fromEntries(
  Object.keys(HOME_SPACE_DIRECTIONS).map(id => [id, id === 'chair' || id === 'woodToy' ? 'right' : id === 'teapot' ? 'left' : 'down']),
)
