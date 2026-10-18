type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** 기존 파피 빵 이야기의 창·밀가루 선반·준비대 배경. */
export function drawBakeryRoomBackground(p:Pixel,w:number,h:number,f:number){
 const cx=Math.round(w/2)
 p(0,0,'#e4c7a4',w,h);p(0,f-23,'#c6a67c',w,h-f+23)
 for(let y=f-14;y<h;y+=10)p(0,y,'#b7946c',w,1)
 p(0,f-26,'#a98460',w,3)
 // 빵집 준비대와 밀가루 선반. 장래의 특별한 빵은 아직 진열하지 않는다.
 p(cx-126,f-83,'#9c7654',57,42);p(cx-123,f-80,'#e8dfbb',51,36)
 p(cx-123,f-61,'#b5c7a0',51,17);p(cx-99,f-80,'#ad8c61',3,36)
 p(cx-123,f-63,'#ad8c61',51,2);p(cx-129,f-41,'#b39367',63,3)
 p(cx+67,f-79,'#805d43',59,52);p(cx+70,f-76,'#bd9c75',53,46)
 for(let row=0;row<2;row++){
  p(cx+70,f-56+row*23,'#96704c',53,3)
  for(let i=0;i<3;i++){
   const x=cx+75+i*16,y=f-71+row*23
   p(x,y,'#cebd95',11,15);p(x+1,y-3,'#ead8ac',9,4);p(x+4,y+4,'#ab9975',3,5)
  }
 }
 p(cx-117,f-10,'#9d7652',69,5);p(cx-112,f-5,'#78553c',4,18);p(cx-56,f-5,'#78553c',4,18)
 p(cx-109,f-15,'#e2cfaa',22,5);p(cx-104,f-17,'#eadbb9',12,3)
 p(cx-76,f-16,'#9e7c51',22,3);p(cx-63,f-18,'#b99162',5,7)
}
