import {COPY_OUTFITS,BASIC_TOP_COUNT,copyOutfitAt,copyOutfitTop,copyOutfitReward,wardrobeTopIndices} from './copy-outfits'
import {newGame,startCopy,writeVerse,dressUp} from './game'
import {withLookDefaults,randomAvatar} from './avatar'
import {newGenState} from './gen'
import {CONTENT} from '../content/catalog'
import {copySpot} from './copying'
import {serialize,deserialize} from './save'

it('adds 20 designs for each look, keeping old indices and random creation basic',()=>{
 expect(COPY_OUTFITS).toHaveLength(40)
 for(const look of ['m','f'])expect(COPY_OUTFITS.filter(o=>o.look===look)).toHaveLength(20)
 expect(new Set(COPY_OUTFITS.map(o=>o.id)).size).toBe(40)
 expect(new Set(COPY_OUTFITS.map(o=>o.name)).size).toBe(40)
 expect(wardrobeTopIndices({})).toEqual(Array.from({length:22},(_,i)=>i))
 for(let i=0;i<100;i++)expect(randomAvatar('f','나',()=>i/100).top).toBeLessThan(BASIC_TOP_COUNT)
})
it('uses a stable 5% draw, skips owned designs and stops when all are collected',()=>{
 let hits=0
 for(let chapter=1;chapter<=10000;chapter++){
  const gift=copyOutfitReward({},'mt',chapter,123,'m')
  expect(gift).toEqual(copyOutfitReward({},'mt',chapter,123,'m'))
  if(gift){hits++;expect(gift.look).toBe('m')}
 }
 expect(hits).toBeGreaterThan(420);expect(hits).toBeLessThan(580)
 const flags=Object.fromEntries(COPY_OUTFITS.map(o=>[`copyOutfit:${o.id}`,1]))
 for(let i=1;i<100;i++)expect(copyOutfitReward(flags,'mt',i,123,'f')).toBeNull()
 const missing=COPY_OUTFITS[0];delete flags[`copyOutfit:${missing.id}`]
 for(let i=1;i<100;i++){const gift=copyOutfitReward(flags,'mt',i,123,'f');if(gift)expect(gift.id).toBe(missing.id)}
})
it('awards a real completed chapter directly to the persistent wardrobe, then permits wearing it',()=>{
 let seed=0;while(!copyOutfitReward({},'phm',1,seed,'f'))seed++
 const avatar=withLookDefaults({look:'f',name:'기록자'}),base=newGame(CONTENT,avatar)
 let s=startCopy({...base,scenes:[],gen:newGenState(CONTENT,seed,base.clock.day)},'phm',CONTENT)
 const locked=copyOutfitTop('f-1')
 expect(dressUp(s,'me',{...avatar,top:locked},CONTENT)).toBe(s)
 let r=writeVerse(s,'phm',copySpot(s,'phm',CONTENT)!.verse.text,CONTENT)
 expect(r.result.kind).toBe('verse')
 expect(Object.keys(r.state.flags).some(k=>k.startsWith('copyOutfit:'))).toBe(false)
 while(r.result.kind==='verse')r=writeVerse(r.state,'phm',copySpot(r.state,'phm',CONTENT)!.verse.text,CONTENT)
 expect(r.result.kind).toBe('chapter')
 if(r.result.kind!=='chapter')throw Error('not completed')
 const gift=r.result.outfit!;expect(gift).toBeTruthy();expect(r.state.flags[`copyOutfit:${gift}`]).toBe(1)
 const worn=dressUp(r.state,'me',{...avatar,top:copyOutfitTop(gift)},CONTENT)
 expect(copyOutfitAt(worn.avatar!.top!)?.id).toBe(gift)
 const loaded=deserialize(serialize(worn),CONTENT)!
 expect(loaded.flags[`copyOutfit:${gift}`]).toBe(1);expect(loaded.avatar?.top).toBe(worn.avatar?.top)
 expect(wardrobeTopIndices(loaded.flags)).toContain(worn.avatar!.top)
 expect(writeVerse(loaded,'phm','',CONTENT).result.kind).toBe('none')
})
