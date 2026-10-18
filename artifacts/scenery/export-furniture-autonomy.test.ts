import {it} from 'vitest'
import {writeFileSync} from 'node:fs'
import {additionUseFrame,ADDITION_USE_ACTIONS,ADDITION_USE_INFO} from '../../src/render/addition-furniture-motion'
import {furnitureUseFrame,USE_PROP_PALETTE} from '../../src/render/furniture-use-motion'
import {withLookDefaults} from '../../src/engine/avatar'
import {PALETTE,writerPalette} from '../../src/render/sprites'
import {FURNI_PALETTE} from '../../src/render/furniture-art'
it('exports the same actor/object layers used by autonomous NPC furniture rendering',()=>{
 const avatar=withLookDefaults({name:'아이',look:'m',skin:3,top:4});
 const profiles=[{label:'어린이',who:'writer',opts:{frame:0,blink:false,avatar,short:1},pal:writerPalette('spring',avatar)}, {label:'헤이즐',who:'baker',opts:{frame:0,blink:false},pal:PALETTE},{label:'할아버지',who:'grandpa',opts:{frame:0,blink:false,elder:true},pal:PALETTE}];
 const sheets=profiles.map(profile=>{
 const frames=[];
 for(const action of ADDITION_USE_ACTIONS){
  if(profile.label==='어린이'&&['sew','knead','mill','washDishes'].includes(action))continue;
  for(let p=0;p<4;p++){
   const f=additionUseFrame(profile.who,'down',action,p,profile.opts);
   frames.push({label:`${ADDITION_USE_INFO[action].label} ${p}`,w:48,h:48,layers:[{rows:f.furnitureBack,palette:FURNI_PALETTE},{rows:f.propBack,palette:FURNI_PALETTE},{rows:f.actor,palette:profile.pal},{rows:f.furnitureFront,palette:FURNI_PALETTE},{rows:f.propFront,palette:FURNI_PALETTE}]});
  }
 }
 for(const action of ['drink','read','craft','reach','pet'])for(let p=0;p<4;p++){
  const f=furnitureUseFrame(profile.who,'down',action,p,profile.opts,true,true);
  frames.push({label:`서서 ${action} ${p}`,w:24,h:24,layers:[{rows:f.propBack,palette:USE_PROP_PALETTE},{rows:f.actor,palette:profile.pal},{rows:f.propFront,palette:USE_PROP_PALETTE}]});
 }
 return{label:profile.label,frames};
 });
 writeFileSync('artifacts/scenery/furniture-autonomy-visual.json',JSON.stringify(sheets));
});
