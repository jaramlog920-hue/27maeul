import { pixels } from './home-space-art'
import { HOME_SPACE_DIRECTIONS, type DirectionalFurnitureArt } from './home-space-directions'
import { REMAINING_FIXTURE_DIRECTIONS } from './remaining-furniture-art'
import type { FurnitureArt } from './furniture-art'

type Rect = readonly [string, number, number, number, number]
const p = (r: Rect[], w = 1, h = 1) => pixels(w, h, r)
const flip = (a: FurnitureArt): FurnitureArt => ({ ...a, rows: a.rows.map(r => [...r].reverse().join('')) })
const board = (paper = true) => p([['z',2,14,12,1],['k',2,2,12,12],['w',3,3,10,10],['l',3,3,10,1], ...(paper ? [['c',4,4,8,8],['b',5,5,5,1],['b',5,8,4,1]] as Rect[] : [])])
const bread = (round = false) => p([['z',2,13,12,2],['k',2,8,12,5],['w',3,7,10,5],['l',4,6,8,4],['c',5,7,2,1],['c',9,7,2,1],...(round ? [['y',5,9,6,2]] as Rect[] : [])])
const cloth = (color: string, pattern = false) => p([['z',1,14,14,1],['k',1,3,14,11],[color,2,4,12,9],['c',3,5,10,1],['c',3,11,10,1],...(pattern ? [['C',4,7,2,2],['C',7,9,2,2],['C',10,7,2,2]] as Rect[] : [])])
const pot = (stage: number) => p([['z',4,14,8,1],['k',4,10,8,4],['r',5,11,6,2],['l',5,10,6,1],['W',7,5,1,5],['g',stage===0?4:3,stage===0?8:5,4,2],['G',8,stage===0?7:3,4,2],...(stage===2 ? [['g',5,2,3,2],['G',9,6,3,2]] as Rect[] : [])])
const bag = (fixed: boolean) => p([['z',3,14,10,1],['k',4,2,8,5],['.',5,3,6,3],['k',2,6,12,8],['w',3,7,10,6],['l',3,7,10,2],['W',7,9,2,4],[fixed?'s':'r',7,9,2,2],['l',4,11,2,1]])
const net = (fixed: boolean) => p([['z',1,14,14,1],['W',1,2,14,1],['W',1,12,14,1],['s',2,3,1,9],['s',5,3,1,9],['s',9,3,1,9],['s',13,3,1,9],['s',2,5,12,1],['s',2,9,12,1],...(!fixed?[['.',5,7,5,3]] as Rect[]:[])])
const box = (filled: boolean) => p([['z',1,14,14,1],['k',1,6,14,8],['W',2,7,12,6],['l',2,12,12,1],...(filled?[['s',4,8,3,2],['g',9,7,3,2],['C',8,10,3,1]] as Rect[]:[])])
const notebook = (open: boolean) => open ? p([['k',1,3,14,10],['c',2,4,5,8],['C',8,4,6,8],['w',7,3,1,10],['b',3,6,3,1],['b',9,7,3,1]]) : p([['k',4,2,9,12],['b',5,3,7,10],['c',6,4,5,1],['C',6,11,5,1],['w',5,3,1,10]])

