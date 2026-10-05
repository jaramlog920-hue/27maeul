import { describe,expect,it } from 'vitest'
import { EXPANSION_PROPS,EXPANSION_VIEWS,FURNITURE_USE_LAYERS } from './expansion-prop-art'
import { EXTRA_ACTIONS,extraUseFrame,PET_ACTIONS,petMotionRows } from './expansion-life-motion'
import { HOME_SPACE_DIRECTIONS } from './home-space-directions'
import { REMAINING_FIXTURE_DIRECTIONS } from './remaining-furniture-art'
import { FURNI_PALETTE } from './furniture-art'
import { writerPalette,ANIMAL_PALETTE } from './sprites'
const facings=['down','up','left','right'] as const
function check(rows:string[],width:number,height:number,palette:Record<string,string>) {
  expect(rows).toHaveLength(height)
  for(const r of rows){expect(r).toHaveLength(width);for(const c of r)if(c!=='.')expect(palette[c],`palette ${c}`).toBeDefined()}
}
describe('expansion art handoff',()=>{
  it('exports all props and direction views with existing furniture colors',()=>{
    for(const a of [...Object.values(EXPANSION_PROPS),...Object.values(EXPANSION_VIEWS).flatMap(Object.values)])check(a.rows,a.w*16,a.h*16,FURNI_PALETTE)
  })
  it('layer compositing exactly preserves existing furniture in all directions',()=>{
    for(const [id,views]of Object.entries(FURNITURE_USE_LAYERS))for(const f of facings){
      const original=(HOME_SPACE_DIRECTIONS[id]??REMAINING_FIXTURE_DIRECTIONS[id])[f],{back,front}=views[f]
      const merged=back.rows.map((r,y)=>[...r].map((c,x)=>front.rows[y][x]!=='.'?front.rows[y][x]:c).join(''))
      expect(merged).toEqual(original.rows)
    }
  })
  it('actor and prop layers fit the canvas without palette collisions',()=>{
    for(const short of [undefined,1])for(const action of EXTRA_ACTIONS)for(const facing of facings)for(let frame=0;frame<4;frame++){
      const a=extraUseFrame('writer',facing,action,frame,{frame:0,blink:false,short})
      check(a.actor,24,24,writerPalette('spring'));check(a.propBack,24,24,FURNI_PALETTE);check(a.propFront,24,24,FURNI_PALETTE)
    }
  })
  it('pets have real animation changes and separate young silhouettes',()=>{
    for(const kind of ['cat','dog'] as const)for(const baby of [false,true])for(const action of PET_ACTIONS)for(const facing of facings){
      const frames=Array.from({length:4},(_,f)=>petMotionRows(kind,facing,action,f,baby))
      for(const rows of frames)check(rows,16,16,ANIMAL_PALETTE[kind])
      expect(new Set(frames.map(r=>r.join(''))).size,`${kind}/${baby}/${action}/${facing}`).toBeGreaterThan(1)
    }
    expect(petMotionRows('cat','down','wait',0,true)).not.toEqual(petMotionRows('cat','down','wait',0,false))
  })
})
