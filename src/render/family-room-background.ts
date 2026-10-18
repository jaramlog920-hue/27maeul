/** 기존 ‘같이 읽은 책’ 방의 창·시렁·바닥·화분을 그대로 재사용한다. */
export function drawFamilyRoomBackground(p:(x:number,y:number,c:string,w?:number,h?:number)=>void,w:number,h:number,foot:number,night=false){
 const cx=Math.round(w/2),wall=foot-37
 p(0,0,night?'#817966':'#d8c5a6',w,h);p(0,wall,night?'#8e7b61':'#b69872',w,h-wall)
 for(let y=wall+7;y<h;y+=9)p(0,y,night?'#79694f':'#a58764',w,1)
 p(0,wall-3,'#947754',w,3)
 p(cx-111,wall-50,'#aa8863',43,36);p(cx-108,wall-47,night?'#435268':'#e3dfba',37,30)
 p(cx-108,wall-28,night?'#63756c':'#b1c396',37,11);p(cx-91,wall-47,'#af946a',3,30);p(cx-108,wall-31,'#af946a',37,2)
 p(cx-114,wall-15,'#ad8d62',49,3)
 p(cx+70,wall-41,'#a17c56',38,43);p(cx+73,wall-38,'#c7a67b',32,38)
 for(let row=0;row<2;row++){
  for(let i=0;i<4;i++){p(cx+76+i*7,wall-33+row*19,['#8eaa91','#b38b83','#bca978','#a696ae'][i],5,13);p(cx+77+i*7,wall-31+row*19,'#e5d7b4',3,1)}
  p(cx+73,wall-18+row*19,'#967452',32,2)
 }
 p(cx-104,foot-8,'#b38662',13,9);p(cx-101,foot-11,'#bca67b',7,3)
 p(cx-100,foot-21,'#89956b',1,10);p(cx-105,foot-21,'#a1ad7b',7,3);p(cx-100,foot-25,'#a1ad7b',6,3)
}
