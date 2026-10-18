type Pixel=(x:number,y:number,c:string,a?:number,b?:number)=>void
/** 기존 가족 여행 첫 마을의 집·돌길·항아리 배경을 공유한다. */
export function drawTravelTownBackground(p:Pixel,w:number,h:number,floor:number,redRoofs=false){const cx=Math.round(w/2)
  p(0,0,'#d4d9c3',w,h);p(0,floor-10,'#b8c399',w,h-floor+10);p(0,floor+7,'#c8b58f',w,h-floor-7)
  if(redRoofs)for(let x=0;x<w;x++){const back=floor-94+Math.round(Math.sin(x/w*Math.PI*2)*12),front=floor-73+Math.round(Math.sin(x/w*Math.PI*2+1)*14);p(x,back,'#b9c39f',1,floor-back);p(x,front,'#a8b58c',1,floor-front)}
  // 낯선 마을의 낮은 집들과 돌길. 캐릭터는 원래 키로 나란히 걷는다.
  for(const [dx,wall,roof] of [[-124,'#d9c7a5','#b27e68'],[-34,'#d8c3a1','#9f947b'],[58,'#dfcca8','#a47b68']] as const){
   const x=cx+dx,y=floor-65
   p(x,y,wall,68,65);p(x-4,y-18,redRoofs?'#b27e68':roof,76,20);p(x-4,y+1,'#907059',76,3)
   for(let ry=y-14;ry<y;ry+=5)p(x-1,ry,'#bc9577',70,1)
   p(x+27,floor-33,'#907458',17,33);p(x+29,floor-31,'#705d48',13,31)
   p(x+8,floor-44,'#af936f',13,17);p(x+10,floor-42,'#d4dcc1',9,13)
   p(x+51,floor-44,'#af936f',11,17);p(x+53,floor-42,'#c8d0af',7,13)
  }
  for(let i=0;i<12;i++){const x=12+i*27,y=floor+11+(i%2)*11;p(x,y,'#b7a787',17,5);p(x+1,y,'#d0c1a0',15,1)}
  p(cx+114,floor-9,'#b58c67',13,10);p(cx+116,floor-11,'#c7a179',9,3)
}
