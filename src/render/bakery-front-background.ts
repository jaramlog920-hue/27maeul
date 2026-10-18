type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** 기존 가게 닫는 날의 빵집 지붕·벽·길·화분. */
export function drawBakeryFrontBackground(p:Pixel,w:number,h:number,ground:number,open=false){
 const cx=Math.round(w/2),left=cx-104
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
  if(open){p(x+1,ground-41,'#d8d5b0',20,19);p(x+2,ground-31,'#b3c08d',18,9)}
  else for(let y=ground-40;y<ground-21;y+=4)p(x,y,'#906040',22,1)
  p(x+10,ground-43,'#906040',2,23)
 }
 p(left+6,ground-17,'#906040',42,4);p(left+10,ground-13,'#795438',3,15);p(left+40,ground-13,'#795438',3,15)
 p(left+17,ground-24,'#b78c59',23,7);p(left+18,ground-23,'#6f513a',21,3)
 p(left+23,ground-21,'#d2ad78',1,4);p(left+32,ground-21,'#d2ad78',1,4)
 // 화분과 아침 나무 그늘. 같은 길바닥에 발을 붙여 대화한다.
 p(left-18,ground-6,'#a57752',13,10);p(left-19,ground-7,'#bc946c',15,3)
 for(let i=0;i<3;i++){p(left-16+i*4,ground-14,'#718756',2,8);p(left-18+i*4,ground-16,'#d6b68e',5,3)}
 p(cx+91,ground-27,'#896d4c',4,34);p(cx+73,ground-65,'#829a6c',35,10);p(cx+66,ground-55,'#69865e',48,16);p(cx+74,ground-39,'#69865e',32,8)
 p(cx+57,ground+11,'#bbaa80',58,4)
}
