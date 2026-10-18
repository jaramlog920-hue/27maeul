import {writeFileSync} from 'node:fs'
import {it} from 'vitest'
import {FAMILY_FURNITURE_ART} from '../../src/render/family-furniture-art'
import {childFurnitureFrame,petFurnitureRows,petFurnitureObjectRows} from '../../src/render/family-furniture-motion'
import {FURNI_PALETTE} from '../../src/render/furniture-art'
import {writerPalette,ANIMAL_PALETTE} from '../../src/render/sprites'
import {withLookDefaults} from '../../src/engine/avatar'
import {ADDITION_FURNITURE} from '../../src/engine/furniture-additions'
import {CHILD_FURNITURE,PET_FURNITURE} from '../../src/engine/family-furniture'
it('exports the live originals and every motion phase for offline visual inspection',()=>{
 const tiles=Object.entries(FAMILY_FURNITURE_ART).map(([id,a])=>({label:ADDITION_FURNITURE[id].name,layers:[{rows:a.rows,palette:FURNI_PALETTE}],w:16,h:16}));
 const motions=[];
 for(const toddler of [true,false])for(const look of ['m','f'] as const){
 const avatar=withLookDefaults({look,name:'아이',hairFront:8,top:13});
 for(const id of CHILD_FURNITURE)for(let frame=0;frame<4;frame++){
 const f=childFurnitureFrame(id,'down',frame,avatar,toddler);
 motions.push({label:`${ADDITION_FURNITURE[id].name} ${toddler?'유아':'어린이'} ${look} ${frame}`,w:32,h:32,layers:[{rows:f.furniture,palette:FURNI_PALETTE},{rows:f.actor,palette:writerPalette('spring',avatar)},{rows:f.front,palette:FURNI_PALETTE}]});
 }}
 for(const kind of ['dog','cat'] as const)for(const baby of [false,true])for(const id of PET_FURNITURE)for(let frame=0;frame<4;frame++){
 motions.push({label:`${ADDITION_FURNITURE[id].name} ${kind} ${baby?'새끼':'성체'} ${frame}`,w:16,h:16,layers:[{rows:petFurnitureObjectRows(id,'down',frame),palette:FURNI_PALETTE},{rows:petFurnitureRows(id,kind,'down',frame,baby),palette:ANIMAL_PALETTE[kind],dy:-1}]});
 }
 writeFileSync('artifacts/scenery/family-furniture-visual.json',JSON.stringify({tiles,motions}));
});