/** Static props: direction independent unless present in EXPANSION_VIEWS. */
export const EXPANSION_PROPS: Record<string, FurnitureArt> = {
  restSign: board(), schedule: board(), sharedPlan: board(), nameSign: board(false), drawingBoard: board(false),
  flowerDrawing: p([['k',2,2,12,12],['c',3,3,10,10],['g',7,7,1,5],['G',8,9,3,1],['r',6,5,3,3],['y',7,6,1,1]]),
  cloudDrawing: p([['k',2,2,12,12],['b',3,3,10,10],['c',4,5,7,2],['c',6,4,3,1],['g',3,11,10,2]]),
  beeDrawing: p([['k',2,2,12,12],['c',3,3,10,10],['b',5,5,2,2],['b',9,5,2,2],['y',6,7,5,3],['W',8,7,1,3],['g',4,11,8,1]]),
  notebookClosed: notebook(false), notebookOpen: notebook(true), album: p([['k',2,2,12,12],['b',3,3,10,10],['C',5,5,6,6],['g',6,9,4,1],['r',7,6,2,2],['w',3,3,1,10]]),
  breadPlain: bread(), breadRound: bread(true), dough: p([['z',2,13,12,1],['w',2,11,12,2],['C',4,8,8,3],['c',6,7,4,2]]),
  breadTray: p([['k',1,8,14,6],['w',2,9,12,4],['l',3,7,4,4],['l',9,7,4,4],['c',4,8,2,1],['c',10,8,2,1]]),
  snackPlate: p([['z',1,13,14,1],['B',1,10,14,3],['c',2,10,12,2],['l',3,8,4,3],['r',9,8,3,3],['y',10,8,1,1]]),
  teaTray: p([['k',1,10,14,4],['l',2,11,12,2],['b',3,7,4,4],['c',3,7,4,1],['B',9,7,4,4],['c',9,7,4,1]]),
  cupPersonal: p([['z',2,13,12,1],['B',3,6,8,6],['c',4,6,6,1],['c',5,8,4,1],['B',11,7,3,3],['.',12,8,1,1],['C',2,12,12,1]]),
  coaster: p([['k',3,6,10,6],['b',4,7,8,4],['c',5,8,6,1],['c',5,10,6,1]]),
  clothBlue: cloth('b'), clothRose: cloth('p'), clothPattern: cloth('b',true), clothEdge: cloth('g',true),
  yarnPair: p([['z',1,14,14,1],['W',2,3,4,11],['b',1,6,6,5],['c',2,7,4,1],['W',10,3,4,11],['p',9,6,6,5],['c',10,7,4,1]]),
  needleTools: p([['w',2,12,12,1],['S',4,3,1,9],['c',4,3,1,1],['b',8,7,5,4],['C',9,8,3,1]]),
  woodParts: p([['z',1,14,14,1],['W',2,8,12,4],['l',3,8,10,1],['w',4,3,3,8],['l',4,3,1,8],['w',10,5,3,7]]),
  planeTool: p([['z',2,13,12,1],['W',2,10,12,3],['l',3,10,10,1],['k',7,5,3,5],['s',8,6,1,4],['w',3,7,3,3]]),
  metalParts: p([['z',2,14,12,1],['S',3,7,4,3],['s',4,7,3,1],['S',9,4,3,7],['s',9,4,3,1],['S',7,12,6,1]]),
  ornamentRing: p([['S',4,3,8,2],['S',3,5,2,6],['S',11,5,2,6],['S',4,11,8,2],['s',5,3,6,1],['r',6,8,4,2]]),
  hookNamed: p([['w',2,3,12,2],['S',7,5,2,6],['S',8,10,4,2],['S',11,8,2,3],['r',3,5,2,4],['c',4,6,1,2]]),
  toolRack: p([['W',1,3,14,3],['l',2,3,12,1],['S',3,6,1,7],['w',2,8,3,2],['S',8,6,1,6],['w',6,6,5,2],['s',12,6,1,7]]),
  apron: p([['W',5,2,6,2],['.',6,3,4,1],['b',5,5,6,8],['B',3,8,10,5],['c',6,9,4,3],['w',2,7,3,1],['w',11,7,3,1]]),
  bagWorn: bag(false), bagRepaired: bag(true), potWilted: pot(0), potGrowing: pot(1), potNewLeaf: pot(2),
  netTorn: net(false), netRepaired: net(true), displayEmpty: box(false), displaySeason: box(true),
  seedPackets: p([['k',2,4,5,9],['C',3,5,3,7],['g',4,7,1,2],['k',8,5,6,9],['c',9,6,4,7],['r',10,8,2,2]]),
  wateringCan: p([['z',2,14,12,1],['G',5,7,7,6],['g',6,8,5,3],['G',10,4,4,5],['.',11,5,2,2],['G',2,6,4,2],['s',1,5,2,2]]),
  woolSorted: p([['w',1,12,14,2],['C',2,8,5,4],['c',3,7,3,3],['C',9,8,5,4],['c',10,7,3,3]]),
  oilEmpty: p([['W',5,4,6,2],['k',4,6,8,8],['l',5,7,6,6],['c',6,8,2,4]]),
  oilFull: p([['W',5,4,6,2],['k',4,6,8,8],['y',5,7,6,6],['c',6,8,2,4]]),
  toyBoatParts: p([['w',2,10,12,3],['l',3,10,10,1],['W',7,3,2,6],['C',10,4,3,4]]),
  toyBoat: p([['z',2,14,12,1],['W',2,11,12,2],['w',4,13,8,1],['W',7,2,1,9],['C',8,3,5,6],['c',8,3,1,6],['b',2,10,12,1]]),
  toyBall: p([['z',4,13,8,1],['k',4,5,8,8],['r',5,5,6,7],['c',5,7,6,2],['b',7,5,2,7]]),
  petBlanket: cloth('g'), petToy: p([['W',2,8,12,4],['w',2,7,3,6],['w',11,7,3,6],['l',5,9,6,1]]),
  wrappedGoods: p([['z',2,14,12,1],['k',2,5,12,9],['C',3,6,10,7],['w',7,5,2,9],['w',2,9,12,1]]),
  flowerBorder: p([['W',1,12,14,2],['g',3,8,1,4],['g',7,7,1,5],['g',12,8,1,4],['r',2,6,3,3],['y',6,5,3,3],['p',11,6,3,3]]),
  buildMaterials: p([['W',1,9,14,5],['l',2,9,12,1],['w',1,11,14,1],['S',6,5,6,3],['s',7,5,4,1]]),
  candleDecor: p([['z',3,14,10,1],['B',3,8,10,5],['b',4,9,8,3],['c',6,5,4,4],['W',7,3,1,2],['y',7,2,2,2]]),
  plantSupport: p([['W',3,2,2,12],['W',11,2,2,12],['l',3,5,10,1],['l',3,9,10,1],['g',7,6,2,7],['G',5,7,3,2]]),
  basketEmpty: p([['k',3,3,10,5],['.',4,4,8,3],['W',2,8,12,6],['l',3,9,10,1],['w',4,11,1,2],['w',8,11,1,2]]),
  basketGrapes: p([['k',3,3,10,5],['.',4,4,8,3],['v',4,7,3,3],['V',8,7,3,3],['W',2,10,12,4],['l',3,10,10,1]]),
  candlePlain: p([['W',4,12,8,2],['c',5,5,6,7],['C',8,5,3,7],['W',7,3,1,2]]),
  ringRound: p([['S',5,3,6,2],['S',3,5,2,6],['S',11,5,2,6],['S',5,11,6,2],['s',5,3,5,1]]),
  ringSquare: p([['S',3,3,10,2],['S',3,5,2,6],['S',11,5,2,6],['S',3,11,10,2],['s',4,3,8,1]]),
  invitation: p([['k',2,4,12,8],['C',3,5,10,6],['c',4,5,8,1],['w',4,6,2,1],['w',10,6,2,1],['r',7,8,2,2]]),
  seasonalLeaves: p([['W',3,3,1,10],['g',4,3,4,2],['G',5,5,4,2],['r',8,8,4,2],['y',9,10,3,2]]),
  smoothStones: p([['S',2,9,5,4],['s',3,8,3,2],['S',9,7,5,6],['s',10,6,3,2],['W',10,9,3,1]]),
  woodenFinishLight: p([['k',2,3,12,10],['l',3,4,10,8],['w',5,4,1,8],['w',10,4,1,8]]),
  woodenFinishDark: p([['k',2,3,12,10],['W',3,4,10,8],['w',5,4,1,8],['w',10,4,1,8]]),
  cushionPattern: p([['k',2,5,12,8],['b',3,5,10,7],['c',4,6,8,1],['C',5,8,2,2],['C',9,8,2,2],['B',3,11,10,1]]),
  namePlate: p([['k',2,6,12,5],['l',3,7,10,3],['W',4,8,2,1],['W',8,8,3,1]]),
}

