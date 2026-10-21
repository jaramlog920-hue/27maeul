import './all-bugs-bridge'
import { newChild } from '../src/engine/child'
import { newGame } from '../src/engine/game'
import { CONTENT } from '../src/content/catalog'
import { ITEM_TEXT } from '../src/content/text'
import { withLookDefaults } from '../src/engine/avatar'
import { HOME_ENTRY } from '../src/engine/world'
import { serialize, deserialize } from '../src/engine/save'
const fixture=(age:number,mode='full')=>{
 const b=newGame(CONTENT),day=100
 const ids=Object.keys(ITEM_TEXT).filter(id=>!['woodToy','clothDoll','bread','herb','fig','olive','reed'].includes(id)).slice(0,mode==='free'?49:50)
 return {...b,avatar:withLookDefaults({name:'활동검사',look:'f'}),homeLevel:2,room:[],coins:200,scenes:[],clock:{day,minute:600},flags:{...b.flags,growthLegacy:1,villageLevel:10,...(mode==='chest'||mode==='fullChest'?{'unlock:supplyChest':1}:{})},
  child:{...newChild(day-age,b.stats,undefined),name:'검사아이',born:day-age},
  inv:Object.fromEntries(ids.map(id=>[id,1])),...(mode==='fullChest'?{chest:{woodToy:30}}:{}),player:{...b.player,...HOME_ENTRY,path:[]}}
}
;(window as unknown as {__activity:unknown}).__activity={fixture,serialize,deserialize}
