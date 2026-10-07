import { ADULT_JOBS } from '../engine/child'
import { OLD_BUILDINGS } from './old-village-art'
import { BUILDING_ART_PALETTE, BUILDING_FACINGS, CONSTRUCTION_BUILDINGS, CONSTRUCTION_STAGES, PROFESSION_BUILDINGS, buildingEntry, constructionBuildingArt, professionBuildingArt, professionWorkPropRows } from './newland-building-art'
import { BOUNDARY_MATERIALS, BOUNDARY_PALETTE, boundaryGateFrame, boundaryRows } from './newland-boundary-art'

function valid(rows:readonly string[],size:number,palette:Record<string,string>){
 expect(rows).toHaveLength(size)
 expect(rows.every(r=>r.length===size)).toBe(true)
 expect([...new Set(rows.join(''))].filter(c=>c!=='.'&&!palette[c])).toEqual([])
}
function recompose(a:{rows:string[];back:string[];front:string[]}){
 expect(a.back.map((r,y)=>[...r].map((c,x)=>a.front[y][x]!=='.'?a.front[y][x]:c).join(''))).toEqual(a.rows)
 expect(a.back.every((r,y)=>[...r].every((c,x)=>c==='.'||a.front[y][x]==='.'))).toBe(true)
}
describe('구약맵 건물·경계·공사 자산',()=>{
 it('직업마다 그림이 다르고 색을 제외한 건물 외곽도 7종 이상이다',()=>{
  for(const job of ADULT_JOBS)expect(PROFESSION_BUILDINGS).toContain(job)
  const silhouettes=new Set<string>(),pictures=new Set<string>(),props=new Set<string>()
  for(const job of PROFESSION_BUILDINGS){
   const a=professionBuildingArt(job,'down'),p=professionWorkPropRows(job)
   silhouettes.add(a.rows.join('').replace(/[^.]/g,'#'));pictures.add(a.rows.join(''));props.add(p.join(''))
   valid(p,16,BUILDING_ART_PALETTE)
  }
  expect(silhouettes.size).toBeGreaterThanOrEqual(7);expect(pictures.size).toBe(18);expect(props.size).toBe(18)
 })
 it('4방향 건물의 문·발 기준점·분리 레이어가 기존 위치를 유지한다',()=>{
  for(const job of PROFESSION_BUILDINGS)for(const d of BUILDING_FACINGS){
   const a=professionBuildingArt(job,d)
   valid(a.rows,64,BUILDING_ART_PALETTE);recompose(a)
   expect(a.anchor).toEqual({x:32,y:60});expect(a.entry).toEqual(buildingEntry(d))
   expect(a.footprint).toEqual({w:4,h:3,dy:1})
   if(d!=='up'){
    const x=d==='left'?10:d==='right'?42:27
    for(let y=39;y<59;y++)expect(a.rows[y].slice(x,x+10)).toBe(OLD_BUILDINGS[job][d].rows[y].slice(x,x+10))
    for(const y of [59,60])expect(a.rows[y].slice(x-2,x+12)).toBe('I'.repeat(14))
   }
  }
 })
 it('25건물 공사는 3단계가 다르고 실제 입구는 완공 전 만들지 않는다',()=>{
  expect(CONSTRUCTION_BUILDINGS).toHaveLength(25)
  const before=JSON.stringify(OLD_BUILDINGS)
  for(const id of CONSTRUCTION_BUILDINGS)for(const d of BUILDING_FACINGS){
   const variants=new Set<string>(),open=id==='courtyard'||id==='garden'
   for(const stage of CONSTRUCTION_STAGES){
    const a=constructionBuildingArt(id,d,stage)
    valid(a.rows,64,BUILDING_ART_PALETTE);recompose(a);variants.add(a.rows.join(''))
    expect(a.entry).toBeNull();expect(a.complete).toBe(false)
    expect(a.plannedEntry).toEqual(open?null:buildingEntry(d))
    expect(a.footprint).toEqual(open?{w:4,h:4,dy:0}:{w:4,h:3,dy:1})
    if(open&&stage==='roof')expect(a.label).toBe('바닥·울타리 마감')
   }
   expect(variants.size).toBe(3)
  }
  expect(JSON.stringify(OLD_BUILDINGS)).toBe(before)
  expect(()=>constructionBuildingArt('missing','down','roof')).toThrow('없는 건물')
 })
 it('울타리와 돌담 16조각은 네 방향 이음의 가장자리 색이 맞는다',()=>{
  for(const material of BOUNDARY_MATERIALS){
   const variants=new Set<string>()
   for(let mask=0;mask<16;mask++){
    const rows=boundaryRows(material,mask);valid(rows,16,BOUNDARY_PALETTE);variants.add(rows.join(''))
    if(mask&2)expect(rows.map(r=>r[15])).toEqual(boundaryRows(material,8).map(r=>r[0]))
    if(mask&8)expect(rows.map(r=>r[0])).toEqual(boundaryRows(material,2).map(r=>r[15]))
    if(mask&1)expect(rows[0]).toBe(boundaryRows(material,4)[15])
    if(mask&4)expect(rows[15]).toBe(boundaryRows(material,1)[0])
   }
   expect(variants.size).toBe(16)
  }
 })
 it('가로·세로 문은 경계에 이어지고 닫기 동작은 열기의 역순이다',()=>{
  for(const material of BOUNDARY_MATERIALS)for(const axis of ['horizontal','vertical'] as const){
   const widths:number[]=[]
   for(let f=0;f<4;f++){
    const a=boundaryGateFrame(material,axis,'open',f),closed=boundaryGateFrame(material,axis,'close',3-f)
    valid(a.rows,16,BOUNDARY_PALETTE);recompose(a);widths.push(a.opening)
    expect(a.rows).toEqual(closed.rows);expect(a.loop).toBe(false);expect(a.duration).toBe(200)
    if(axis==='horizontal'){
     expect(a.rows.map(r=>r[0])).toEqual(boundaryRows(material,2).map(r=>r[15]))
     expect(a.rows.map(r=>r[15])).toEqual(boundaryRows(material,8).map(r=>r[0]))
    }else{
     expect(a.rows[0]).toBe(boundaryRows(material,4)[15]);expect(a.rows[15]).toBe(boundaryRows(material,1)[0])
    }
   }
   expect(widths).toEqual([0,2,6,8])
   expect(boundaryGateFrame(material,axis,'open',-1).rows).toEqual(boundaryGateFrame(material,axis,'open',0).rows)
   expect(boundaryGateFrame(material,axis,'open',99).rows).toEqual(boundaryGateFrame(material,axis,'open',3).rows)
  }
 })
})
