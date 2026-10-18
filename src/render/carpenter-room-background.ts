/** Existing carpenter workshop walls, window, tools and floor. */
export function drawCarpenterRoomBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,floor:number){
 const cx=Math.round(w/2)
 p(0,0,'#c6b49a',w,h);p(0,floor,'#ad906c',w,h-floor)
 for(let y=floor+8;y<h;y+=9)p(0,y,'#9e7f5d',w,1)
 p(0,floor-3,'#a28661',w,3)
 // 해 질 무렵 공방 창문과 정리된 공구. 사용하지 않는 톱은 벽에 걸려 있다.
 p(cx-119,floor-62,'#856a4b',43,36);p(cx-116,floor-59,'#d9b69a',37,30)
 p(cx-116,floor-41,'#a9b08c',37,12);p(cx-99,floor-59,'#a1835c',2,30);p(cx-116,floor-45,'#a1835c',37,2)
 p(cx+70,floor-63,'#8b6e4e',49,4)
 for(let i=0;i<3;i++){p(cx+77+i*15,floor-59,'#796348',2,8);p(cx+75+i*15,floor-51,'#ab9369',6,14);p(cx+77+i*15,floor-51,'#dfc79f',2,13)}
 p(cx+65,floor-33,'#927655',3,35);p(cx+66,floor-33,'#c0a77f',10,3);p(cx+73,floor-33,'#927655',3,35)
 for(let i=0;i<4;i++)p(cx+65,floor-24+i*6,'#b99d72',11,2)
}
