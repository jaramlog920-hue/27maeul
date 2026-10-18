import {drawEventPrecipitation} from './event-precipitation'
import type {ProposalArtContext} from './dexter-proposal-art'
type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** Original Milo room, teal roof and delivery path, shared without changing the proposal. */
export function drawPostmanBackground(p:Pixel,w:number,h:number,f:number,context:ProposalArtContext={minute:900,indoors:false,wet:false},t=0){
 const cx=Math.round(w/2),night=context.minute>=1260||context.minute<300,evening=!night&&context.minute>=1020,libraryPath=!context.indoors&&!!context.at&&context.at.y<=11
 p(0,0,night?'#455269':evening?'#c1b4ab':context.wet?'#b7c3bd':'#d8e0cc',w,h)
 const letter=(x:number,y:number)=>{p(x,y,'#e1d5b5',9,6);p(x+1,y+1,'#b9a383',1,1);p(x+7,y+1,'#b9a383',1,1);p(x+2,y+2,'#b9a383',5,1)}
 if(context.indoors){
  p(0,0,night?'#8b8170':'#d0c1a2',w,h);p(0,f-22,night?'#8b7861':'#ae926e',w,h-f+22)
  for(let y=f-15;y<h;y+=9)p(0,y,night?'#7e6b56':'#a28763',w,1)
  // 실제 편지 나르는 이웃 방의 편지꽂이, 편지 놓인 탁자와 궤짝.
  p(cx-128,f-65,'#9c7d57',61,27)
  for(let i=0;i<3;i++){p(cx-124+i*18,f-56,'#785f43',14,13);letter(cx-122+i*18,f-58)}
  p(cx-124,f-48,'#c1a478',54,3)
  p(cx+61,f-9,'#b6996f',43,4);p(cx+64,f-5,'#866c4d',3,22);p(cx+98,f-5,'#866c4d',3,22)
  letter(cx+65,f-15);letter(cx+72,f-14)
  p(cx-117,f-9,'#927652',34,22);p(cx-118,f-11,'#bca073',36,5);p(cx-102,f-6,'#d8c08a',3,3)
  // 닫힌 수첩을 내려두고, 새 글자는 쓰지 않는다.
  p(cx+84,f-17,'#806b56',12,8);p(cx+86,f-15,'#cbbd98',9,4);p(cx+85,f-16,'#a68d6c',1,6)
 }else{
  p(0,f-27,night?'#68785e':context.wet?'#839783':'#98ab82',w,h-f+27);p(0,f+3,night?'#9b937b':context.wet?'#a6a58f':'#c3b18e',w,h-f-3)
  if(context.wet&&!context.snow){
   for(let i=0;i<7;i++){
    const x=(i*79+23)%Math.max(1,w-28),y=f+16+(i*37)%Math.max(1,h-f-23)
    p(x,y,night?'#788b88':'#8fa5a0',18+i%3*5,2)
    p(x+4,y,night?'#9aa7a0':'#bfcdc0',8,1)
   }
  }
  if(libraryPath){
   p(cx-139,f-77,'#b3b09d',93,80);p(cx-142,f-83,'#8f937f',99,7)
   for(let y=f-71;y<f;y+=13)p(cx-136,y,'#c6c2ab',87,1)
   for(let row=0;row<5;row++)for(let x=cx-130+(row%2)*11;x<cx-48;x+=24)p(x,f-71+row*13,'#a19f8b',1,12)
   p(cx+66,f+2,'#a38a65',42,3);p(cx+69,f+5,'#806b4f',3,12);p(cx+101,f+5,'#806b4f',3,12)
  }else{
   // 실제 청록 기와와 크림 벽의 마일로 집 앞.
   p(cx-136,f-73,'#f4e0c0',93,76);p(cx-141,f-85,'#3c808c',103,13);p(cx-137,f-83,'#4898a4',95,6)
   p(cx-124,f-61,'#ac7444',34,28);p(cx-121,f-58,night?'#536577':'#c4d6c0',28,22)
   p(cx-109,f-58,'#ac7444',2,22);p(cx-121,f-48,'#ac7444',28,2)
   p(cx-76,f-44,'#906040',25,47);p(cx-59,f-20,'#d4bc89',2,3)
   // 실제 편지 바구니의 작은 외형을 쓰되 배달 동작은 추가하지 않는다.
   p(cx+71,f-1,'#af9068',25,15);p(cx+69,f-3,'#d0b88e',29,4)
   for(let y=f+4;y<f+14;y+=3)p(cx+72,y,'#c2a478',23,1)
   letter(cx+76,f-6)
  }
  if(context.snow)p(0,f+3,'#dce0d1',w,3)
  if(context.wet)drawEventPrecipitation(p,w,h,t,!!context.snow,night)
 }
}

