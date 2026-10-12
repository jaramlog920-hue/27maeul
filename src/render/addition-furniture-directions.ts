import { pixels } from './home-space-art'
import { COZY_FURNITURE_ART } from './cozy-furniture-art'
import { HOUSEHOLD_FURNITURE_ART } from './household-furniture-art'
import { ROOM_FURNITURE_ART } from './room-furniture-art'
import type { FurnitureArt } from './furniture-art'
import type { DirectionalFurnitureArt } from './home-space-directions'

type Rect = readonly [string, number, number, number, number]
export const ADDITION_ART = { ...COZY_FURNITURE_ART, ...HOUSEHOLD_FURNITURE_ART, ...ROOM_FURNITURE_ART }
export const ADDITION_FACINGS = ['down', 'up', 'left', 'right'] as const
export const mirrorAddition = (art: FurnitureArt): FurnitureArt => ({ ...art, rows: art.rows.map(r => [...r].reverse().join('')) })
const rects = (art: FurnitureArt, marks: readonly Rect[]): FurnitureArt => {
  const layer = pixels(art.w, art.h, marks)
  return { ...art, rows: art.rows.map((row,y) => [...row].map((c,x) => layer.rows[y][x] === '.' ? c : layer.rows[y][x]).join('')) }
}
// Front views retain their approved original pixels. Rear and side construction are drawn separately.
function cabinet(w: number, top: number, side: boolean): FurnitureArt {
  const height = side ? w * 16 : 16, width = side ? 16 : w * 16
  const y = side ? Math.max(top, height - 19) : top
  const art = pixels(side ? 1 : w, side ? w : 1, [
    ['z',2,height-1,width-4,1], ['k',3,y,width-6,height-y-1],
    ['w',4,y+1,width-8,height-y-3], ['l',4,y+1,width-8,1],
    ['W',4,height-3,width-8,1],
  ])
  const seams: Rect[] = []
  for (let x=7;x<width-4;x+=5) seams.push(['W',x,y+3,1,height-y-6])
  return rects(art,seams)
}
function table(w: number, side: boolean, low = false): FurnitureArt {
  const h=side?w:1, width=side?16:w*16, height=h*16
  // Depth occupies the canvas; it must not turn a table into a tall cupboard.
  const top=side ? height-(low?9:12) : low?8:5
  const end=height-5, depth=end-top
  return pixels(side?1:w,h,[
    ['z',2,height-1,width-4,1], ['W',3,end,2,4], ['W',width-5,end,2,4],
    ['k',2,top,width-4,depth+1], ['l',3,top+1,width-6,depth-1],
    ['w',3,end-1,width-6,1],
  ])
}
function rack(w:number,side:boolean):FurnitureArt {
  const h=side?w:1, width=side?16:w*16,height=h*16,top=Math.max(1,height-(side?21:14))
  return pixels(side?1:w,h,[
    ['z',2,height-1,width-4,1], ['W',3,top+1,2,height-top-2], ['W',width-5,top+1,2,height-top-2],
    ['k',2,top,width-4,2], ['l',3,top,width-6,1], ['w',5,height-4,width-10,1],
  ])
}
function chair(back:boolean,rock=false):FurnitureArt {
  return pixels(1,1,[
    ['z',1,15,14,1], ['k',3,1,10,11], ['l',4,2,8,1], ['w',4,3,8,7],
    [back?'W':'b',5,4,1,6], [back?'W':'B',10,4,1,6],
    ['W',4,12,2,3], ['W',10,12,2,3], ...(rock?[['k',1,14,14,1] as Rect,['l',2,14,12,1] as Rect]:[]),
  ])
}
function chairSide(rock=false):FurnitureArt {
  return pixels(1,1,[
    ['z',1,15,14,1], ['k',3,1,3,11], ['l',4,2,1,6], ['k',5,8,8,4],
    ['b',6,8,6,2], ['B',6,10,6,1], ['k',11,6,3,2], ['l',11,6,2,1],
    ['W',5,12,2,2], ['W',11,12,2,2], ...(rock?[['k',1,14,14,1] as Rect,['l',2,14,12,1] as Rect]:[]),
  ])
}

