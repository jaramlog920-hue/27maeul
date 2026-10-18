import type {ForgePixel} from './forge-room-background'
/** 기존 강가 쉼터의 하늘·물길·배·둔덕·나무를 공유한다. */
export function drawRiverRestBackground(p:ForgePixel,w:number,h:number,t:number,horizon:number,shore:number,evening:boolean,showBoat=true){
 const cx=Math.round(w/2)
 const sky=evening?['#9391a1','#b5a4aa','#d6b7ad','#e5c9af']:['#c5d9cf','#cbded0','#d7e2cd','#e1e5cc']
 p(0,0,sky[0],w,h)
 for(let y=0;y<horizon;y++)p(0,y,sky[Math.min(3,Math.floor(y/horizon*4))],w,1)
 for(const [x,y,len] of [[cx-115,12,39],[cx+43,22,55]] as const){p(x,y,evening?'#d8c1bb':'#e2e5d5',len,1);p(x+6,y-2,evening?'#c2acb0':'#dde5d6',len-13,1)}
 p(0,horizon,evening?'#849b99':'#89b2aa',w,shore-horizon)
 // 낮은 건너편 둔덕. 바다나 해변 대신 폭이 좁은 마을 물길을 그린다.
 for(let x=0;x<w;x++){const y=horizon-4+Math.round(Math.sin(x/w*8)*3);p(x,y,evening?'#91967e':'#a7bb92',1,11);p(x,y+7,evening?'#828b76':'#97b186',1,4)}
 
 for(let row=0;row<10;row++){
  const y=horizon+11+row*3
  if(y>=shore)continue
  for(let x=(row*17+Math.floor(t*3))%39-12;x<w;x+=42)p(x,y,row%3?evening?'#a8b6a4':'#b6ccc0':evening?'#708f8c':'#75a59c',9+row%4*3,1)
 }
 // 물 위의 작은 배는 실제 마을의 목재 색과 작은 윤곽을 쓴다.
 if(showBoat){
 const boatX=cx+94,boatY=horizon+20+Math.round(Math.sin(t)*.5)
 p(boatX+2,boatY+6,evening?'#afbaa7':'#b6ccc0',26,1)
 p(boatX,boatY,'#8d5829',25,3);p(boatX+3,boatY+3,'#b17640',19,3);p(boatX+6,boatY-1,'#8d5829',13,1)
 }
 // 앞쪽 둔덕은 물에서 떨어진 땅이며 모든 인물의 발을 이 흙 위에 둔다.
 p(0,shore,'#869675',w,h-shore);p(0,shore+4,evening?'#a9a887':'#b6bd90',w,h-shore-4)
 p(0,shore+9,evening?'#c0b394':'#ccbf9a',w,h-shore-9)
 for(let i=0;i<40;i++){const x=(i*47+11)%w,y=shore+15+(i*13)%Math.max(12,h-shore-16);p(x,y,evening?'#b2a88a':'#bdb58e',2,1)}
 for(const x of [cx-135,cx+140]){
  p(x,shore-37,'#776e50',4,51);p(x-14,shore-56,'#87996d',30,11);p(x-22,shore-47,'#718b64',43,13)
  for(let i=0;i<5;i++){p(x-18+i*8,shore-36,'#718b64',3,12+i%2*7);p(x-17+i*8,shore-28,'#8b9f75',1,9)}
 }
}
