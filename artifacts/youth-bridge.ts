import './all-bugs-bridge'
import { newChild } from '../src/engine/child'
import { newGame, childTile, SCHOOL_SEAT, childAtSchool } from '../src/engine/game'
import { CONTENT } from '../src/content/catalog'
import { siblingTile, selectKid } from '../src/engine/siblings'
import { serialize, deserialize } from '../src/engine/save'
import { withLookDefaults } from '../src/engine/avatar'
const fixture=(age:number)=>{
 const b=newGame(CONTENT),day=100
 return {...b,avatar:withLookDefaults({name:'유년검사',look:'f'}),homeLevel:2,coins:200,scenes:[],clock:{day,minute:600},flags:{...b.flags,growthLegacy:1,villageLevel:10},
 child:{...newChild(day-age,b.stats,undefined),name:'검사아이',born:day-age},siblings:[{...newChild(day-age-46,b.stats,undefined),name:'다른아이',born:day-age-46,...(age+46>=84?{job:'scribe' as const,jobConfirmed:true}:{})}],
 looks:{child:withLookDefaults({name:'검사아이',look:'f',top:4,bottom:4})},player:{...b.player,x:21,y:46,path:[]}}
}
;(window as unknown as {__youth:unknown}).__youth={fixture,childTile,SCHOOL_SEAT,childAtSchool,siblingTile,selectKid,serialize,deserialize}
