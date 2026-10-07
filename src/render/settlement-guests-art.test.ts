import { SETTLEMENT_GUESTS,GUEST_ACTIONS,GUEST_PROP_PALETTE,settlementGuestFrame } from './settlement-guests-art'
import { OLD_BUILDINGS,OLD_VILLAGE_PALETTE } from './old-village-art'
import { settlementBuildingDetails } from './settlement-building-details'
const facings=['down','up','left','right'] as const
describe('손님집 고유 인물과 시설',()=>{
 it('모든 방향·동작의 레이어와 색이 유효하고 발 앵커가 화면 안에 있다',()=>{
  for(const id of ['nelly','morris','ivy'] as const)for(const direction of facings)for(const action of GUEST_ACTIONS)for(let f=0;f<4;f++){
   const a=settlementGuestFrame(id,direction,action,f)
   for(const [rows,pal]of [[a.actor,a.palette],[a.propBack,GUEST_PROP_PALETTE],[a.propFront,GUEST_PROP_PALETTE]] as const){expect(rows.length).toBe(24);for(const r of rows){expect(r.length).toBe(24);for(const c of r)expect(c==='.'||c in pal,`${id}/${action}/${c}`).toBe(true)}}
   expect(a.anchor.x).toBeGreaterThanOrEqual(0);expect(a.anchor.y).toBeLessThanOrEqual(24)
  }
 })
 it('세 손님의 외형·도구가 다르고 걷기와 손일이 실제로 변한다',()=>{
  expect(SETTLEMENT_GUESTS.morris.elder).toBe(true)
  const people=['nelly','morris','ivy'] as const
  expect(new Set(people.map(id=>settlementGuestFrame(id,'down','stand',0).actor.join(''))).size).toBe(3)
  expect(new Set(people.map(id=>settlementGuestFrame(id,'down','work',0).propFront.join(''))).size).toBe(3)
  for(const id of people){expect(settlementGuestFrame(id,'down','walk',1).actor).not.toEqual(settlementGuestFrame(id,'down','walk',3).actor);expect(settlementGuestFrame(id,'down','work',0).propFront).not.toEqual(settlementGuestFrame(id,'down','work',1).propFront)}
 })
 it('건물은 팔레트·크기가 맞고 디테일 추가가 문과 문턱을 보존한다',()=>{
  for(const id of ['guest','home','weaver','courtyard','garden'])for(const facing of facings){const a=OLD_BUILDINGS[id][facing];expect(a.rows.length).toBe(64);for(const r of a.rows){expect(r.length).toBe(64);for(const c of r)expect(c==='.'||c in OLD_VILLAGE_PALETTE).toBe(true)}}
  const blank={w:4,h:4,rows:Array<string>(64).fill('.'.repeat(64))}
  for(const id of ['guest','home','weaver'])for(const facing of ['down','left','right'] as const){const x=facing==='down'?27:facing==='left'?10:42,a=settlementBuildingDetails(blank,id,facing);for(let y=39;y<62;y++)expect(a.rows[y].slice(x,x+10)).toBe('.'.repeat(10))}
 })
})
