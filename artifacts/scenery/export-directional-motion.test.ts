import {writeFileSync} from 'node:fs'
import {childFurnitureFrame,petFurnitureRows,petFurnitureObjectRows} from '../../src/render/family-furniture-motion'
import {FURNI_PALETTE} from '../../src/render/furniture-art'
import {writerPalette,ANIMAL_PALETTE} from '../../src/render/sprites'
import {withLookDefaults} from '../../src/engine/avatar'
import {CHILD_FURNITURE,PET_FURNITURE} from '../../src/engine/family-furniture'
it('export all directional phases',()=>{
 const groups=[];
 for(const toddler of [true,false])for(const id of CHILD_FURNITURE)for(const facing of ['down','up','left','right'] as const){
  const av=withLookDefaults({look:'m',name:'child'});
  groups.push({label:`${id}/${facing}/${toddler?'toddler':'child'}`,frames:[0,1,2,3].map(p=>{
   const f=childFurnitureFrame(id,facing,p,av,toddler);
   return {w:32,h:32,layers:[{rows:f.furniture,pal:FURNI_PALETTE},{rows:f.actor,pal:writerPalette('spring',av)},{rows:f.front,pal:FURNI_PALETTE}]};
  })});
 }
 for(const kind of ['cat','dog'] as const)for(const baby of [true,false])for(const id of PET_FURNITURE)for(const facing of ['down','up','left','right'] as const){
  groups.push({label:`${id}/${kind}/${facing}/${baby?'baby':'adult'}`,frames:[0,1,2,3].map(p=>({w:16,h:16,layers:[{rows:petFurnitureObjectRows(id,facing,p),pal:FURNI_PALETTE},{rows:petFurnitureRows(id,kind,facing,p,baby),pal:ANIMAL_PALETTE[kind],dy:-1}]}))});
 }
 writeFileSync('artifacts/scenery/furniture-directional-motion.json',JSON.stringify(groups));
})
