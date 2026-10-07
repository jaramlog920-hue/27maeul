import { WORK_DETAIL_ACTIONS,WORK_DETAIL_PALETTE,workDetailFrame } from './work-details-motion-art'
import { DOOR_BUILDINGS,DOOR_FACINGS,DOOR_PALETTE,buildingDoorFrame,AMBIENT_ACTIONS,AMBIENT_PALETTE,ambientDetailRows } from './door-ambient-art'
import { OLD_BUILDINGS } from './old-village-art'
import { withLookDefaults } from '../engine/avatar'
function valid(rows:string[],w:number,h:number,pal:Record<string,string>){expect(rows.length).toBe(h);for(const r of rows){expect(r.length).toBe(w);for(const c of r)expect(c==='.'||c in pal,`색 ${c}`).toBe(true)}}
describe('작업·문·편지 미연결 자산',()=>{
 it('인물 14동작의 모든 방향·프레임이 팔레트와 레이어 범위를 지킨다',()=>{
  for(const action of WORK_DETAIL_ACTIONS)for(const d of ['down','up','left','right'] as const)for(let f=0;f<4;f++){
   const a=workDetailFrame(action,d,f);valid(a.actor,32,32,a.palette);valid(a.propBack,32,32,WORK_DETAIL_PALETTE);valid(a.propFront,32,32,WORK_DETAIL_PALETTE);expect(a.anchor.x).toBe(16);expect(a.anchor.y).toBeLessThan(32)
  }
 })
 it('모든 손일이 다른 프레임을 갖고 실제 외형의 색을 교체할 수 있다',()=>{
  for(const action of WORK_DETAIL_ACTIONS){const frames=[0,1,2,3].map(f=>{const a=workDetailFrame(action,'down',f);return [...a.actor,...a.propFront].join('')});expect(new Set(frames).size,action).toBeGreaterThan(1)}
  const avatar=withLookDefaults({look:'m',name:'예시',skin:7,hairFront:3,top:10,bottom:6}),a=workDetailFrame('hammer','right',2,avatar);valid(a.actor,32,32,a.palette)
 })
 it('문은 닫힌 끝이 원본과 같고 문턱·출입구를 보존하며 열기와 닫기가 역순이다',()=>{
  for(const id of DOOR_BUILDINGS)for(const d of DOOR_FACINGS){const original=OLD_BUILDINGS[id][d].rows
   expect(buildingDoorFrame(id,d,'open',0).rows).toEqual(original);expect(buildingDoorFrame(id,d,'close',3).rows).toEqual(original)
   expect(buildingDoorFrame(id,d,'open',3).rows).not.toEqual(original)
   for(let f=0;f<4;f++){const a=buildingDoorFrame(id,d,'open',f);valid(a.rows,64,64,DOOR_PALETTE);valid(a.back,64,64,DOOR_PALETTE);valid(a.front,64,64,DOOR_PALETTE)
    expect(a.rows.slice(59)).toEqual(original.slice(59));expect(a.rows).toEqual(buildingDoorFrame(id,d,'close',3-f).rows);expect(a.entry.y).toBe(60)
    const merged=a.back.map((r,y)=>[...r].map((c,x)=>a.front[y][x]==='.'?c:a.front[y][x]).join(''));expect(merged).toEqual(a.rows)
   }
  }
 })
 it('불꽃·갈대는 프레임이 변하고 받침·틀은 고정이다',()=>{
  for(const action of AMBIENT_ACTIONS){const frames=[0,1,2,3].map(f=>ambientDetailRows(action,f));for(const rows of frames)valid(rows,16,16,AMBIENT_PALETTE);expect(new Set(frames.map(r=>r.join(''))).size).toBeGreaterThan(1)}
  expect(ambientDetailRows('lampFlame',0).slice(10)).toEqual(ambientDetailRows('lampFlame',3).slice(10))
  expect(ambientDetailRows('reedSway',0).slice(0,4)).toEqual(ambientDetailRows('reedSway',3).slice(0,4))
 })
})
