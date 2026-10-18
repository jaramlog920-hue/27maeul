import { compactPetRows, petMotionRows, petStillRows, PET_SIDE } from './pet-art'
import { copyFurnitureUseFrame } from './copy-furniture-motion'

it('keeps every authored animal pixel instead of losing thin paws and outlines to resampling',()=>{
  for(const kind of ['cat','dog'] as const)for(const form of ['adult','baby','curl','babyCurl'] as const){
    const raw=[...PET_SIDE[kind][form]],source=Array<string>(16).fill('.'.repeat(16))
    raw.forEach((row,y)=>{source[y+1]=row.padEnd(16,'.')})
    const result=compactPetRows(kind,source)
    expect(result.slice(-raw.length)).toEqual(raw.map(row=>row.padEnd(16,'.')))
  }
})

it('has no detached toy colored like a second nose beneath playing pets',()=>{
  for(const kind of ['cat','dog'] as const)for(const baby of [true,false])for(const facing of ['left','right','down','up'] as const)for(let phase=0;phase<4;phase++){
    const play=petMotionRows(kind,facing,'play',phase,baby),sniff=petMotionRows(kind,facing,'sniff',phase,baby)
    expect(play.join('').match(/n/g)?.length??0).toBe(sniff.join('').match(/n/g)?.length??0)
    expect(play[15]).toMatch(/[^.]/)
  }
})

it('keeps young pets small when curling up',()=>{
  for(const kind of ['cat','dog'] as const){
    const baby=petStillRows(kind,'curl',true),adult=petStillRows(kind,'curl')
    expect(baby.filter(row=>/[^.]/.test(row)).length).toBeLessThan(adult.filter(row=>/[^.]/.test(row)).length)
    expect(baby.flatMap(row=>[...row]).filter(c=>c!=='.').length).toBeLessThan(adult.flatMap(row=>[...row]).filter(c=>c!=='.').length)
  }
})

it('makes both species visibly enter the hideaway and turn to show their faces without altering their real position',()=>{
  for(const kind of ['cat','dog'] as const)for(const baby of [true,false]){
    const frames=[0,1,2,3].map(p=>copyFurnitureUseFrame('copyPetJar','down',p,{pet:{kind,baby}}).layers[4].rows)
    const left=(rr:string[])=>Math.min(...rr.map(row=>row.search(/[^.]/)).filter(x=>x>=0))
    expect(left(frames[1])-left(frames[0])).toBeGreaterThanOrEqual(10)
    expect(frames[1].join('')).not.toContain('e')
    expect(frames[2].join('')).toContain('e')
    expect(new Set(frames.map(rr=>rr.join(''))).size).toBe(4)
    const feet={x:20,y:0},before={...feet}
    for(let phase=0;phase<4;phase++)copyFurnitureUseFrame('copyPetJar','down',phase,{pet:{kind,baby},petFeet:feet})
    expect(feet).toEqual(before)
  }
})
