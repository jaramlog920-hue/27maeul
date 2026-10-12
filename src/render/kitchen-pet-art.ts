import type { Facing } from '../engine/types'
import { FURNI_PALETTE } from './furniture-art'
import { furnitureUseFrame } from './furniture-use-motion'
import { petMotionRows, petStillRows, compactPetRows } from './pet-art'
import type { SpriteOpts } from './sprites'

export const KITCHEN_PET_PALETTE = { ...FURNI_PALETTE, z: '#5a4638', q: '#79516f', Q: '#b887ac', d: '#cd8790', D: '#9e626e', h: '#c5e5e2', H: '#679fa1' }
type Rect = [string, number, number, number, number]
const grid = (n: number) => Array.from({ length: n }, () => Array<string>(n).fill('.'))
function rect(p: string[][], c: string, x: number, y: number, w: number, h: number) {
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (p[y + dy]?.[x + dx] !== undefined) p[y + dy][x + dx] = c
}
function shape(rs: Rect[], n = 16) { const p = grid(n); rs.forEach(r => rect(p, ...r)); return p.map(r => r.join('')) }
const bowl: Rect[] = [['H',3,8,10,3],['b',4,9,8,3],['H',5,12,6,1],['c',3,7,10,2]]
const loaf: Rect[] = [['W',3,8,10,4],['l',3,7,10,4],['y',4,6,8,3],['C',5,7,1,2],['C',8,7,1,2],['g',10,8,2,1],['g',5,10,2,1],['G',9,10,1,1]]
const pot: Rect[] = [['S',2,7,12,6],['s',3,8,10,4],['S',0,8,2,2],['S',14,8,2,2],['W',3,6,10,2],['Y',4,6,8,2],['w',5,7,1,1],['w',9,6,1,1]]
export const KITCHEN_PET_ITEMS: Record<string, { label: string; rows: string[]; group: string }> = {}
function item(id: string, label: string, rs: Rect[], group = 'cooking') { KITCHEN_PET_ITEMS[id] = { label, rows: shape(rs), group } }
item('grapeJuice','포도즙', [['H',5,3,6,10],['h',6,4,4,8],['q',6,7,4,5],['Q',6,7,2,1],['c',5,3,6,1],['H',11,5,2,5],['h',11,6,1,3],['c',7,4,1,2]])
item('grapeCluster','포도 송이', [['g',8,2,1,3],['G',9,2,3,1],['q',4,5,7,5],['Q',4,5,2,2],['Q',8,5,2,2],['q',5,9,5,2],['Q',6,8,2,2],['q',7,11,2,2]])
item('juiceJug','포도즙 주전자', [['W',6,2,4,2],['r',4,4,8,9],['p',5,5,2,6],['q',6,3,4,1],['W',12,5,2,5],['r',3,4,2,2]])
item('grapePress','포도 압착 그릇', [...bowl,['q',4,7,8,2],['Q',5,7,2,1],['W',7,2,2,6],['l',7,2,1,5]])
item('barleyPorridge','보리죽', [...bowl,['Y',4,7,8,2],['w',5,7,1,1],['w',8,8,1,1],['w',10,7,1,1],['c',6,3,1,2],['C',10,4,1,2]])
item('barleyPot','보리죽 냄비', [...pot,['c',5,2,1,2],['C',10,3,1,2]])
item('barleyGrain','보리 한 줌', [['w',3,11,10,2],['y',4,9,8,2],['Y',5,8,6,2],['w',6,9,1,1],['w',9,10,1,1],['Y',8,7,2,1]])
item('oliveBread','올리브빵', [['H',2,12,12,1],['c',2,11,12,1],...loaf])
item('oliveDough','올리브 반죽', [['w',2,12,12,1],['C',4,9,8,3],['c',5,8,6,3],['g',6,9,1,1],['g',9,10,1,1]])
item('oliveMix','올리브 반죽 그릇', [...bowl,['C',4,7,8,2],['c',5,6,6,2],['g',6,7,1,1],['g',9,7,1,1]])
item('breadTray','올리브빵 굽기 판', [['S',1,11,14,3],['s',2,11,12,2],...loaf])
item('petCushion','펫 방석', [['D',1,8,14,5],['d',2,7,12,5],['p',3,8,10,2],['D',3,12,10,1],['C',3,8,1,1],['C',12,8,1,1]],'pets')
item('yarnBall','펫 실뭉치', [['D',4,5,7,7],['d',3,6,9,5],['p',5,5,4,1],['D',4,8,7,1],['p',5,10,6,1],['D',11,10,1,3],['D',12,12,2,1]],'pets')
item('petWaterBowl','펫 물그릇', [['H',2,8,12,4],['b',3,9,10,3],['h',3,7,10,2],['H',4,12,8,1],['c',5,7,3,1]],'pets')