const backs: Record<string,FurnitureArt> = {}, sides: Record<string,FurnitureArt> = {}
const storage = ['breadCupboard','linenCupboard','longDresser','wardrobe','jewelryBox','sewingBox','seedCabinet','fabricShelf','letterSorter','spiceShelf','vegetableCrate','fruitDisplay']
for(const id of storage) {
  const a=ADDITION_ART[id], small=id==='jewelryBox'||id==='sewingBox',top=small?8:id==='vegetableCrate'?7:id==='fruitDisplay'?5:2
  backs[id]=cabinet(a.w,top,false);sides[id]=cabinet(a.w,top,true)
}
// Keep toys, food and fabric visible above the body when seen from behind.
backs.breadCupboard=rects(backs.breadCupboard,[['y',5,1,4,3],['c',6,1,1,2],['l',10,2,3,2]])
sides.breadCupboard=rects(sides.breadCupboard,[['y',5,1,5,3],['c',6,1,1,2]])
backs.seedCabinet=rects(backs.seedCabinet,[['C',6,0,4,3],['C',14,1,4,2],['C',22,0,4,3]])
sides.seedCabinet=rects(sides.seedCabinet,[['C',6,10,4,3],['g',7,11,2,1]])
backs.vegetableCrate=rects(backs.vegetableCrate,[['g',3,5,4,2],['g',10,4,3,3]])
sides.vegetableCrate=rects(sides.vegetableCrate,[['g',4,5,3,3],['G',8,4,3,4]])
backs.fruitDisplay=rects(backs.fruitDisplay,[['r',5,3,5,3],['y',14,3,5,3],['g',23,3,4,3]])
sides.fruitDisplay=rects(sides.fruitDisplay,[['r',5,12,3,3],['y',9,12,3,3]])
const tables=['washstand','sewingTable','kneadingTable','lowTeaTable','vanity','millstoneStand','dishwashingTable','drawingDesk','mapTable','waterJarStand']
for(const id of tables) {
  const w=ADDITION_ART[id].w
  backs[id]=table(w,false,id==='lowTeaTable');sides[id]=table(w,true,id==='lowTeaTable')
}
// Separate top surfaces for each task; no bitmap rotation of upright objects.
const taskMarks: Record<string, {back:Rect[];side:Rect[]}> = {
  washstand:{back:[['C',3,3,7,3],['b',4,3,5,1],['c',11,1,3,4]],side:[['C',4,3,6,3],['b',5,3,4,1],['c',10,1,3,4]]},
  sewingTable:{back:[['C',13,5,8,3],['c',14,5,6,2],['b',5,3,3,3],['s',24,6,3,1]],side:[['C',5,13,6,13],['c',6,13,4,12],['b',6,17,4,1],['p',4,9,3,3],['s',10,11,2,1]]},
  kneadingTable:{back:[['C',21,2,5,4],['c',13,4,6,2],['w',4,4,7,1]],side:[['C',5,10,5,4],['c',5,17,6,2],['w',4,23,8,1]]},
  lowTeaTable:{back:[['C',12,9,8,3],['b',14,10,4,1],['c',7,7,3,3],['c',22,7,3,3]],side:[['C',5,21,6,5],['b',6,23,4,1],['c',6,19,3,2],['c',6,25,3,2]]},
  vanity:{back:[['k',9,1,12,7],['w',10,2,10,5],['W',15,3,1,4],['p',5,6,3,1]],side:[['k',3,10,3,13],['w',4,11,1,11],['p',9,17,3,2],['W',10,21,2,1]]},
  millstoneStand:{back:[['S',3,5,10,4],['s',4,4,8,3],['W',5,2,1,3]],side:[['S',3,5,10,4],['s',4,4,8,3],['W',10,2,1,3]]},
  dishwashingTable:{back:[['W',17,6,10,2],['b',18,6,8,1],['c',5,5,4,3],['c',10,5,4,3]],side:[['W',4,12,8,7],['b',5,13,6,4],['c',5,22,3,3],['c',9,22,3,3],['b',12,24,2,5]]},
  drawingDesk:{back:[['k',4,3,20,7],['w',5,4,18,5],['W',8,6,12,1],['b',26,5,3,4]],side:[['k',3,10,3,5],['k',5,14,3,5],['k',7,18,6,4],['c',4,11,1,3],['c',6,15,1,3],['b',10,23,3,4],['W',11,21,1,3]]},
  mapTable:{back:[['C',7,5,18,3],['g',18,6,3,1],['b',12,5,1,3],['r',9,6,1,1]],side:[['C',5,12,6,13],['g',6,15,2,2],['b',9,13,1,9],['r',7,21,1,1],['W',5,12,2,1]]},
  waterJarStand:{back:[['k',4,4,8,6],['r',5,5,6,4],['C',5,2,6,2],['W',6,1,1,3]],side:[['k',4,4,8,6],['r',5,5,6,4],['o',5,5,1,3],['C',5,2,6,2],['W',10,1,1,3]]},
}
for(const [id,marks] of Object.entries(taskMarks)) { backs[id]=rects(backs[id],marks.back);sides[id]=rects(sides[id],marks.side) }
// Work surfaces in profile share the front view's physical height. Draw their
// supplies on the surface rather than stretching them down the 2-tile canvas.
for(const id of ['sewingTable','kneadingTable','dishwashingTable','drawingDesk']) {
  const h=ADDITION_ART[id].w*16
  sides[id]=table(ADDITION_ART[id].w,true)
  const y=h-12
  const marks:Record<string,Rect[]>={
    sewingTable:[['C',5,y+2,6,4],['c',6,y+2,4,3],['b',5,y-2,3,2],['l',5,y-3,3,1]],
    kneadingTable:[['C',9,y-3,4,3],['c',10,y-3,2,2],['C',5,y+3,5,2]],
    dishwashingTable:[['W',4,y+1,8,4],['b',5,y+2,6,2],['C',10,y-2,3,2],['c',10,y-3,2,1]],
    drawingDesk:[['C',4,y+1,7,5],['c',5,y+1,5,4],['b',11,y+3,2,3]],
  }
  sides[id]=rects(sides[id],marks[id])
}
for(const id of ['herbRack','floralScreen','towelRack','paperDryingRack','potHanger','blanketLadder','plateRack','breadCoolingRack']) {
  const w=ADDITION_ART[id].w;backs[id]=rack(w,false);sides[id]=rack(w,true)
}
backs.floralScreen=pixels(2,1,[['z',2,15,28,1],['k',2,3,8,12],['C',3,4,6,9],['k',11,1,10,14],['C',12,2,8,11],['k',22,3,8,12],['C',23,4,6,9],['w',10,6,1,1],['w',21,10,1,1]])
sides.floralScreen=pixels(1,2,[['z',3,31,10,1],['k',4,10,3,20],['C',5,11,1,17],['k',7,13,3,17],['c',8,14,1,14],['k',10,16,3,14],['C',11,17,1,11],['p',5,19,1,2],['p',8,21,1,2],['p',11,23,1,2]])
backs.herbRack=rects(backs.herbRack,[['c',9,4,1,3],['g',7,7,5,4],['G',8,8,2,3],['c',16,4,1,3],['v',14,8,5,4],['c',23,4,1,3],['g',21,7,5,4]])
sides.herbRack=rects(sides.herbRack,[['c',7,13,1,3],['g',5,16,5,4],['G',6,17,1,2],['c',9,20,1,3],['v',7,23,5,4],['V',8,24,1,2]])
backs.towelRack=rects(backs.towelRack,[['b',4,5,3,6],['B',4,10,3,1],['C',8,5,4,8],['c',9,5,3,7]])
sides.towelRack=rects(sides.towelRack,[['C',5,4,3,9],['c',5,4,2,8],['b',9,6,2,6],['B',10,7,1,5]])
backs.paperDryingRack=rects(backs.paperDryingRack,[['W',5,4,22,1],['C',7,5,7,7],['C',18,5,7,6],['w',8,4,1,2],['w',19,4,1,2]])
sides.paperDryingRack=rects(sides.paperDryingRack,[['W',5,14,6,1],['C',5,15,3,9],['c',5,15,2,8],['C',9,19,3,9],['w',6,14,1,2],['w',10,18,1,2]])
backs.potHanger=rects(backs.potHanger,[['S',9,4,1,4],['t',6,8,8,6],['R',7,13,6,1],['S',21,4,1,3],['t',18,7,8,6],['R',19,12,6,1]])
sides.potHanger=rects(sides.potHanger,[['S',7,13,1,4],['t',5,17,6,5],['l',5,17,1,3],['S',9,21,1,3],['t',7,24,6,5],['R',8,28,4,1]])
backs.blanketLadder=rects(backs.blanketLadder,[['w',5,5,6,1],['C',5,5,5,5],['w',5,10,6,1],['b',7,10,4,4]])
sides.blanketLadder=rects(sides.blanketLadder,[['C',5,5,3,6],['c',5,5,2,5],['b',9,8,2,6]])
backs.plateRack=rects(backs.plateRack,[['C',5,6,3,6],['b',9,4,3,8],['l',3,12,10,1]])
sides.plateRack=rects(sides.plateRack,[['C',5,6,2,7],['b',8,4,2,9],['l',3,13,10,1]])
backs.breadCoolingRack=rects(backs.breadCoolingRack,[['l',3,8,26,1],['l',3,13,26,1],['y',6,5,8,3],['y',19,5,7,3],['y',6,10,8,3],['y',19,10,7,3]])
sides.breadCoolingRack=rects(sides.breadCoolingRack,[['l',3,19,10,1],['l',3,29,10,1],['y',5,15,6,4],['Y',6,15,1,3],['y',5,25,6,4],['Y',9,25,1,3]])
for(const id of ['rockingChair','armchair']) {backs[id]=chair(true,id==='rockingChair');sides[id]=chairSide(id==='rockingChair')}
for(const id of ['footstool','windowBench','dollBed']) {
  const w=ADDITION_ART[id].w;backs[id]=table(w,false,true);sides[id]=table(w,true,true)
}
backs.windowBench=rects(backs.windowBench,[['k',2,6,28,8],['w',3,7,26,6],['C',5,4,9,3],['b',18,4,9,3]])
sides.windowBench=rects(sides.windowBench,[['k',3,22,10,8],['w',4,23,8,6],['C',4,19,8,3],['b',5,20,6,2]])
backs.footstool=ADDITION_ART.footstool;sides.footstool=pixels(1,1,[['z',3,15,10,1],['W',4,12,2,3],['W',10,12,2,3],['k',3,9,10,4],['b',4,8,8,3],['B',4,11,8,1],['w',4,12,8,1]])
backs.dollBed=rects(backs.dollBed,[['k',2,7,12,7],['w',3,8,10,5],['l',3,8,10,1],['C',4,9,8,1]])
sides.dollBed=pixels(1,1,[['z',2,15,12,1],['k',3,7,2,7],['l',3,7,1,5],['k',5,10,9,4],['c',5,9,3,2],['p',8,10,4,2],['W',5,14,2,1],['W',11,14,2,1]])
backs.spoolStand=pixels(1,1,[['z',3,15,10,1],['k',3,13,10,2],['l',4,13,8,1],['W',4,8,1,5],['W',7,6,1,7],['W',10,8,1,5],['b',3,9,3,3],['c',6,7,3,5],['p',9,9,3,3],['l',3,12,9,1]])
sides.spoolStand=pixels(1,1,[['z',5,15,7,1],['k',5,13,7,2],['l',6,13,5,1],['W',6,6,1,7],['c',5,7,3,5],['W',9,8,1,5],['b',8,9,3,3],['l',5,12,6,1]])
backs.standingMirror=pixels(1,1,[['z',2,15,12,1],['W',3,6,2,9],['W',12,6,2,9],['k',6,1,5,1],['k',5,2,7,1],['k',4,3,9,10],['w',5,3,7,9],['W',8,4,1,8],['p',12,5,3,2],['k',2,14,4,1],['k',11,14,4,1]])
sides.standingMirror=pixels(1,1,[['z',3,15,10,1],['k',6,1,3,12],['l',6,2,1,10],['b',7,3,1,8],['W',10,7,2,7],['k',4,14,9,1],['p',8,5,3,2]])
backs.dollhouse=pixels(1,1,[['z',1,15,14,1],['k',2,6,12,9],['w',3,7,10,7],['r',6,1,4,1],['r',4,2,8,2],['r',2,4,12,2],['R',1,6,14,1],['p',3,4,10,1],['W',8,8,1,6],['W',11,1,2,3]])
sides.dollhouse=pixels(1,1,[['z',2,15,12,1],['k',3,6,10,9],['l',4,7,8,7],['r',6,2,4,2],['r',4,4,8,2],['R',3,6,10,1],['p',5,4,6,1],['c',6,8,4,3],['b',7,9,2,1],['W',10,1,2,3]])
backs.teaTrolley=rects(rack(1,false),[['l',2,7,12,1],['l',2,12,12,1],['c',5,9,5,2],['b',8,3,3,3],['c',4,4,3,2],['k',3,13,3,2],['k',10,13,3,2]])
sides.teaTrolley=rects(rack(1,true),[['l',3,7,10,1],['l',3,12,10,1],['b',5,3,3,3],['c',9,4,3,2],['c',5,9,5,2],['k',3,13,3,2],['k',10,13,3,2]])
backs.plantSteps=rects(table(2,false),[['l',2,11,11,1],['l',12,7,10,1],['l',21,4,9,1],['r',4,8,5,3],['g',5,5,3,3],['C',15,5,4,2],['g',16,2,2,3],['b',23,2,5,2],['g',24,0,3,2]])
sides.plantSteps=pixels(1,2,[['z',2,31,12,1],['W',3,16,2,15],['W',11,16,2,15],['l',3,28,10,1],['l',3,23,10,1],['l',3,18,10,1],['r',5,25,5,3],['g',6,22,3,3],['C',5,20,5,3],['g',6,18,3,2],['b',5,15,5,3],['g',6,13,3,2]])
backs.bootStand=pixels(1,1,[['z',1,15,14,1],['k',1,12,14,3],['l',2,12,12,1],['k',3,5,4,7],['b',4,6,2,5],['B',4,10,2,1],['k',9,4,4,8],['b',10,5,2,6],['B',10,10,2,1]])
sides.bootStand=pixels(1,1,[['z',2,15,12,1],['k',2,12,12,3],['l',3,12,10,1],['k',4,4,4,8],['k',7,9,6,3],['b',5,5,2,6],['b',7,10,5,1],['c',5,4,2,1]])
backs.cornerShelf=rects(cabinet(1,3,false),[['k',6,2,4,1],['l',4,3,8,1],['W',7,4,1,9]])
sides.cornerShelf=pixels(1,1,[['z',3,15,10,1],['W',4,2,2,13],['W',11,6,2,9],['l',4,4,4,1],['l',4,10,9,1],['w',4,11,8,1],['r',5,1,2,3],['b',9,8,3,2],['g',10,6,1,2]])
backs.coatTree=pixels(1,1,[['z',2,15,12,1],['W',7,1,2,13],['l',7,1,1,12],['W',3,3,10,1],['k',4,13,8,2],['C',8,5,5,7],['c',9,4,3,6],['r',3,4,3,2],['r',2,6,5,1]])
sides.coatTree=pixels(1,1,[['z',3,15,10,1],['W',7,1,2,13],['l',7,1,1,12],['W',5,3,7,1],['C',9,5,3,7],['c',9,5,2,6],['r',4,4,3,2],['r',3,6,5,1],['k',4,14,9,1]])
backs.musicStand=pixels(1,1,[['z',2,15,12,1],['W',7,8,2,6],['k',2,3,12,7],['w',3,4,10,4],['l',3,4,10,1],['W',4,6,8,1],['k',3,14,10,1]])
sides.musicStand=pixels(1,1,[['z',3,15,10,1],['W',7,8,2,6],['k',3,3,3,3],['k',5,5,3,3],['k',7,7,6,3],['C',4,3,2,2],['c',6,5,2,2],['C',8,7,4,1],['k',3,14,10,1]])
backs.smallHarp=mirrorAddition(ADDITION_ART.smallHarp)
sides.smallHarp=pixels(1,1,[['z',3,15,10,1],['k',5,2,2,12],['l',6,2,1,10],['k',7,1,4,2],['k',11,3,2,11],['c',8,3,1,9],['C',10,4,1,8],['w',7,12,5,2],['k',3,14,10,1]])
backs.toyCart=pixels(1,1,[['z',2,15,12,1],['k',2,5,12,6],['w',3,6,10,4],['l',3,5,10,1],['r',4,3,3,2],['b',8,2,3,3],['W',1,8,1,5],['W',14,8,1,5],['W',1,12,14,1],['k',3,13,3,2],['k',10,13,3,2]])
sides.toyCart=pixels(1,1,[['z',2,15,12,1],['W',1,6,1,6],['W',1,6,4,1],['k',4,8,9,5],['w',5,9,7,3],['l',5,8,7,1],['b',7,5,3,3],['r',5,6,2,2],['k',5,12,3,3],['k',10,12,3,3]])
backs.umbrellaStand=mirrorAddition(ADDITION_ART.umbrellaStand)
sides.umbrellaStand=pixels(1,1,[['z',4,15,8,1],['W',6,1,1,10],['W',7,1,2,1],['W',8,2,1,2],['b',5,4,3,7],['C',9,6,2,5],['k',4,10,8,5],['w',5,11,6,3],['l',5,11,1,3]])
backs.pickleStand=rects(table(2,false,true),[['r',4,5,6,6],['C',5,3,4,3],['W',5,5,4,1],['b',13,4,6,7],['C',14,2,4,3],['W',14,4,4,1],['r',22,5,6,6],['C',23,3,4,3],['W',23,5,4,1]])
sides.pickleStand=rects(table(2,true,true),[['r',5,10,6,6],['C',6,8,4,3],['W',6,10,4,1],['b',5,17,6,6],['C',6,15,4,3],['W',6,17,4,1],['r',5,24,6,5],['C',6,22,4,3]])

export const ADDITION_FURNITURE_DIRECTIONS: Record<string,DirectionalFurnitureArt> = {}
for(const [id,front] of Object.entries(ADDITION_ART)) {
  if(!backs[id] || !sides[id]) throw new Error(`Missing separately drawn furniture view: ${id}`)
  const view= id==='rockingChair' ? pixels(1,1,[['z',1,15,14,1],['k',3,1,10,10],['l',4,2,8,1],['w',4,3,8,5],['k',2,7,2,5],['k',12,7,2,5],['l',2,7,2,1],['l',12,7,2,1],['b',4,9,8,2],['B',4,11,8,1],['W',4,12,2,2],['W',10,12,2,2],['k',1,14,14,1],['l',2,14,12,1]])
    : id==='toyCart' ? pixels(1,1,[['z',2,15,12,1],['W',1,5,1,7],['W',14,5,1,7],['W',1,5,14,1],['k',2,8,12,5],['w',3,9,10,3],['l',3,8,10,1],['r',4,6,3,2],['b',9,6,3,2],['k',3,13,3,2],['k',10,13,3,2]]) : front
  ADDITION_FURNITURE_DIRECTIONS[id]={down:view,up:backs[id],left:mirrorAddition(sides[id]),right:sides[id]}
}
