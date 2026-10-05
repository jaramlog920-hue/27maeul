// 먼저 만든 20종과 중복되지 않는 가구·소품 19종의 실제 타일 도트.
import { pixels } from './home-space-art'
import type { FurnitureArt } from './furniture-art'
import type { DirectionalFurnitureArt } from './home-space-directions'

const mirror = (a: FurnitureArt): FurnitureArt => ({ ...a, rows:a.rows.map(r=>[...r].reverse().join('')) })
const four = (front: FurnitureArt, back = front, right = front): DirectionalFurnitureArt =>
  ({ down:front, up:back, left:mirror(right), right })
// 평평한 바닥 무늬만 평면상 회전한다. 세워진 물건에는 사용하지 않는다.
function floorTurn(a: FurnitureArt): FurnitureArt {
  const width=a.w*16, height=a.h*16
  return {w:a.h,h:a.w,rows:Array.from({length:width},(_,y)=>Array.from({length:height},(_,x)=>a.rows[height-1-x][y]).join(''))}
}
function floorViews(a: FurnitureArt): DirectionalFurnitureArt {
  const right=floorTurn(a),up=floorTurn(right),left=floorTurn(up)
  return {down:a,up,left,right}
}
function rug(w:number,h:number,purple=false,round=false):FurnitureArt {
  const a=pixels(w,h,[]), width=w*16,height=h*16
  for(let y=2;y<height-2;y++) for(let x=2;x<width-2;x++) {
    if(round && ((x-(width-1)/2)/(width/2-2))**2+((y-(height-1)/2)/(height/2-2))**2>1) continue
    const inset=Math.min(x-2,width-3-x,y-2,height-3-y)
    const center=Math.abs(x-(width-1)/2)<4 && Math.abs(y-(height-1)/2)<3
    const color=inset<2?(purple?'v':'r'):inset<4?'c':center?(purple?'V':'b'):'C'
    a.rows[y]=a.rows[y].slice(0,x)+color+a.rows[y].slice(x+1)
  }
  if(!round) for(let x=4;x<width-4;x+=4) for(const y of [0,1,height-2,height-1])
    a.rows[y]=a.rows[y].slice(0,x)+'c'+a.rows[y].slice(x+1)
  return a
}
const pot=pixels(1,1,[
  ['z',4,14,8,1], ['g',7,3,2,7], ['g',3,4,4,3], ['G',4,4,2,2],
  ['g',9,5,4,3], ['G',10,5,2,2], ['k',4,9,8,2], ['r',5,11,6,3], ['R',6,13,4,1],
])
const vase=pixels(1,1,[
  ['z',4,14,8,1], ['g',7,3,2,6], ['p',4,2,3,3], ['y',9,3,3,3],
  ['k',6,7,4,2], ['k',4,9,8,4], ['b',5,9,6,3], ['B',6,12,4,1], ['c',5,9,2,2],
])
const jar=pixels(1,1,[
  ['z',3,14,10,1], ['k',5,3,6,2], ['l',6,3,4,1], ['k',3,6,10,7],
  ['r',4,6,8,6], ['o',4,7,2,3], ['R',4,11,8,1], ['k',4,13,8,1],
])
const candle=pixels(1,1,[
  ['z',4,14,8,1], ['y',7,3,2,3], ['Y',7,4,1,2], ['C',6,7,4,6],
  ['c',6,7,3,5], ['k',4,13,8,1], ['l',5,12,6,1],
])
const bowl=pixels(1,1,[
  ['z',3,14,10,1], ['k',2,9,12,2], ['c',3,9,10,1],
  ['C',3,11,10,2], ['C',5,13,6,1], ['c',4,11,3,1],
])
const bird=pixels(1,1,[
  ['z',3,14,10,1], ['k',4,5,4,4], ['l',5,6,2,2], ['W',5,6,1,1],
  ['w',8,7,3,2], ['k',3,9,10,3], ['l',4,9,6,2], ['w',10,10,3,2],
  ['W',5,12,2,2], ['W',9,12,2,2],
])
const birdFront=pixels(1,1,[
  ['z',3,14,10,1], ['k',6,5,4,4], ['l',7,6,2,2], ['w',7,8,2,2],
  ['k',4,10,8,2], ['l',5,10,6,1], ['W',5,12,2,2], ['W',9,12,2,2],
])
const birdBack=pixels(1,1,[
  ['z',3,14,10,1], ['k',6,5,4,4], ['w',7,6,2,2],
  ['k',4,9,8,3], ['l',5,9,6,2], ['W',7,10,2,2], ['W',5,12,2,2], ['W',9,12,2,2],
])
const barrel=pixels(1,1,[
  ['z',3,15,10,1], ['k',3,2,10,13], ['k',2,5,12,7], ['l',4,3,8,2],
  ['W',4,5,8,1], ['w',3,6,10,7], ['l',4,6,2,7], ['W',10,6,1,7],
  ['s',3,6,10,2], ['s',3,11,10,2], ['w',4,13,8,1],
])
const wheel=pixels(1,1,[
  ['z',2,15,12,1], ['k',4,1,7,2], ['k',2,3,2,7], ['k',11,3,2,7],
  ['k',4,10,7,2], ['w',4,3,7,7], ['.',5,4,5,5], ['W',7,3,2,7],
  ['W',4,6,7,2], ['l',7,6,2,2], ['W',7,11,2,3], ['k',2,13,12,2],
  ['c',11,11,2,2],
])
const wheelBack=pixels(1,1,[
  ['z',2,15,12,1], ['k',4,1,7,2], ['k',2,3,2,7], ['k',11,3,2,7],
  ['k',4,10,7,2], ['W',4,3,7,7], ['.',5,4,5,5], ['w',7,3,2,7],
  ['w',4,6,7,2], ['W',7,11,2,3], ['k',2,13,12,2],
])
const wheelSide=pixels(1,1,[
  ['z',3,15,10,1], ['k',6,1,4,11], ['l',7,2,1,9], ['W',7,12,2,2],
  ['k',3,13,10,2], ['c',11,11,2,2], ['w',9,6,3,2],
])
const lampStand=pixels(1,1,[
  ['z',4,15,8,1], ['y',7,1,2,3], ['Y',7,2,1,1], ['k',4,4,8,2],
  ['r',5,4,6,1], ['W',7,6,2,7], ['l',7,6,1,6], ['k',4,13,8,2], ['w',5,13,6,1],
])
const plant=pixels(1,1,[
  ['z',3,15,10,1], ['g',4,2,8,7], ['g',2,4,12,3], ['G',4,2,4,3],
  ['G',9,4,3,2], ['W',7,8,2,3], ['k',3,10,10,2], ['r',4,12,8,3], ['R',5,14,6,1],
])
const shell=pixels(1,1,[
  ['z',4,14,8,1], ['k',7,6,3,2], ['k',5,8,7,2], ['k',3,10,10,3],
  ['p',6,8,5,2], ['o',4,10,8,2], ['c',7,8,2,4], ['p',5,12,7,1],
])
const shellBack=pixels(1,1,[
  ['z',4,14,8,1], ['k',7,6,3,2], ['k',5,8,7,2], ['k',3,10,10,3],
  ['C',6,8,5,2], ['c',4,10,8,2], ['C',5,12,7,1],
])
const shellSide=pixels(1,1,[
  ['z',5,14,7,1], ['k',7,7,3,3], ['k',5,10,7,3], ['p',8,8,1,2],
  ['o',6,11,5,1], ['c',6,12,5,1],
])
const scrolls=pixels(1,1,[
  ['z',3,14,10,1], ['C',4,5,3,8], ['c',5,6,1,6], ['w',4,5,3,1],
  ['C',8,7,4,6], ['c',9,8,2,4], ['w',8,7,4,1], ['b',4,9,3,1], ['r',8,10,4,1],
])
const inkpot=pixels(1,1,[
  ['z',4,14,8,1], ['l',10,4,2,5], ['k',5,8,6,2], ['S',5,10,6,3],
  ['s',6,10,2,2], ['k',5,13,6,1],
])
const flowers=pixels(1,1,[
  ['z',5,14,6,1], ['l',7,4,2,7], ['y',4,3,3,3], ['p',9,2,3,3],
  ['C',7,1,2,3], ['k',5,10,6,4], ['c',6,11,4,2], ['b',7,11,2,1],
])
const hourglass=pixels(1,1,[
  ['z',4,14,8,1], ['k',4,4,8,2], ['l',5,4,6,1], ['C',5,6,6,2],
  ['c',6,8,4,2], ['y',7,8,2,3], ['C',5,11,6,2], ['k',4,13,8,1], ['l',5,13,6,1],
])
const inkJar=pixels(1,1,[
  ['z',3,15,10,1], ['k',5,2,6,2], ['l',6,2,4,1], ['k',3,5,10,9],
  ['r',4,6,8,7], ['o',4,6,2,3], ['R',4,9,8,2], ['k',4,14,8,1],
])