export const KITCHEN_ACTIONS = { pressGrapes:'포도 으깨기', pourGrapeJuice:'포도즙 따르기', stirBarleyPorridge:'보리죽 젓기', ladleBarleyPorridge:'보리죽 담기', mixOliveDough:'올리브 반죽 섞기', shapeOliveBread:'올리브빵 빚기', bakeOliveBread:'올리브빵 굽기', serveOliveBread:'올리브빵 담기' }
export type KitchenAction = keyof typeof KITCHEN_ACTIONS
function stamp(p: string[][], rows: readonly string[], ox: number, oy: number) { rows.forEach((r,y) => [...r].forEach((c,x) => { if(c!=='.' && p[oy+y]?.[ox+x]!==undefined) p[oy+y][ox+x]=c })) }
const mirror = (rows: string[]) => rows.map(r => [...r].reverse().join(''))
export function kitchenFrame(facing: Facing, action: KitchenAction, f: number, opts: SpriteOpts) {
  const d = facing === 'left' ? 'right' : facing, phase = f % 4, beat = [0,1,0,-1][phase]
  const actor = furnitureUseFrame('writer',d,'craft',0,opts,false).actor.map(r => [...r])
  const back = grid(24), front = grid(24), hands = grid(24), props = d==='up' ? back : front
  // Work stays at waist height. No skin-colored patch replaces the clothing.
  const ox = d==='up' ? -2 : d==='right' ? 8 : 4, oy = d==='up' ? 6 : 8
  let id = action==='pressGrapes' ? 'grapePress' : action==='pourGrapeJuice' ? 'grapeJuice' : action==='stirBarleyPorridge' ? 'barleyPot' : action==='ladleBarleyPorridge' ? 'barleyPorridge' : action==='mixOliveDough' ? 'oliveMix' : action==='shapeOliveBread' ? 'oliveDough' : action==='bakeOliveBread' ? 'breadTray' : 'oliveBread'
  stamp(props,KITCHEN_PET_ITEMS[id].rows,ox,oy+(action==='bakeOliveBread'?[0,1,2,1][phase]:0))
  const hx = d==='up' ? 6 : d==='right' ? 15 : 9, hy = d==='up' ? 13 : 15
  if(action==='pressGrapes') rect(props,'W',ox+7,oy+2+beat,2,5)
  if(action==='stirBarleyPorridge'||action==='mixOliveDough') { rect(props,'W',ox+7+beat,oy+3,1,5); rect(props,'l',ox+7+beat,oy+3,1,2) }
  if(action==='pourGrapeJuice') {
    const jx=ox+2, jy=oy+2-(phase===1||phase===2?1:0)
    stamp(props,shape([['W',2,0,3,1],['r',1,1,5,5],['p',2,2,1,3],['W',6,2,1,3],['r',5,1,2,1]],8),jx,jy)
    if(phase===1||phase===2) rect(props,'q',jx+6,jy+2,1,3)
  }
  if(action==='ladleBarleyPorridge') {rect(props,'W',ox+9,oy+3-beat,1,5);rect(props,'Y',ox+8,oy+7-beat,3,1)}
  if(action==='bakeOliveBread') { rect(back,'W',2,14,20,8);rect(back,'r',3,14,18,7);rect(back,'W',7,15,10,5);rect(back,'R',8,18,8,2);rect(back,'y',10+beat,18,3,1) }
  // Tiny hands touch the tool/food; they never grow an extended sleeve.
  rect(actor,'s',hx,hy+(action==='shapeOliveBread'?beat:0),2,1)
  if(d==='down') rect(actor,'s',14,hy,2,1)
  // At the front, hands sit over the near edge of the work surface.
  if(d!=='up') {rect(hands,'s',hx,hy+(action==='shapeOliveBread'?beat:0),2,1);if(d==='down')rect(hands,'s',14,hy,2,1)}
  if(action==='serveOliveBread' && phase!==0) rect(props,'C',ox+5+beat,oy+7,1,2)
  const conv=(p:string[][])=> facing==='left'?mirror(p.map(r=>r.join(''))):p.map(r=>r.join(''))
  return {actor:conv(actor),back:conv(back),front:conv(front),hands:conv(hands),duration:[360,260,360,260][phase]}
}

