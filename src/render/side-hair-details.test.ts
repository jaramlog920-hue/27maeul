// assets/는 배포에 올리지 않아 정적 import면 배포 빌드의 타입 검사가 멈춘다 — 실행할 때 읽는다 (2026-10-08)
import { readFileSync } from 'node:fs'
type Before = { id: string; rows: Record<'down' | 'up' | 'right', string[]> }
const before = JSON.parse(readFileSync('assets/side-hair/before.json', 'utf8')) as Before[]
import { HAIR_BACKS,withLookDefaults } from '../engine/avatar'
import { mirror,spriteRows,writerPalette,PALETTE,type Who } from './sprites'
import { sideHairDetails } from './side-hair-details'

const previous=new Map(before.map(a=>[a.id,a]))
describe('옆모습 뒷머리 보강',()=>{
 it('11종은 앞·뒤 모습, 얼굴과 몸통을 유지하면서 좌우에 같은 머리를 그린다',()=>{
  for(let hairBack=0;hairBack<HAIR_BACKS.length;hairBack++)for(const stage of ['adult','child','elder']){
   const avatar=withLookDefaults({look:'f',name:'옆머리 예시',hairFront:0,hairBack,top:13,bottom:2,acc:0}),opts={frame:0 as const,blink:false,avatar,short:stage==='child'?0:undefined,elder:stage==='elder'},old=previous.get(`style-${hairBack}-${stage}`)!,right=spriteRows('writer','right',opts),pal=writerPalette('spring',avatar)
   for(const d of ['down','up'] as const)expect(spriteRows('writer',d,opts)).toEqual(old.rows[d])
   expect(right.map(r=>r.slice(4))).toEqual(old.rows.right.map(r=>r.slice(4)))
   expect(right.slice(11)).toEqual(old.rows.right.slice(11))
   expect(spriteRows('writer','left',opts)).toEqual(mirror(right))
   expect(right,`${hairBack}/${stage}`).not.toEqual(old.rows.right)
   for(const r of right){expect(r.length).toBe(10);for(const c of r)expect(c==='.'||c in pal).toBe(true)}
  }
 })
 it('단발의 반듯한 끝과 물결 머리의 귀를 덮는 안쪽 줄을 유지한다',()=>{
  const base=withLookDefaults({look:'f',name:'예시',hairFront:0,acc:0})
  const bob=spriteRows('writer','right',{frame:0,blink:false,avatar:{...base,hairBack:2}})
  expect(bob[7].slice(0,2)).toBe('11')
  for(let y=2;y<=6;y++)expect(bob[y][0]).not.toBe('.')
  const wave=spriteRows('writer','right',{frame:0,blink:false,avatar:{...base,hairBack:7}})
  for(let y=3;y<=7;y++)expect(wave[y][1]).not.toBe('.')
  expect(wave[4][0]).toBe('.');expect(wave[6][0]).toBe('.')
 })
 it('새 결은 머리색만 바꾸고 얼굴·머릿수건·리본을 덮지 않는다',()=>{
  const rows=Array<string>(14).fill('.'.repeat(10));rows[3]='xfxsso5!..';rows[4]='yvxsss5!..'
  const original=[...rows]
  for(let kind=0;kind<HAIR_BACKS.length;kind++){
   const out=[...rows];sideHairDetails(out,kind)
   for(let y=3;y<=4;y++)for(let x=0;x<8;x++)expect(out[y][x]).toBe(original[y][x])
  }
  for(const who of ['writer','baker','child','grandpa','merchant','smith','shepherd','presser','weaver','beekeeper','postman','apothecary','fisher','carpenter'] as Who[])for(const elder of [false,true]){
   const rows=spriteRows(who,'right',{frame:0,blink:false,elder,growth:3}),pal=PALETTE
   for(const r of rows)for(const c of r)expect(c==='.'||c in pal).toBe(true)
  }
 })
 it('땋은 가닥까지 노년 머리색이고 걷는 동안 머리 결이 흔들리지 않는다',()=>{
  for(let hairBack=0;hairBack<HAIR_BACKS.length;hairBack++){
   const avatar=withLookDefaults({look:'f',name:'예시',hairBack})
   const stand=spriteRows('writer','right',{frame:0,blink:false,avatar,elder:true})
   expect(stand.join('')).not.toMatch(/[h01]/)
   for(const frame of [1,2] as const)expect(spriteRows('writer','right',{frame,blink:false,avatar,elder:true}).slice(0,11)).toEqual(stand.slice(0,11))
  }
 })
})