export const REMAINING_FURNITURE_DIRECTIONS: Record<string,DirectionalFurnitureArt> = {
  rug:floorViews(rug(3,2)), pot:four(pot,mirror(pot)), vase:four(vase,mirror(vase)),
  jar:four(jar), candle:four(candle), bowl:four(bowl), bird:four(birdFront,birdBack,mirror(bird)),
  barrel:four(barrel), wheel:four(wheel,wheelBack,wheelSide), lampStand:four(lampStand),
  bigPlant:four(plant,mirror(plant)), roundRug:floorViews(rug(2,2,false,true)),
  shell:four(shell,shellBack,shellSide), purpleRug:floorViews(rug(2,1,true)),
  scrolls:four(scrolls,mirror(scrolls)), inkpot:four(inkpot,mirror(inkpot)),
  dryFlowers:four(flowers,mirror(flowers)), hourglass:four(hourglass), inkJar:four(inkJar),
}
export const REMAINING_FURNITURE_ART:Record<string,FurnitureArt> = Object.fromEntries(
  Object.entries(REMAINING_FURNITURE_DIRECTIONS).map(([id,views])=>[id,views.down]),
)

// 배치 아이템과 구분되는 고정 가구. 원본 1칸을 유지하며 방향 UI에는 연결하지 않는다.
const bed=pixels(1,1,[
  ['z',2,15,12,1], ['k',2,1,12,14], ['l',3,2,10,2], ['c',4,4,8,3],
  ['b',3,7,10,6], ['B',3,12,10,2], ['w',3,14,10,1],
])
const bedBack=pixels(1,1,[
  ['z',2,15,12,1], ['k',2,1,12,14], ['w',3,2,10,12], ['l',3,2,10,2],
  ['b',3,5,10,5], ['c',4,10,8,3], ['W',3,13,10,1],
])
const bedSide=pixels(1,1,[
  ['z',1,14,14,2], ['k',1,3,3,11], ['l',2,4,1,7], ['k',3,7,12,7],
  ['c',4,7,3,3], ['b',7,7,7,3], ['B',4,10,10,2], ['w',4,12,10,1],
])
function desk(back=false):FurnitureArt {
  return pixels(1,1,[
    ['z',1,14,14,2], ['W',2,11,2,4], ['W',12,11,2,4], ['k',1,4,14,8],
    ['l',2,5,12,5], ['w',2,10,12,1], [back?'w':'c',3,6,7,3],
    [back?'l':'C',4,7,4,1], ['r',12,4,2,2], ['y',12,3,2,1],
  ])
}
const deskSide=pixels(1,1,[
  ['z',2,14,12,2], ['W',3,12,2,3], ['W',11,12,2,3], ['k',2,3,12,10],
  ['l',3,4,10,7], ['w',3,11,10,1], ['c',5,5,5,4], ['C',6,6,3,1],
  ['r',11,4,2,2], ['y',11,3,2,1],
])
const workbench=pixels(1,1,[
  ['z',1,14,14,2], ['W',2,11,2,4], ['W',12,11,2,4], ['k',1,5,14,7],
  ['l',2,6,12,4], ['w',2,10,12,1], ['c',3,7,5,2], ['s',10,7,3,2], ['W',11,9,2,1],
])
const workBack=pixels(1,1,[
  ['z',1,14,14,2], ['W',2,11,2,4], ['W',12,11,2,4], ['k',1,5,14,7],
  ['w',2,6,12,5], ['l',2,6,12,2], ['W',7,9,2,2],
])
const workSide=pixels(1,1,[
  ['z',2,14,12,2], ['W',3,12,2,3], ['W',11,12,2,3], ['k',2,4,12,9],
  ['l',3,5,10,6], ['w',3,11,10,1], ['c',5,6,4,2], ['s',10,9,2,2],
])
const hearth=pixels(1,1,[
  ['z',1,15,14,1], ['S',1,2,14,13], ['s',2,3,12,5], ['S',2,7,12,1],
  ['W',4,9,8,5], ['r',4,12,8,2], ['s',2,14,12,1],
])
const hearthBack=pixels(1,1,[
  ['z',1,15,14,1], ['S',1,2,14,13], ['s',2,3,12,11], ['S',2,7,12,1],
  ['S',7,3,2,4], ['S',5,8,2,6],
])
const hearthSide=pixels(1,1,[
  ['z',2,15,12,1], ['S',2,2,12,13], ['s',3,3,10,11], ['S',3,7,10,1],
  ['W',11,9,2,5], ['s',3,14,10,1],
])
const loom=pixels(1,1,[
  ['z',1,15,14,1], ['k',1,1,3,14], ['k',12,1,3,14], ['l',2,2,12,2],
  ['c',4,4,8,8], ['b',4,5,2,7], ['p',8,5,2,7], ['w',2,12,12,2],
])
const loomBack=pixels(1,1,[
  ['z',1,15,14,1], ['k',1,1,3,14], ['k',12,1,3,14], ['l',2,2,12,2],
  ['C',4,4,8,8], ['W',7,4,2,8], ['w',2,12,12,2],
])
const loomSide=pixels(1,1,[
  ['z',3,15,10,1], ['k',4,1,3,14], ['l',5,2,1,12], ['W',11,8,2,7],
  ['w',6,9,7,2], ['C',7,4,2,7], ['b',8,5,2,6], ['k',3,14,10,1],
])
const cradle=pixels(1,1,[
  ['z',2,15,12,1], ['k',2,5,2,9], ['k',12,5,2,9], ['c',4,7,8,3],
  ['w',4,10,8,3], ['l',4,10,8,1], ['W',5,13,2,2], ['W',9,13,2,2],
])
const cradleBack=pixels(1,1,[
  ['z',2,15,12,1], ['k',2,5,12,8], ['w',4,6,8,6], ['l',4,6,8,2],
  ['W',5,13,2,2], ['W',9,13,2,2],
])
const cradleSide=pixels(1,1,[
  ['z',3,15,10,1], ['k',4,5,8,8], ['c',5,6,6,3], ['w',5,9,6,3],
  ['W',5,13,2,2], ['W',9,13,2,2],
])
const catcher=pixels(1,1,[
  ['s',2,1,12,2], ['S',3,3,10,2], ['s',4,5,8,2], ['W',5,5,2,2], ['W',9,5,2,2],
])
const catcherSide=pixels(1,1,[ ['s',4,1,8,2], ['S',5,3,6,2], ['W',6,5,2,2] ])
export const REMAINING_FIXTURE_DIRECTIONS:Record<string,DirectionalFurnitureArt> = {
  bed:four(bed,bedBack,bedSide), desk:four(desk(),desk(true),deskSide),
  workbench:four(workbench,workBack,workSide), hearth:four(hearth,hearthBack,hearthSide),
  loom:four(loom,loomBack,loomSide), cradle:four(cradle,cradleBack,cradleSide),
  fixedJar:four(jar), fixedPlant:four(pot,mirror(pot)),
  wideDesk:four(desk(),desk(true),deskSide), sootCatcher:four(catcher,catcher,catcherSide),
}

export const REMAINING_FIXTURE_ART:Record<string,FurnitureArt> = {
  b:bed, d:desk(), k:workbench, h:hearth, W:loom, g:jar, p:pot,
}
