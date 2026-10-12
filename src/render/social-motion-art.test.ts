import { describe, expect, it } from 'vitest'
import { SOCIAL_ACTIONS } from '../engine/social-scene'
import { socialMotionFrame, SOCIAL_PROP_ROWS } from './social-motion-art'
import { FURNI_PALETTE } from './furniture-art'
import { PALETTE } from './sprites'

describe('공통 생활 모션',()=>{
 it('모든 방향·프레임이 마을 픽셀 규격을 지키고 소품 팔레트에 없는 색을 쓰지 않는다',()=>{
  for(const facing of ['up','down','left','right'] as const)for(const action of SOCIAL_ACTIONS)for(let f=0;f<8;f++){
   const layers=socialMotionFrame('writer',facing,action,'book',f,{frame:0,blink:false})
   for(const rows of [layers.actor,layers.propFront,layers.propBack]){
    expect(rows).toHaveLength(24);expect(rows.every(r=>r.length===24)).toBe(true)
   }
   for(const row of layers.actor)for(const c of row)if(c!=='.')expect(c in PALETTE).toBe(true)
  }
  for(const rows of Object.values(SOCIAL_PROP_ROWS))for(const row of rows)for(const c of row)if(c!=='.')expect(c in FURNI_PALETTE).toBe(true)
 })
 it('손과 소품이 처음 위치로 돌아오고 중간 프레임은 움직인다',()=>{
  const start=socialMotionFrame('writer','right','offer','cup',0,{frame:0,blink:false})
  const end=socialMotionFrame('writer','right','offer','cup',7,{frame:0,blink:false})
  const middle=socialMotionFrame('writer','right','offer','cup',3,{frame:0,blink:false})
  expect(start).toEqual(end);expect(start.actor).not.toEqual(middle.actor)
 })
})
