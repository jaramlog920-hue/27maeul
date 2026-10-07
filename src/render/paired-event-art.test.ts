import { pairedGiftFrame,pairedMemorialFrame,PAIRED_GIFTS,PAIRED_DIRECTIONS,PAIRED_EVENT_PALETTE,PAIR_EXAMPLE_LOOKS } from './paired-event-art'
import { completionSceneFrame,COMPLETION_PALETTE,COMPLETION_EXAMPLE_LOOKS } from './completion-celebration-art'
import { EVENT_MEMORIES,eventMemoryRows } from './archive-followup-art'
import { spriteRows } from './sprites'
function valid(rows:string[],w:number,h:number,pal:Record<string,string>){expect(rows.length).toBe(h);for(const r of rows){expect(r.length).toBe(w);for(const c of r)expect(c==='.'||c in pal,`색 ${c}`).toBe(true)}}
const flip=(rows:string[])=>rows.map(r=>[...r].reverse().join(''))
describe('함께하는 이벤트 자산',()=>{
 it('선물과 기념물 모든 프레임의 분리 레이어가 유효하고 발 위치가 고정된다',()=>{
  for(const direction of PAIRED_DIRECTIONS)for(const make of [...PAIRED_GIFTS.map(g=>(f:number)=>pairedGiftFrame(g,f,undefined,undefined,direction)),...EVENT_MEMORIES.map(k=>(f:number)=>pairedMemorialFrame(k,f,undefined,undefined,direction))]){
   const anchors=[]
   for(let f=0;f<8;f++){
    const a=make(f);expect(a.actors.length).toBe(2);expect(a.loop).toBe(false)
    for(const actor of a.actors)valid(actor.rows,64,32,actor.palette)
    valid(a.propBack,64,32,PAIRED_EVENT_PALETTE);valid(a.propFront,64,32,PAIRED_EVENT_PALETTE)
    anchors.push(JSON.stringify(a.actors.map(a=>a.anchor)))
    for(const actor of a.actors){const hand=a.hands[actor.id as 'first'|'second'];expect(actor.rows[hand.y].slice(hand.x,hand.x+2)).toBe('ss')}
   }
   expect(new Set(anchors).size).toBe(1)
  }
 })
 it('선물이 주는 손에서 두 손을 거쳐 받는 손으로 이동하며 양손은 물건 양옆에 닿는다',()=>{
  for(const gift of PAIRED_GIFTS){
   expect(pairedGiftFrame(gift,0).object.supports).toBe('first')
   for(const f of [3,4]){const a=pairedGiftFrame(gift,f),p=a.object.bounds;expect(a.object.supports).toBe('both');expect(a.hands.first.x+2).toBe(p.x);expect(a.hands.second.x).toBe(p.x+p.w)}
   expect(pairedGiftFrame(gift,7).object.supports).toBe('second')
   const x=Array.from({length:8},(_,f)=>pairedGiftFrame(gift,f).object.bounds.x);expect(x).toEqual([...x].sort((a,b)=>a-b))
   expect(pairedGiftFrame(gift,7).propFront.filter(r=>r.includes('W')||r.includes('J')).length).toBeGreaterThan(0)
  }
 })
 it('기념물은 원본 한 개로 함께 낮춘 뒤 손을 떼고 바닥에 남는다',()=>{
  for(const kind of EVENT_MEMORIES){
   const ys=Array.from({length:8},(_,f)=>pairedMemorialFrame(kind,f).object.bounds.y);expect(ys).toEqual([...ys].sort((a,b)=>a-b))
   for(let f=0;f<8;f++){
    const a=pairedMemorialFrame(kind,f),p=a.object.bounds
    expect(a.object.supports).toBe(f<6?'both':'ground')
    expect(a.propFront.slice(p.y,p.y+p.h).map(r=>r.slice(p.x,p.x+p.w))).toEqual(eventMemoryRows(kind,0))
    expect(a.propFront.reduce((n,r)=>n+[...r].filter(c=>c!=='.').length,0)).toBe(eventMemoryRows(kind,0).reduce((n,r)=>n+[...r].filter(c=>c!=='.').length,0))
   }
  }
 })
 it('좌우 반전은 역할과 물건 소유를 보존하며 끝 프레임을 유지한다',()=>{
  for(let f=0;f<8;f++)for(const make of [(d:'left'|'right')=>pairedGiftFrame('book',f,undefined,undefined,d),(d:'left'|'right')=>pairedMemorialFrame('wedding',f,undefined,undefined,d)]){
   const right=make('right'),left=make('left');expect(left.propFront).toEqual(flip(right.propFront));expect(left.object.supports).toBe(right.object.supports)
   for(let i=0;i<2;i++){expect(left.actors[i].rows).toEqual(flip(right.actors[i].rows));expect(left.actors[i].palette).toEqual(right.actors[i].palette)}
  }
  expect(pairedGiftFrame('parcel',999)).toEqual(pairedGiftFrame('parcel',7));expect(pairedMemorialFrame('birth',-1)).toEqual(pairedMemorialFrame('birth',0))
 })
 it('아이와 노인 외형에서도 얼굴 원본과 고정된 바닥 위치를 유지한다',()=>{
  const first={...PAIR_EXAMPLE_LOOKS[0],short:0},second={...PAIR_EXAMPLE_LOOKS[1],elder:true}
  for(const memorial of [false,true])for(let frame=0;frame<8;frame++){
   const crouch=memorial&&frame>=2&&frame<=5,a=memorial?pairedMemorialFrame('birth',frame,first,second):pairedGiftFrame('book',frame,first,second)
   for(const [i,look]of [first,second].entries()){
    const blink=memorial?frame===7:i===0?frame===6:frame===7
    const rows=spriteRows('writer',i===0?'right':'left',{frame:0,blink,avatar:look.avatar,short:look.short,elder:'elder'in look?look.elder:undefined,pose:crouch?'crouch':'stand'}),y=22-rows.length,x=i===0?12:42
    expect(a.actors[i].rows.slice(y,y+7).map(r=>r.slice(x,x+10))).toEqual(rows.slice(0,7))
   }
  }
 })
})
describe('27권 완필 축하',()=>{
 it('책장에 있던 26권과 마지막 책 한 권이 같은 자리를 차지하지 않고 27권으로 완성된다',()=>{
  const slot=completionSceneFrame(0).lastBook.slot
  for(let f=0;f<8;f++){
   const a=completionSceneFrame(f);valid(a.propBack,128,56,COMPLETION_PALETTE);valid(a.propFront,128,56,COMPLETION_PALETTE);for(const actor of a.actors)valid(actor.rows,128,56,actor.palette)
   expect(a.shelfBookCount).toBe(f<4?26:27);expect(a.lastBook.owner).toBe(f<4?'writer':'shelf');expect(a.completed).toBe(f>=4);expect(a.loop).toBe(false)
   // 책등 위 금빛 띠는 책이 꽂힌 뒤에만 선반 레이어에 생긴다.
   expect(a.propBack[slot.y+1].slice(slot.x,slot.x+3)).toBe(f<4?'www':'QQQ')
  }
  const lastBefore=completionSceneFrame(3).propFront.slice(slot.y,slot.y+6).map(r=>r.slice(slot.x,slot.x+3)),lastAfter=completionSceneFrame(4).propBack.slice(slot.y,slot.y+6).map(r=>r.slice(slot.x,slot.x+3))
  expect(lastBefore).toEqual(lastAfter)
 })
 it('세 사람의 바닥과 책장은 움직이지 않으며 마지막 축하 자세에서 멈춘다',()=>{
  const anchors=Array.from({length:8},(_,f)=>JSON.stringify(completionSceneFrame(f).actors.map(a=>a.anchor)));expect(new Set(anchors).size).toBe(1)
  expect(completionSceneFrame(999)).toEqual(completionSceneFrame(7))
  expect(completionSceneFrame(6).actors[1].rows).not.toEqual(completionSceneFrame(7).actors[1].rows)
  const looks=COMPLETION_EXAMPLE_LOOKS.map((l,i)=>({...l,short:i===1?0:undefined,elder:i===2})),a=completionSceneFrame(6,looks)
  for(const actor of a.actors){const bottom=actor.rows.map((r,y)=>r.replaceAll('.','').length?y:-1).filter(y=>y>=0);expect(Math.max(...bottom)).toBe(46)}
 })
})
