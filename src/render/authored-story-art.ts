import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {drawRiverRest} from './river-rest-art'
import {drawForkSign} from './fork-sign-art'
import {drawReedRackBuilt} from './reed-rack-built-art'
import {drawSnacksAndCups} from './snacks-and-cups-art'
import {drawSnackBasket} from './snack-basket-art'
import {drawSharedChair} from './shared-chair-art'
import {drawFamilyTrip} from './family-trip-art'
import {drawLightShoes} from './light-shoes-art'
import {drawOvenSharing} from './oven-sharing-art'
import {person} from './milestone-moments-art'

/** 개별 대사와 대조해 완성한 장면만 등록한다. 공통 그림을 완성 장면으로 취급하지 않는다. */
export const AUTHORED_STORY_IDS=['ev:wendell:home:2','ev:baker:story:3','lightShoes','fam:trip','ev:carpenter:story:3','ev:baker:small:festBasket','ev:poppy:story:2','built:reedRack','ev:rudy:small:signPost','village:3'] as const
export function hasAuthoredStory(id:string){return (AUTHORED_STORY_IDS as readonly string[]).includes(id)}

export function authoredStoryPeople(id:string):string[]{return id==='village:3'?['grandpa','fisher','baker']:id==='ev:rudy:small:signPost'?['rudy','postman']:id==='built:reedRack'?['carpenter']:id==='ev:poppy:story:2'?['poppy','wendell']:id==='ev:baker:small:festBasket'?['baker']:id==='ev:carpenter:story:3'?['carpenter','rudy','smith']:id==='ev:baker:story:3'?['baker','wendell']:id==='lightShoes'?['shepherd']:[]}

export function drawAuthoredStory(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,avatar:Avatar|null,npc:FinalePerson,others:FinalePerson[]=[],beat=0,choice?:number|null){
 if(!hasAuthoredStory(id))return
 g.imageSmoothingEnabled=false
 if(id==='village:3'){drawRiverRest(g,w,h,t,avatar,npc,others[0]??npc,others[1]??npc,beat);return}
 if(id==='ev:rudy:small:signPost'){drawForkSign(g,w,h,t,avatar,npc,others[0]??npc,beat,choice);return}
 if(id==='built:reedRack'){drawReedRackBuilt(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:poppy:story:2'){drawSnacksAndCups(g,w,h,t,avatar,npc,others[0]??npc,beat,choice);return}
 if(id==='ev:baker:small:festBasket'){drawSnackBasket(g,w,h,t,avatar,npc,beat,choice);return}
 if(id==='ev:carpenter:story:3'){drawSharedChair(g,w,h,t,avatar,npc,others[0]??npc,others[1]??npc,beat);return}
 if(id==='fam:trip'){drawFamilyTrip(g,w,h,t,avatar,npc,beat);return}
 if(id==='lightShoes'){drawLightShoes(g,w,h,t,avatar,npc,beat);return}
 if(id==='ev:baker:story:3'){drawOvenSharing(g,w,h,t,avatar,npc,others[0]??npc,beat);return}
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),ground=Math.round(h*(h<=170?.65:.5)),left=cx-104
 // 실제 마을 빵집의 지붕·벽·덧문 색. 아침, 반죽을 멈춘 가게 앞.
 p(0,0,'#d9dcc0',w,h);p(0,ground-15,'#b3c08d',w,h-ground+15)
 p(0,ground+5,'#c9b58b',w,h-ground-5)
 for(let i=0;i<25;i++){const x=(i*47+11)%w,y=ground+20+(i*19)%Math.max(15,h-ground-25);p(x,y,'#bda97f',2,1)}
 p(left,ground-65,'#eeb080',142,67);p(left+3,ground-61,'#f8c094',136,60)
 p(left-5,ground-90,'#885444',152,26);p(left-2,ground-87,'#a06450',146,18)
 for(let y=ground-83;y<ground-68;y+=5){p(left-2,y,'#b07864',146,1);for(let x=left+3+(y%2)*8;x<left+140;x+=16)p(x,y-3,'#975d4b',1,3)}
 p(left-5,ground-68,'#885444',152,5)
 // 나무문과 닫힌 덧문. 판매대는 비고 바구니는 정리되어 있다.
 p(left+61,ground-40,'#ac7444',29,42);p(left+64,ground-37,'#906040',23,39)
 p(left+75,ground-37,'#795438',2,39);p(left+80,ground-19,'#d8b47c',2,3)
 p(left+61,ground+1,'#ad936b',29,3)
 for(const x of [left+14,left+105]){
  p(x-2,ground-45,'#ac7444',26,27);p(x,ground-43,'#b48155',22,23)
  for(let y=ground-40;y<ground-21;y+=4)p(x,y,'#906040',22,1)
  p(x+10,ground-43,'#906040',2,23)
 }
 p(left+6,ground-17,'#906040',42,4);p(left+10,ground-13,'#795438',3,15);p(left+40,ground-13,'#795438',3,15)
 p(left+17,ground-24,'#b78c59',23,7);p(left+18,ground-23,'#6f513a',21,3)
 p(left+23,ground-21,'#d2ad78',1,4);p(left+32,ground-21,'#d2ad78',1,4)
 // 문 옆에는 빵 그림을 뒤집어 둔 작은 나무판이 걸렸다.
 p(left+94,ground-51,'#896745',1,7);p(left+88,ground-44,'#8c6845',15,10);p(left+89,ground-43,'#dbc49a',13,8);p(left+91,ground-39,'#a1885e',9,1)
 // 화분과 아침 나무 그늘. 같은 길바닥에 발을 붙여 대화한다.
 p(left-18,ground-6,'#a57752',13,10);p(left-19,ground-7,'#bc946c',15,3)
 for(let i=0;i<3;i++){p(left-16+i*4,ground-14,'#718756',2,8);p(left-18+i*4,ground-16,'#d6b68e',5,3)}
 p(cx+91,ground-27,'#896d4c',4,34);p(cx+73,ground-65,'#829a6c',35,10);p(cx+66,ground-55,'#69865e',48,16);p(cx+74,ground-39,'#69865e',32,8)
 p(cx+57,ground+11,'#bbaa80',58,4)
 person(p,cx-28,ground+23,npc.avatar,'right',npc.who)
 const approach=Math.min(1,Math.max(0,t/2.5))
 person(p,cx+38-approach*24,ground+23,avatar,'left','writer',false,approach<1,t)
 // 가게 앞 공기만 움직인다. 답변으로 고른 계획을 이미 실행한 것처럼 그리지 않는다.
 const leafX=cx+69+(Math.floor(t*2)%15),leafY=ground-34+(Math.floor(t*3)%24)
 p(leafX,leafY,'#99a979',2,1)
}




