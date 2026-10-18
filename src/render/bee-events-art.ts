import {withLookDefaults} from '../engine/avatar'
import {drawSheepPastureBackground} from './sheep-pasture-background'
import type {Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {drawBeeFieldBackground} from './bee-field-background'
import {drawFamilyRoomBackground} from './family-room-background'
import {sheepLifeRows} from './quiet-life-motion'
import {SMALL_PALETTE,ICONS,ICON_PALETTE,writerPalette} from './sprites'

export const BEE_EVENT_IDS=['ev:beekeeper:small:winterTools','ev:juniper:flowers','ev:juniper:quietDay','ev:juniper:short:spouseHabit','ev:juniper:dancePlay','saw:lamb:clover','ev:juniper:small:springFlower','ev:beekeeper:small:flowerWalk','movedIn:beekeeper','ev:juniper:home:1','ev:juniper:home:2','ev:juniper:stung','ev:juniper:lamb','ev:beekeeper:story:2','ev:juniper:danceNew','saw:juniper:dance'] as const
export const isBeeEvent=(id:string)=>(BEE_EVENT_IDS as readonly string[]).includes(id)
export function beeEventPeople(id:string){return id==='ev:beekeeper:story:2'?['juniper','beekeeper']:id==='ev:juniper:quietDay'?['juniper','beekeeper']:id==='ev:juniper:lamb'?['juniper','dexter']:id==='ev:juniper:dancePlay'?['juniper','cosmo']:id.includes('beekeeper')?['beekeeper']:['juniper']}

export function drawBeeEvent(g:CanvasRenderingContext2D,id:string,w:number,h:number,t:number,av:Avatar|null,npc:FinalePerson,others:FinalePerson[],beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),foot=Math.round(h>w?h*.54:h<=170?h*.69:h*.6),ground=foot+8,selected=choice!=null
 const winter=id.endsWith('winterTools'),counting=id==='ev:juniper:flowers',spring=id.endsWith('springFlower'),dance=id==='saw:juniper:dance'&&beat>=1&&beat<3||id==='ev:juniper:dancePlay'&&choice===0,indoor=id==='ev:juniper:quietDay'&&choice===1&&beat>=4,sheep=id==='ev:juniper:lamb'&&(choice===0||choice===1&&beat>=3)
 g.imageSmoothingEnabled=false
 if(sheep)drawSheepPastureBackground(p,w,h,foot-18)
 else if(indoor)drawFamilyRoomBackground(p,w,h,foot,true)
 else drawBeeFieldBackground(p,w,h,foot-45,!counting&&!spring&&!winter)
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const flower=(x:number,y:number,c='#ecd07b')=>{p(x,y,'#7c9863',1,7);p(x-2,y-3,c,5,3);p(x-1,y-4,c,3,5);p(x,y-2,'#b99555');p(x+1,y+3,'#94aa70',2,1)}
 const seat=(x:number)=>{p(x-2,foot+6,'#a8835e',22,3);p(x,foot+9,'#76583e',3,10);p(x+15,foot+9,'#76583e',3,10)}
 const board=(x:number,width=40)=>{p(x,foot+4,'#b69871',width,3);p(x+2,foot+7,'#866548',3,12);p(x+width-5,foot+7,'#866548',3,12)}
 const book=(x:number,y:number,open=true,lines=3,picture:'flower'|'person'|'none'='none')=>{
  p(x,y,'#a48a66',open?28:13,open?12:9);p(x+1,y+1,'#eee0bd',open?26:11,open?10:7)
  if(open){p(x+14,y+1,'#b8a382',1,10);for(let i=0;i<lines;i++)p(x+3,y+3+i*2,'#a08964',8,1)}
  if(open&&picture==='flower'){p(x+20,y+5,'#7c9863',1,5);p(x+18,y+3,'#eee9cf',5,3);p(x+19,y+2,'#eee9cf',3,5)}
  if(open&&picture==='person'){p(x+20,y+3,'#805b45',3,3);p(x+18,y+6,'#a68a60',7,1);p(x+21,y+6,'#a68a60',1,4);p(x+19,y+10,'#805b45',2,1);p(x+23,y+10,'#805b45',2,1)}
 }
 const clover=(x:number,y:number,bundle=false)=>{for(let i=0;i<4;i++){p(x+i*3,y,'#8aa56c',1,9);p(x-2+i*3,y+1-i%2,'#a9ba88',5,3)}if(bundle)p(x-1,y+6,'#d5c99b',13,1)}
 if(winter){
  for(let i=0;i<3;i++){p(cx-125+i*31,foot-71+i%2*5,'#8e917d',28,6);p(cx-123+i*31,foot-65+i%2*5,'#bab99f',24,3)}
  p(0,foot+31,'#e3e5d3',w,h-foot-31)
 }
 if(indoor&&others[0])person(p,cx+70,ground,others[0].avatar,'left',others[0].who)
 if(sheep){
  for(let x=cx+23;x<cx+144;x+=17)p(x,foot-30,'#9a8058',3,47)
  p(cx+19,foot-26,'#bb9b6b',126,3);p(cx+19,foot-13,'#bb9b6b',126,3)
  if(choice===1)stamp(sheepLifeRows('right','walk',Math.floor(t*2)),SMALL_PALETTE,cx+7,foot+1,1)
 }
 if(id==='movedIn:beekeeper'){p(cx+57,foot+3,'#98774f',25,13);p(cx+60,foot,'#c1aa7e',19,3)}
 if(indoor)board(cx-7,40)
 if(winter||spring||id==='ev:juniper:home:2')board(cx-12,43)
 if(id==='ev:juniper:quietDay'&&choice===0){seat(cx+25);seat(cx-55)}
 const dx=dance?Math.floor(t*2)%2*2:0
 const px=id==='ev:juniper:stung'&&choice===0?cx+7:cx-55
 if(winter&&choice===1)seat(px)
 const nx=sheep?cx+30:cx+25
 const crouch=counting||spring||id==='saw:lamb:clover'&&beat===0||id==='ev:juniper:quietDay'&&choice===0||sheep&&choice===1
 person(p,px+dx,ground,av,'right','writer',counting&&choice===0||id==='ev:juniper:quietDay'&&choice===0||winter&&choice===1,dance||id.endsWith('flowerWalk')&&choice===0||id==='ev:beekeeper:story:2'&&choice===0,t)
 person(p,nx+dx,ground,npc.avatar,'left',npc.who,crouch,dance||id.endsWith('flowerWalk')&&choice===0||id==='ev:beekeeper:story:2'&&choice===0,t)
 if(id==='ev:beekeeper:story:2'&&others[0])person(p,cx-94,ground,others[0].avatar,'right',others[0].who,false,choice===0,t)
 if(id==='ev:juniper:dancePlay'&&choice===0&&others[0])person(p,cx+94,ground,others[0].avatar,'left',others[0].who)
 if(sheep&&choice===0&&others[0])person(p,cx+90,ground,others[0].avatar,'left',others[0].who)
 if(!winter&&!indoor&&!sheep)for(let i=0;i<2;i++){p(cx-119+i*30,foot-78,'#d5b365',4,2);p(cx-118+i*30,foot-78,'#665a3b')}
 if(id==='ev:juniper:dancePlay'&&choice===0&&others[0]){const pal=writerPalette('spring',others[0].avatar?withLookDefaults(others[0].avatar):undefined);p(cx+99,ground-10,pal.s,2,2);p(cx+102,ground-10,pal.s,2,2)}
 if(winter){
  p(cx-14,foot-6,'#98774f',44,9);p(cx-12,foot-5,'#c1aa7e',40,6)
  p(cx-10,foot-16,'#858779',10,12);p(cx-8,foot-18,'#b6b8a4',6,3);p(cx,foot-11,'#795c3f',6,7)
  p(cx+14,foot-5,'#858779',12,2);p(cx+6,foot-5,'#795c3f',8,2)
  if(choice===0){p(px+15,foot-3,'#795c3f',8,2);p(px+20,foot-5,'#ddd5b8',3,4)}
  if(choice===1){p(px+16,foot-3,'#eee1bd',6,5)}
 }else if(counting){
  for(let i=0;i<15;i++)flower(cx+62+i%3*15,foot-28+Math.floor(i/3)*10,i<12?'#ecd07b':'#eee9cf')
  book(nx-26,beat===0&&!selected?foot+12:foot-4,true,choice===0?4:2)
 }else if(spring||id.endsWith('spouseHabit')){
  flower(nx+35,foot-12,'#eee9cf')
  book(nx-26,foot-4,true,selected?2:1,'flower')
  if(spring&&choice===0)for(let i=0;i<5;i++)p(nx+20+i,foot+6,'#a08964')
  if(id.endsWith('spouseHabit')&&choice===2){p(nx+39,foot+5,'#d5b365',3,2);p(nx+40,foot+5,'#665a3b');p(nx+19,foot+7,'#a08964',5,1)}
 }else if(id==='ev:juniper:quietDay'){
  if(!indoor)book(nx-26,foot-4)
  else book(nx-26,foot-8,true,4,'flower')
  if(choice===0)for(let i=0;i<2;i++){p(cx-108+i*12,foot-62,'#d5b365',4,2);p(cx-107+i*12,foot-62,'#665a3b')}
 }else if(id==='ev:juniper:stung'){
  p(nx-2,ground-8,'#c18573',3,3)
  if(choice===0){stamp(ICONS.jar,ICON_PALETTE,px-9,foot-3);p(nx-2,ground-8,'#b5c29d',3,2)}
  if(choice===1&&beat>=4)flower(cx-111,foot-17,'#eee9cf')
 }else if(id==='ev:juniper:lamb'||id==='saw:lamb:clover'){
  const x=sheep?choice===0?cx+77:nx-14:nx+17
  if(id!=='saw:lamb:clover')clover(x,foot-4,true)
  if(id==='saw:lamb:clover'){p(nx-26,foot+3,'#ad9168',24,10);clover(nx-21,foot-2,true);if(beat>=2)p(nx-26,foot-2,'#d5c99b',23,1)}
 }else if(id==='ev:juniper:home:1'){
  p(cx-15,foot+7,'#d4ab60',18,17);p(cx-15,foot+12,'#ae7e32',18,2);p(cx-8,foot+20,'#492c1b',4,4)
  // Choices discuss a future location: a map, not an installed backyard hive.
  if(selected){p(cx+4,foot+10,'#eee0bd',22,12);if(choice===0){p(cx+7,foot+13,'#9a8058',15,1);for(let i=0;i<3;i++)p(cx+8+i*5,foot+11,'#9a8058',1,7)}else{p(cx+11,foot+13,'#94aa70',7,5);p(cx+18,foot+13,'#d4ab60',3,3)}}
 }else if(id==='ev:juniper:home:2'){
  stamp(ICONS.honey,ICON_PALETTE,cx+2,foot-4)
  const sx=choice===0?nx-6:cx+12;p(sx,foot-3,'#987653',7,1);p(sx-2,foot-4,'#d6b66c',3,3)
  if(choice===1){p(px+14,foot-3,'#987653',6,1);p(px+18,foot-4,'#d6b66c',2,2)}
 }else if(id==='ev:juniper:danceNew'){
  const closed=choice===1;board(cx+42,35);book(nx-26,foot-8,!closed,2,'person')
 }else if(id==='saw:juniper:dance'){
  book(beat>=3?nx-26:cx+51,beat>=3?foot-4:foot+12,beat>=3,beat>=3?4:1)
  p(nx+38,foot-41,'#d5b365',4,2);p(nx+39,foot-41,'#665a3b')
 }else if(id==='ev:juniper:dancePlay'){
  if(choice===1)book(nx-26,foot-4,false)
 }else if(id==='ev:beekeeper:story:2'){
  for(let i=0;i<5;i++){p(cx+59+i*10,foot-39,'#d5b365',3,2);p(cx+60+i*10,foot-39,'#665a3b')}
 }else if(id.endsWith('flowerWalk')){flower(cx+54,foot-2);clover(cx+71,foot+6)}
}
