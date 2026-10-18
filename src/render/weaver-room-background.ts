type Px=(x:number,y:number,c:string,a?:number,b?:number)=>void
/** 기존 페넬로피의 베틀 작업방 배경. */
export function drawWeaverRoomBackground(p:Px,w:number,h:number,f:number){
 const cx=Math.round(w/2),wall=f-21
 p(0,0,'#d9c3a3',w,h);p(0,wall,'#b99a75',w,h-wall);p(0,wall-3,'#9a7753',w,3)
 for(let y=wall+8;y<h;y+=10)p(0,y,'#a98763',w,1)
 // 가늘게 걸린 날실과 이미 엮인 천을 구분하는 작업대 뒤 작은 베틀.
 p(cx-125,f-57,'#8f6d4c',4,58);p(cx-77,f-57,'#8f6d4c',4,58)
 p(cx-128,f-59,'#af8b61',58,5);p(cx-125,f-10,'#a17a53',52,4)
 for(let i=0;i<12;i++)p(cx-120+i*3,f-52,'#e8d8b6',1,40)
 p(cx-120,f-28,'#91a99e',37,17)
 for(let y=f-26;y<f-11;y+=3)p(cx-119,y,'#b1c1ad',35,1)
 p(cx-124,f-35,'#9d7652',50,3)
 p(cx-110,f-36,'#d0b186',19,3)
 p(cx-127,f+1,'#76583e',8,3);p(cx-79,f+1,'#76583e',8,3)
 // 현재의 작업방 창과 두 개의 정리된 실 바구니.
 p(cx+75,f-78,'#9b7855',48,41);p(cx+78,f-75,'#dfdfbc',42,35)
 p(cx+78,f-57,'#a3b891',42,17);p(cx+97,f-75,'#ad8d63',3,35);p(cx+78,f-59,'#ad8d63',42,2)
 p(cx+72,f-37,'#b38e60',54,3)
 for(let i=0;i<2;i++){
  const x=cx+74+i*25
  p(x,f-1,'#a18256',22,16);p(x+2,f-3,'#765b40',18,5)
  p(x+3,f-8,i?'#c7ad96':'#a5b7a5',7,8);p(x+11,f-7,i?'#d9c5a0':'#b9cbb4',7,7)
  p(x,f+5,'#c1a275',22,1);p(x+6,f,'#8a6b45',1,13);p(x+15,f,'#8a6b45',1,13)
 }
}
