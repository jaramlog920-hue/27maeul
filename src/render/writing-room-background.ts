/** Existing library writing-room window and unused binding supplies. */
export function drawWritingRoomBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,f:number){
 const cx=Math.round(w/2)
 p(0,0,'#d8c5a6',w,h);p(0,f-20,'#b69872',w,h-f+20)
 for(let y=f-14;y<h;y+=9)p(0,y,'#a58764',w,1)
 p(0,f-23,'#947754',w,3)
 p(cx-112,f-83,'#aa8863',50,43);p(cx-109,f-80,'#e3dfba',44,37)
 p(cx-109,f-62,'#b1c396',44,19);p(cx-89,f-80,'#af946a',3,37);p(cx-109,f-64,'#af946a',44,2)
 p(cx-115,f-41,'#ad8d62',56,3)
 // 未使用の表紙板と糸は棚に残す。紙を綴じた完成本を先取りしない。
 p(cx+81,f-53,'#947754',33,55);p(cx+84,f-50,'#c7a67b',27,49)
 p(cx+85,f-29,'#947754',26,3);p(cx+89,f-22,'#b49d77',17,2);p(cx+89,f-19,'#b49d77',17,2)
 p(cx+89,f-46,'#dbcdb2',9,9);p(cx+91,f-44,'#a68d6b',5,5)
}
