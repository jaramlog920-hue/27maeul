export type ForgePixel=(x:number,y:number,c:string,a?:number,b?:number)=>void
/** Hearth-side event prop; no map furniture is moved or created. */
export function drawForgeBellows(p:ForgePixel,w:number,ground:number){
 const x=Math.round(w/2)-141,y=ground-17
 p(x+1,y+12,'#5e5144',14,3)
 p(x+2,y+4,'#886747',11,8)
 p(x+3,y+5,'#bd9560',9,6)
 for(const dx of [4,7,10])p(x+dx,y+5,'#886747',1,6)
 p(x,y+3,'#886747',14,2)
 p(x+1,y+3,'#bd9560',11,1)
 p(x+12,y+7,'#5e5144',4,2)
 p(x+15,y+6,'#727875',3,2)
}
/** 기존 틸리 약속 장면의 공동주택 아래층 화덕·모루를 그대로 공유한다. */
export function drawForgeRoomBackground(p:ForgePixel,w:number,h:number,f:number,night=false,bare=false){
 const cx=Math.round(w/2)
 p(0,0,night?'#81796a':'#c8b899',w,h);p(0,f-25,'#b4946f',w,h-f+25)
 for(let y=f-17;y<h;y+=9)p(0,y,'#9c825f',w,1)
 if(bare)return
 p(cx-125,f-76,'#a58769',48,79);p(cx-119,f-59,'#5e5144',36,51)
 p(cx-114,f-20,'#886747',26,11);p(cx-108,f-22,'#bd9560',13,4)
 for(let y=f-70;y<f-5;y+=12)p(cx-124,y,'#947458',46,1)
 p(cx+76,f-4,'#886747',31,21);p(cx+71,f-18,'#727875',45,8);p(cx+72,f-10,'#606961',34,6);p(cx+89,f-22,'#8b9186',13,4)
 p(cx+97,f-25,'#8d704b',3,11);p(cx+93,f-28,'#6c736b',12,5)
}