function structure(front: FurnitureArt, back: FurnitureArt, side: FurnitureArt): DirectionalFurnitureArt {
  return { down: front, up: back, left: flip(side), right: side }
}
const stallFront = (stage: 'closed'|'open') => p([['z',1,29,46,2],['W',3,12,3,17],['W',42,12,3,17],['k',1,10,46,8],['b',2,11,44,5],['B',2,16,44,1],['l',2,10,44,1], ...(stage==='open'?[['c',5,8,8,2],['l',18,6,8,4],['p',31,7,8,3]] as Rect[]:[])],3,2)
const stallBack = p([['z',1,29,46,2],['W',3,11,3,18],['W',42,11,3,18],['k',1,10,46,8],['w',2,11,44,6],['l',2,10,44,1]],3,2)
const stallSide = p([['z',2,44,12,2],['W',3,4,2,39],['W',11,4,2,39],['k',2,3,12,31],['b',3,4,10,29],['l',3,4,1,29]],1,3)
const rackFront = p([['z',1,29,30,2],['W',2,3,3,26],['W',27,3,3,26],['w',2,6,28,3],['w',2,17,28,3],['l',3,6,26,1]],2,2)
const rackBack = p([['z',1,29,30,2],['k',2,3,28,26],['w',3,4,26,24],['W',9,4,1,24],['W',21,4,1,24]],2,2)
const rackSide = p([['z',2,29,12,2],['W',3,3,3,26],['W',10,3,3,26],['w',3,6,10,3],['w',3,17,10,3]],1,2)
export const EXPANSION_VIEWS: Record<string, DirectionalFurnitureArt> = {
  marketClosed: structure(stallFront('closed'),stallBack,stallSide),
  marketOpen: structure(stallFront('open'),stallBack,stallSide),
  dockRack: structure(rackFront,rackBack,rackSide),
  constructionFrame: structure(rackFront,rackBack,rackSide),
  chestOpen: structure(p([['z',2,14,12,1],['k',2,1,12,5],['l',3,2,10,3],['k',2,8,12,6],['W',3,9,10,3],['c',4,10,3,2],['w',3,12,10,1]]),p([['k',2,1,12,13],['w',3,2,10,11],['l',3,2,10,1],['W',7,2,1,11]]),p([['k',3,2,9,4],['l',4,3,7,2],['k',3,8,10,6],['W',4,9,8,4]])),
  cupboardOpen: structure(p([['k',2,1,28,14],['W',3,2,26,12],['l',4,6,24,1],['l',4,11,24,1],['c',6,3,4,3],['b',17,8,5,3],['w',1,2,3,12],['w',28,2,3,12]],2),p([['k',2,1,28,14],['w',3,2,26,12],['W',10,2,1,12],['W',21,2,1,12]],2),p([['k',3,1,10,14],['w',4,2,8,12],['W',10,4,1,9]])),
  chairUnfinished: structure(p([['W',3,2,2,12],['w',5,2,8,2],['l',4,8,9,3],['W',10,11,2,3],['s',4,12,2,2]]),p([['W',3,2,2,12],['w',5,2,8,2],['w',5,8,8,2],['W',10,4,2,10]]),p([['W',3,2,2,12],['l',4,8,9,3],['W',10,11,2,3],['s',4,12,2,2]])),
  shadeFrame: structure(p([['W',2,2,3,29],['W',43,2,3,29],['l',2,2,44,3]],3,2),p([['W',2,2,3,29],['W',43,2,3,29],['w',2,2,44,3]],3,2),p([['W',3,2,2,44],['W',11,2,2,44],['l',3,2,10,3]],1,3)),
  shadeComplete: structure(p([['W',2,7,3,24],['W',43,7,3,24],['k',1,2,46,7],['b',2,3,44,5],['c',7,3,4,5],['c',19,3,4,5],['c',31,3,4,5]],3,2),p([['W',2,7,3,24],['W',43,7,3,24],['k',1,2,46,7],['B',2,3,44,5]],3,2),p([['W',3,7,2,39],['W',11,7,2,39],['k',2,2,12,33],['b',3,3,10,31],['c',3,10,10,3],['c',3,23,10,3]],1,3)),
}

