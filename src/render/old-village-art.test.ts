import { OLD_BUILDINGS, OLD_CONSTRUCTION, OLD_INTERIORS, OLD_PROPS, OLD_JOB_SIGNS, OLD_TERRAIN, OLD_VILLAGE_PALETTE } from './old-village-art'
import { FAMILY_ACTIONS, familyFrame, familyPairFrame, GENERATION_STAGES, generationRows } from './generation-art'
import { withLookDefaults } from '../engine/avatar'
import { writerPalette } from './sprites'
import { ADULT_JOBS } from '../engine/child'
const facings=['down','up','left','right'] as const
function valid(rows:readonly string[],w:number,h:number,palette:Record<string,string>) {
 expect(rows.length).toBe(h)
 for(const row of rows){expect(row.length).toBe(w);for(const c of row)expect(c==='.'||palette[c]!==undefined,`색 ${c}`).toBe(true)}
}
describe('구약 맵과 주민 세대 자산',()=>{
 it('모든 정지 자산이 실제 타일 크기와 팔레트를 지킨다',()=>{
  for(const all of [OLD_PROPS,OLD_JOB_SIGNS,OLD_TERRAIN,OLD_INTERIORS])for(const a of Object.values(all))valid(a.rows,a.w*16,a.h*16,OLD_VILLAGE_PALETTE)
  for(const all of [OLD_BUILDINGS,OLD_CONSTRUCTION])for(const views of Object.values(all))for(const f of facings)valid(views[f].rows,64,64,OLD_VILLAGE_PALETTE)
 },120_000)
 it('현재 16개 자식 직업의 일터와 앞뒤 입구 구분이 있다',()=>{
  for(const job of ADULT_JOBS)expect(OLD_BUILDINGS[job]).toBeDefined()
  expect(OLD_BUILDINGS.archive.down.rows).not.toEqual(OLD_BUILDINGS.archive.up.rows)
  expect(OLD_BUILDINGS.archive.left.rows).not.toEqual(OLD_BUILDINGS.archive.right.rows)
 })
 it('현재 외형과 액세서리 색을 적용하며 성장과 방향별 크기가 유효하다',()=>{
  const avatar=withLookDefaults({look:'f',name:'하늘',acc:13,accColor:[120,50,65]})
  const palette=writerPalette('spring',avatar)
  for(const stage of GENERATION_STAGES)for(const facing of facings)for(let f=0;f<4;f++)valid(generationRows(stage,facing,f,{frame:0,blink:false,avatar}),10,14,palette)
  expect(generationRows('child','down',0,{frame:0,blink:false,avatar})).not.toEqual(generationRows('adult','down',0,{frame:0,blink:false,avatar}))
 })
 it('가족 동작의 레이어·앵커가 24px 범위이고 두 사람을 늘리지 않는다',()=>{
  const avatar=withLookDefaults({look:'f',name:'하늘'}),opts={frame:0 as const,blink:false,avatar},pal=writerPalette('spring',avatar)
  for(const stage of ['toddler','child','teen','adult'] as const)for(const action of FAMILY_ACTIONS)for(const facing of facings)for(let f=0;f<4;f++){
   const a=familyFrame('writer',facing,action,f,stage,opts)
   valid(a.actor,24,24,pal);valid(a.propBack,24,24,OLD_VILLAGE_PALETTE);valid(a.propFront,24,24,OLD_VILLAGE_PALETTE)
   expect(a.anchor.x).toBeGreaterThanOrEqual(0);expect(a.anchor.x).toBeLessThan(24);expect(a.anchor.y).toBeLessThan(24)
  }
  const pair=familyPairFrame('down','readTogether',0,opts,opts)
  expect(pair.width).toBe(48);expect(pair.actors[0].actor[0].length).toBe(24);expect(pair.actors[1].offset.x).toBe(24)
 },120_000)
})
