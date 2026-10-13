import type {Avatar} from '../engine/avatar'
import {withLookDefaults} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {BABY,SMALL_PALETTE,PALETTE,spriteRows,writerPalette} from './sprites'

export const TIMED_GATHERINGS={
 feastFire:{people:['apothecary','child','postman','baker'],last:3,photo:'gospelFeast'},
 allFeastFire:{people:['baker','child','apothecary','grandpa'],last:4,photo:'allFeast'},
 'festival:blossom':{people:['baker','grandpa','child'],last:3},
 'festival:barley':{people:['baker','shepherd','grandpa'],last:2},
 'festival:grapes':{people:['grandpa','child','baker'],last:2},
 'festival:hearth':{people:['smith','presser','grandpa'],last:2},
 babyParty:{people:['baker','child','grandpa'],last:2},
 picnic:{people:['child','presser','grandpa'],last:2},
 starNight:{people:['grandpa','child','presser'],last:2},
} satisfies Record<string,{people:string[];last:number;photo?:string}>
export type TimedGathering=keyof typeof TIMED_GATHERINGS
export function timedGathering(id:string):{people:string[];last:number;photo?:string}|null{return Object.hasOwn(TIMED_GATHERINGS,id)?TIMED_GATHERINGS[id as TimedGathering]:null}
export function gatheringPhoto(id:string){return timedGathering(id)?.photo??id}

