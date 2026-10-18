type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** 기존 간식과 찻잔 장면의 격자창·차통 선반·마루를 그대로 공유한다. */
export function drawTeaRoomBackground(p:Pixel,w:number,h:number,f:number){
 const cx=Math.round(w/2)
 p(0,0,'#e0d6b5',w,h);p(0,f,'#b49b78',w,h-f)
 for(let y=f+5;y<h;y+=10){p(0,y,'#a58b6a',w,1);for(let x=(y%3)*33;x<w;x+=65)p(x,y,'#a58b6a',1,10)}
 p(0,f-3,'#92795b',w,3)
 // 찻집의 넓은 격자창과 차통 선반. 창 아래 작은 잎 그림자가 흔들린다.
 p(cx-105,f-66,'#9c8160',62,49);p(cx-102,f-63,'#c9d9bf',56,43)
 p(cx-102,f-43,'#97b28d',56,23)
 for(let i=0;i<4;i++){p(cx-101+i*14,f-34-(i%2)*5,'#789871',14,9);p(cx-100+i*14,f-27,'#b3c39b',12,5)}
 p(cx-77,f-63,'#a18a64',3,43);p(cx-102,f-44,'#a18a64',56,3)
 p(cx-110,f-69,'#8c765b',72,3);p(cx-108,f-66,'#ddd0aa',6,45);p(cx-47,f-66,'#ddd0aa',6,45)
 p(cx+53,f-56,'#947859',55,4)
 for(let i=0;i<3;i++){p(cx+59+i*15,f-72,'#748579',9,16);p(cx+58+i*15,f-74,'#576e65',11,3);p(cx+61+i*15,f-65,'#ddd3ad',5,5)}
 p(cx+67,f-25,'#b69770',44,5);p(cx+70,f-20,'#8f7051',3,27);p(cx+105,f-20,'#8f7051',3,27)
}