export const PET_SUPPLY_ACTIONS = { restOnCushion:'방석에서 쉬기', playYarn:'실뭉치 놀이', drinkWater:'물 마시기' }
export function petSupplyFrame(kind:'cat'|'dog', baby:boolean, facing:Facing, action:keyof typeof PET_SUPPLY_ACTIONS, f:number) {
  const actor=grid(32),back=grid(32),front=grid(32),phase=f%4
  if(action==='restOnCushion') {
    stamp(back,KITCHEN_PET_ITEMS.petCushion.rows,8,12)
    if(facing==='left'||facing==='right') {
      const rows = baby
        ? (kind==='cat'?['.A..A....','AaAAaA...','nweaaAAA.','.AwwaaaA.','..AAAAAA.']:['..AAA....','.AeaaA...','nwwAAaAA.','.AAAwwaaA','...AAAAA.'])
        : null
      const canvas=grid(16)
      if(rows) stamp(canvas,rows,3,14-rows.length)
      const pose=rows ? compactPetRows(kind,canvas.map(r=>r.join(''))) : petStillRows(kind,'curl')
      stamp(actor,facing==='right'?mirror(pose):pose,8,6)
    } else {
      const rows=petMotionRows(kind,facing,'wait',phase,baby)
      stamp(actor,rows,8,6)
    }
    if(phase===2) for(const r of actor)for(let x=0;x<32;x++)if(r[x]==='e')r[x]='A'
    if(phase===3) rect(front,'C',23,10,1,2)
  } else {
    const rows=petMotionRows(kind,facing,action==='drinkWater'?'sniff':'wag',phase,baby)
    stamp(actor,rows,8,action==='drinkWater'?(baby?7:9):6)
    if(action==='playYarn') {
      const x=(facing==='left'?2:facing==='right'?22:11)+[0,1,2,1][phase],y=facing==='up'?5:18
      const toy=shape([['D',0,1,5,3],['d',1,0,3,5],['p',1,1,2,1],['D',1,3,3,1],['D',4,4,3,1]],8)
      stamp(facing==='up'?back:front,toy,x,y)
    } else {
      const x=facing==='left'?2:facing==='right'?22:12,y=facing==='up'?8:16
      const water=shape([['H',0,2,8,3],['b',1,3,6,2],['h',1,1,6,2],['c',2+(phase%2),1,2,1]],8)
      stamp(facing==='up'?back:front,water,x,y)
      if(facing!=='up'&&phase%2)rect(front,'h',x+3,y,1,1)
    }
  }
  return {actor:actor.map(r=>r.join('')),back:back.map(r=>r.join('')),front:front.map(r=>r.join('')),duration:action==='restOnCushion'?650:380}
}