/** 기존 행사에 실제로 참석했을 때의 그림. 안내 장면이나 보상을 새로 만들지 않는다. */
export function drawTimedGathering(g:CanvasRenderingContext2D,id:TimedGathering,w:number,h:number,t:number,avatar:Avatar|null,cast:FinalePerson[],beat:number){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.51:Math.min(h*.43,h-125))
 const actor=(i:number,x:number,y:number,face:'up'|'down'|'left'|'right'='down',crouch=false,walk=false)=>{const a=cast[i];if(a)person(p,x,y,a.avatar,face,a.who,crouch,walk,t,1,a.short)}
 const bread=(x:number,y:number)=>{p(x,y,'#a97943',10,5);p(x+1,y-2,'#d0a468',8,5);p(x+3,y-1,'#f0d19b',1,2);p(x+6,y-1,'#f0d19b',1,2)}
 const cup=(x:number,y:number)=>{p(x,y,'#e7d4ad',5,5);p(x+1,y,'#8d684e',3,1);p(x+5,y+1,'#e7d4ad',2,3)}
 const flower=(x:number,y:number)=>{p(x,y,'#8f9f63',1,6);p(x-2,y-2,'#deb0b7',5,3);p(x-1,y-3,'#ead4bf',3,5);p(x,y-1,'#d1b174',1,1)}
 const ground=(night=true,winter=false)=>{
  p(0,0,night?'#55596b':'#d4e0cc',w,h)
  p(0,f-30,night?'#79786f':'#a4b68d',w,h-f+30)
  p(0,f-5,winter?'#d7d7c9':night?'#9f9b7b':'#b9c493',w,h-f+5)
  for(let i=0;i<30;i++)p((i*53+13)%w,f+9+(i*19)%Math.max(15,h-f-12),winter?'#babfb4':night?'#89866b':'#aab884',2,1)
 }
 if(id==='picnic'||id==='starNight'){
  const night=id==='starNight';ground(night)
  for(let x=0;x<w;x++){const y=f-27+Math.round(Math.sin(x/w*8)*4);p(x,y,night?'#4b5f58':'#95ab80',1,23)}
  if(night){
   for(let i=0;i<70;i++){const x=(i*61+7)%w,y=3+(i*29)%Math.max(8,f-34);p(x,y,Math.sin(t+i)>.7?'#e4dec4':'#9ca9ab',1,1)}
   for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++)if(x*x+y*y<=36&&(x-3)**2+(y+2)**2>36)p(cx+98+x,15+y,'#dedbc0')
   const lying=(a:FinalePerson,x:number,y:number)=>{
    p(x-3,y-19,'#a18f78',36,21);p(x-2,y-18,'#c2b49a',34,19)
    const av=a.avatar?withLookDefaults(a.avatar):undefined,pal=a.who==='writer'?writerPalette('spring',av):PALETTE
    const rows=spriteRows(a.who,'down',{frame:0,blink:false,avatar:av,short:a.short})
    rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+yy*2,y-17+xx*2,pal[c],2,2)}))
   }
   cast.slice(0,3).forEach((a,i)=>lying(a,cx-81+i*48,f+33))
   lying({avatar,who:'writer'},cx+64,f+33)
  }else{
   // 물동이와 기름틀 손잡이를 닮은 서로 다른 구름을 원래 대사에 맞춘다.
   p(cx-84,8,'#f0ecdb',20,3);p(cx-87,11,'#f0ecdb',26,9);p(cx-83,20,'#f0ecdb',18,3);p(cx-88,10,'#e5e8d6',28,2)
   p(cx+48,13,'#f0ecdb',33,5);p(cx+63,7,'#f0ecdb',5,14);p(cx+47,18,'#e5e8d6',35,2)
   p(cx-44,f+15,'#c29381',88,23);for(let x=cx-40;x<cx+42;x+=9)p(x,f+15,'#ddc5a6',2,23)
   actor(0,cx-63,f+41,'right',true);actor(1,cx+40,f+41,'left',true);actor(2,cx-8,f+13,'down',true)
   person(p,cx-8,f+52,avatar,'up','writer',true)
   p(cx-36,f+24,'#ad8d5e',23,7);p(cx-34,f+22,'#d1b486',19,3);bread(cx+14,f+28)
  }
  return
 }
 if(id==='babyParty'){
  ground(true)
  p(cx-108,f-75,'#f8c094',216,72);p(cx-114,f-89,'#a06450',228,17)
  p(cx-103,f-48,'#b28459',31,25);p(cx-100,f-45,'#f1dab0',25,19)
  p(cx+65,f-48,'#b28459',31,25);p(cx+68,f-45,'#f1dab0',25,19)
  p(cx-12,f-49,'#775b42',25,48);p(cx-8,f-45,'#be9463',17,44)
  p(cx-112,f-3,'#bb946d',224,4)
  actor(0,cx-59,f+34,'right',true);actor(1,cx+42,f+34,'left',beat>=2);actor(2,cx+84,f+35,'left')
  person(p,cx-102,f+35,avatar,'right')
  p(cx-23,f+24,'#d1b4a6',54,14);p(cx-22,f+25,'#e6d0bc',52,12)
  const bx=cx-7+(beat>=2?40:Math.round(Math.sin(t*.7)*8)),by=f+(beat>=2?24:27)
  const pal={...SMALL_PALETTE,s:writerPalette('spring',cast[0]?.avatar?withLookDefaults(cast[0].avatar):undefined).s}
  BABY.crawl.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c as keyof typeof pal])p(bx+x*2,by+y*2,pal[c as keyof typeof pal],2,2)}))
  return
 }
 const winter=id==='festival:hearth',gospel=id==='feastFire',full=id==='allFeastFire'
 ground(true,winter)
 // 장터 광장의 닫힌 좌판. 불과 인물 사이에 안전한 여백을 두고 얼굴을 가리지 않는다.
 for(const x of [cx-123,cx+82]){p(x,f-49,'#7a6650',40,45);p(x-3,f-52,'#a7896b',46,5);p(x+4,f-41,'#ad9976',32,2);p(x+4,f-32,'#ad9976',32,2)}
 const out=full&&beat>=4?Math.min(1,t/3):0
 actor(0,cx-63-out*50,f+32,'right',false,out>0&&out<1)
 actor(1,cx+45+out*55,f+32,'left',true,out>0&&out<1)
 actor(2,cx-27-out*70,f+2,'down',false,out>0&&out<1)
 actor(3,cx+22+out*78,f+2,'down',false,out>0&&out<1)
 person(p,cx-108,f+39,avatar,'right')
 p(cx-14,f+28,'#6d6551',30,5);p(cx-18,f+24,'#82735b',7,7);p(cx+14,f+24,'#82735b',7,7)
 p(cx-11,f+23,'#745039',24,3);p(cx-9,f+18,'#ad7148',21,7)
 const pulse=Math.floor(t*4)%2,height=24-Math.round(out*14)
 for(let y=0;y<height;y++){const span=Math.min(19,2+Math.floor(y/3)*2),dx=y<9?pulse*2-1:0;p(cx-span/2+dx,f+24-height+y,'#c98555',span,1);if(y>4)p(cx-span/3,f+24-height+y,y>height*.55?'#f0cf8e':'#e3ad69',Math.max(2,span/2),1)}
 if(gospel){
  // 복음서 잔치는 약차를 나누는 솥과 빈 편지 가방 자리, 네 권을 기리는 표지.
  p(cx+72,f+15,'#ac9065',37,4);p(cx+75,f+19,'#785c42',3,16);p(cx+102,f+19,'#785c42',3,16)
  p(cx+77,f+4,'#677c72',17,11);p(cx+80,f+1,'#8c9b87',11,4);p(cx+84,f-1,'#677c72',3,2)
  cup(cx+98,f+10);cup(cx+66,f+10)
  p(cx-118,f-47,'#b09a76',27,15);for(let i=0;i<4;i++){p(cx-114+i*5,f-44,'#d6c5a1',3,9);p(cx-114+i*5,f-42,'#84795f',3,1)}
 }else if(full){
  // 27권 잔치는 넉넉한 빵 진열대와 차 솥, 사람들이 함께 채운 긴 자리.
  p(cx+68,f+15,'#b5976f',46,4);p(cx+72,f+19,'#785c42',3,19);p(cx+106,f+19,'#785c42',3,19)
  for(let i=0;i<3;i++)bread(cx+71+i*13,f+10)
  p(cx-97,f+6,'#a68d6a',26,4);p(cx-94,f-4,'#758575',16,10);cup(cx-72,f+2)
  p(cx+90,f-30,'#967d55',2,24);p(cx+85,f-33,'#d8b675',12,10);p(cx+89,f-30,'#f3d79f',4,6)
 }else if(id==='festival:blossom'){
  for(let i=0;i<9;i++)flower(cx-113+i*25,f+49+i%2*3)
  p(cx+69,f+18,'#bd9f75',43,4);bread(cx+74,f+13);bread(cx+92,f+13)
  const drift=Math.floor(t*4)%47;for(let i=0;i<5;i++)p(cx-33+drift+i*13,f-18+i*6,'#e2b7b8',2,1)
 }else if(id==='festival:barley'){
  // 새 보리 단과 갓 구운 보리빵. 꽃잎이나 포도를 대신 쓰지 않는다.
  for(let i=0;i<3;i++){const x=cx+74+i*11;p(x,f+1,'#c9b879',2,32);p(x-1,f-6,'#e4d294',2,3);p(x-3,f-3,'#e4d294',6,6);p(x-2,f+3,'#d6c17e',4,3);for(let j=0;j<3;j++)p(x-2+j%2*2,f-2+j*2,'#bea563',1,1);p(x-3,f+19,'#9c7c4c',7,2)}
  p(cx+67,f+36,'#ad946d',46,3);bread(cx+73,f+31);bread(cx+94,f+31)
 }else if(id==='festival:grapes'){
  p(cx+72,f+19,'#aa885b',36,14);p(cx+74,f+18,'#cfb17e',32,3)
  for(let row=0;row<3;row++)for(let i=0;i<6-row;i++){p(cx+76+i*5+row*2,f+17-row*4,'#9381a0',3,3);p(cx+76+i*5+row*2,f+17-row*4,'#b8a3bd',1,1)}
  p(cx+82,f+1,'#89946a',17,2);p(cx+88,f-3,'#89946a',2,6)
  for(let i=0;i<3;i++){p(cx-113+i*12,f-16,'#866b4e',10,22);p(cx-112+i*12,f-11,'#b39972',8,1)}
 }else{
  // 겨울에는 불 곁의 따뜻한 잔, 쌓아 둔 장작과 눈 가장자리를 그린다.
  for(let i=0;i<4;i++){p(cx+72+i*7,f+26-i%2*4,'#896447',6,14);p(cx+73+i*7,f+27-i%2*4,'#b09064',2,12)}
  p(cx+68,f+41,'#d7d7c9',39,3);cup(cx-56,f+16);cup(cx+51,f+17)
 }
}