/** Split existing furniture without repainting it; combined layers reconstruct original art. */
export const FURNITURE_USE_LAYERS: Record<string, Record<string, { back: FurnitureArt; front: FurnitureArt }>> = {}
for (const id of ['chair','stool','longBench','table','daybed','lectern']) {
  const entries = HOME_SPACE_DIRECTIONS[id]
  FURNITURE_USE_LAYERS[id] = {}
  for (const [facing,a] of Object.entries(entries)) {
    const cut = id==='daybed' ? Math.floor(a.rows.length*0.65) : Math.floor(a.rows.length*0.72)
    const mask = (front: boolean): FurnitureArt => ({...a, rows:a.rows.map((r,y)=> (y>=cut)===front?r:'.'.repeat(r.length))})
    FURNITURE_USE_LAYERS[id][facing]={back:mask(false),front:mask(true)}
  }
}
for (const id of ['bed','desk','workbench','loom','wideDesk','cradle']) {
  FURNITURE_USE_LAYERS[id] = {}
  for (const [facing,a] of Object.entries(REMAINING_FIXTURE_DIRECTIONS[id])) {
    const cut = id==='bed' ? 10 : 12
    FURNITURE_USE_LAYERS[id][facing]={back:{...a,rows:a.rows.map((r,y)=>y<cut?r:'.'.repeat(r.length))},front:{...a,rows:a.rows.map((r,y)=>y>=cut?r:'.'.repeat(r.length))}}
  }
}
