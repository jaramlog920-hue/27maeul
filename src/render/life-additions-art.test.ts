import { TODDLER_ACTIONS,CHILD_ACTIONS,ELDER_ACTIONS,ARRIVAL_ACTIONS,ADDITION_PROP_PALETTE,toddlerMotionFrame,childMotionFrame,elderMotionFrame,guestArrivalFrame } from './life-additions-motion-art'
import { MEMORY_KINDS,MEMORY_PALETTE,memoryMarkerRows,BOOK_DETAILS,DETAIL_COLORS,decoratedBookRows,bookDetailPalette,bookDetailWorkRows } from './life-additions-prop-art'
import { SETTLEMENT_GUESTS } from './settlement-guests-art'
import { withLookDefaults } from '../engine/avatar'
const directions=['down','up','left','right'] as const
function valid(rows:string[],w:number,h:number,pal:Record<string,string>){expect(rows.length).toBe(h);for(const row of rows){expect(row.length).toBe(w);for(const c of row)expect(c==='.'||c in pal,`색 ${c}`).toBe(true)}}
describe('미연결 생활 도트 후속',()=>{
 it('방향별 생활 동작은 몸과 소품 팔레트가 유효하고 같은 앵커 범위를 쓴다',()=>{
  const groups=[[TODDLER_ACTIONS,toddlerMotionFrame],[CHILD_ACTIONS,childMotionFrame],[ELDER_ACTIONS,elderMotionFrame]] as const
  for(const [actions,get]of groups)for(const action of actions)for(const d of directions)for(let f=0;f<4;f++){
   const a=(get as (action:never,d:typeof directions[number],f:number)=>ReturnType<typeof toddlerMotionFrame>)(action as never,d,f)
   valid(a.actor,24,24,a.palette);valid(a.propBack,24,24,ADDITION_PROP_PALETTE);valid(a.propFront,24,24,ADDITION_PROP_PALETTE)
   expect(a.anchor.x).toBeGreaterThanOrEqual(0);expect(a.anchor.y).toBeLessThanOrEqual(24)
  }
 })
 it('유아의 기어가기와 주저앉기는 다른 자세이며 외형을 교체할 수 있다',()=>{
  for(const d of directions){expect(toddlerMotionFrame('crawl',d,0).actor).not.toEqual(toddlerMotionFrame('walk',d,0).actor);expect(toddlerMotionFrame('crawl',d,0).actor).not.toEqual(toddlerMotionFrame('crawl',d,1).actor);expect(toddlerMotionFrame('plop',d,0).actor).not.toEqual(toddlerMotionFrame('plop',d,3).actor)}
  const avatar=withLookDefaults({name:'예시',look:'m',skin:7,top:3,hairFront:3,bottom:2})
  const a=toddlerMotionFrame('crawl','right',1,avatar);valid(a.actor,24,24,a.palette)
 })
 it('아이의 실제 걸음과 노년의 앉기·일어나기 종료 자세가 구별된다',()=>{
  expect(childMotionFrame('carryBasket','right',1).actor).not.toEqual(childMotionFrame('carryBasket','right',3).actor)
  expect(elderMotionFrame('sitDown','down',3).actor).not.toEqual(elderMotionFrame('standUp','down',3).actor)
  expect(elderMotionFrame('sitDown','down',0).loop).toBe(false)
 })
 it('세 손님의 입주 동작에는 개별 외형과 별도의 열쇠·짐 레이어가 있다',()=>{
  for(const id of Object.keys(SETTLEMENT_GUESTS) as (keyof typeof SETTLEMENT_GUESTS)[])for(const action of ARRIVAL_ACTIONS)for(const d of directions)for(let f=0;f<4;f++){
   const a=guestArrivalFrame(id,action,d,f);valid(a.actor,24,24,a.palette);valid(a.propBack,24,24,ADDITION_PROP_PALETTE);valid(a.propFront,24,24,ADDITION_PROP_PALETTE)
  }
  const id=Object.keys(SETTLEMENT_GUESTS)[0] as keyof typeof SETTLEMENT_GUESTS
  expect(guestArrivalFrame(id,'putLuggage','down',0).propFront).not.toEqual(guestArrivalFrame(id,'putLuggage','down',3).propFront)
  expect(guestArrivalFrame(id,'receiveKey','down',0).loop).toBe(false)
 })
 it('기념물의 도상은 서로 다르고 1칸 안에서 꽃 장식만 움직인다',()=>{
  expect(new Set(MEMORY_KINDS.map(k=>memoryMarkerRows(k).join(''))).size).toBe(6)
  for(const k of MEMORY_KINDS)for(let f=0;f<4;f++)valid(memoryMarkerRows(k,f),16,16,MEMORY_PALETTE)
  for(const k of ['wedding','birth','independence'] as const)expect(memoryMarkerRows(k,0).slice(3,9)).toEqual(memoryMarkerRows(k,1).slice(3,9))
 })
 it('책 장식 4종은 6색의 표지·책등에서 구별되며 작업 끝은 완성 그림이다',()=>{
  for(const color of DETAIL_COLORS){const pal=bookDetailPalette(color);expect(new Set(BOOK_DETAILS.map(k=>decoratedBookRows(k,color).join(''))).size).toBe(4)
   for(const k of BOOK_DETAILS){valid(decoratedBookRows(k,color),8,20,pal);valid(decoratedBookRows(k,color,true),24,32,pal);for(let f=0;f<4;f++)valid(bookDetailWorkRows(k,color,f),40,40,pal)
    const done=bookDetailWorkRows(k,color,3);expect(done.slice(1,33).map(r=>r.slice(8,32))).toEqual(decoratedBookRows(k,color,true))
   }
  }
 })
})
