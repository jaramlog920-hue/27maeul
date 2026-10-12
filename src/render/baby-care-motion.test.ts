import {describe,it,expect} from 'vitest'
import {BABY_BEDS,BABY_CARE_ACTIONS,babyCareFrame} from './baby-care-motion'
const opts={frame:0 as const,blink:false}
const keys=['actor','babyBack','babyFront','furnitureBack','furnitureFront','blanket'] as const
describe('newborn care layers',()=>{
  it('keeps every direction and phase within native bounds with valid independent palettes',()=>{
    for(const bed of BABY_BEDS)for(const action of BABY_CARE_ACTIONS)for(const facing of ['down','up','left','right'] as const)for(let phase=0;phase<4;phase++){
      const r=babyCareFrame('writer',facing,action,bed,phase,opts)
      for(const key of keys){
        expect(r[key]).toHaveLength(48)
        const pal=key==='actor'?r.actorPalette:key.startsWith('baby')?r.babyPalette:r.furniturePalette
        for(const row of r[key]){expect(row).toHaveLength(48);for(const c of row)if(c!=='.')expect(pal[c]).toBeDefined()}
      }
      expect(r.actor.slice(r.feet.y).every(row=>/^\.+$/.test(row))).toBe(true)
      expect(babyCareFrame('writer',facing,action,bed,phase+4,opts)).toEqual(r)
    }
  })
  it('moves the supported baby continuously onto the mattress, behind its near rail',()=>{
    for(const facing of ['down','up','right'] as const){
      const frames=[0,1,2,3].map(p=>babyCareFrame('writer',facing,'lay','wood',p,opts))
      for(let p=1;p<4;p++){
        expect(Math.abs(frames[p].babyPosition.x-frames[p-1].babyPosition.x)).toBeLessThanOrEqual(2)
        expect(Math.abs(frames[p].babyPosition.y-frames[p-1].babyPosition.y)).toBeLessThanOrEqual(2)
      }
      expect(frames[0].babyFront.some(row=>/[^.]/.test(row))).toBe(true)
      expect(frames[3].babyFront.every(row=>/^\.+$/.test(row))).toBe(true)
      expect(frames[3].babyBack.some(row=>/[^.]/.test(row))).toBe(true)
    }
  })
  it('mirrors all left view layers together and keeps blanket below the face',()=>{
    for(const action of BABY_CARE_ACTIONS)for(let phase=0;phase<4;phase++){
      const r=babyCareFrame('writer','right',action,'canopy',phase,opts),l=babyCareFrame('writer','left',action,'canopy',phase,opts)
      for(const key of keys)expect(l[key]).toEqual(r[key].map(row=>[...row].reverse().join('')))
      if(action==='tuck'){
        const {x,y}=r.babyPosition
        for(let yy=y;yy<y+5;yy++)for(let xx=x;xx<x+4;xx++)expect(r.blanket[yy][xx]).toBe('.')
      }
    }
  })
})
