/** Existing bee notebook field, reused without changing its pixels. */
export function drawBeeFieldBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,f:number,flowers=true){
 const cx=Math.round(w/2)
 p(0,0,'#dbe1c0',w,h);p(0,f-25,'#b4c395',w,h-f+25);p(0,f+4,'#c4c795',w,h-f-4)
 for(let i=0;i<25;i++){const x=i*17%w,y=f+13+(i*23)%Math.max(18,h-f-17);p(x,y,'#b3bb84',2,1)}
 // 실제 마을의 황금빛 벌통과 입구. 공책과 사람은 벌통에서 떨어진 자리에 둔다.
 for(let i=0;i<3;i++){
  const x=cx-123+i*31,y=f-24+i%2*5
  p(x-3,y+27,'#a5b47f',33,4);p(x,y,'#d4ab60',24,27)
  p(x,y+6,'#ae7e32',24,3);p(x,y+15,'#ae7e32',24,3);p(x+9,y+21,'#492c1b',6,6)
  p(x+2,y+1,'#e7c982',20,2)
 }
 p(cx-127,f-39,'#8c7852',4,42);p(cx-140,f-68,'#94a775',33,14);p(cx-148,f-57,'#7f996c',46,19)
 // 토끼풀 무리와 몇 종류의 꽃은 주니퍼가 적은 관찰 대상을 보여 준다.
 const flower=(x:number,y:number,c:string)=>{p(x,y,'#829763',1,7);p(x-2,y-2,c,5,3);p(x-1,y-3,c,3,5);p(x,y-1,'#d8c982',1,1);p(x+1,y+3,'#96ac71',2,1)}
 if(flowers)for(let i=0;i<9;i++)flower(cx+70+(i%3)*13,f-9+Math.floor(i/3)*12,i%3?'#f0e5c4':'#d2b2b7')
 p(cx+72,f+33,'#a2b37f',42,3)
}
