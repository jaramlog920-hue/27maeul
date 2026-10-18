/** Original pharmacy facade from the existing worry scene. */
export function drawApothecaryFrontBackground(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,f:number,offset=0){
 const cx=Math.round(w/2)+offset
 p(0,0,'#d3d9bd',w,h);p(0,f-10,'#9eaf85',w,h-f+10);p(0,f+9,'#c5b18d',w,h-f-9)
 // 실제 약방의 붉은 기와·크림 벽·초록 줄무늬 차양.
 const left=cx-125
 p(left,f-61,'#f0d8b0',105,68);p(left+3,f-58,'#f4e0c0',99,61)
 p(left-5,f-76,'#944850',115,16);p(left-2,f-74,'#b05860',109,11)
 for(let y=f-71;y<f-62;y+=4){p(left-2,y,'#c06c74',109,1);for(let x=left+5;x<left+105;x+=13)p(x,y-3,'#944850',1,3)}
 p(left+59,f-43,'#906040',28,49);p(left+62,f-40,'#a47c52',22,46);p(left+79,f-20,'#ddbd82',2,3)
 p(left+13,f-56,'#ac7444',31,27);p(left+16,f-53,'#d7dbaf',25,21);p(left+27,f-53,'#ac7444',2,21)
 for(let i=0;i<6;i++)p(left+8+i*7,f-62,i%2?'#f8e8cc':'#58984c',7,7)
 p(left+9,f-29,'#b38e63',40,4)
 // 약초 화분은 왼쪽에 두어 약병 다섯 개와 구분한다.
 p(left+10,f-7,'#ad8461',16,15);p(left+8,f-9,'#c6a077',20,3)
 for(let i=0;i<3;i++){p(left+12+i*4,f-23,'#708b5b',1,14);p(left+9+i*4,f-25-i%2*3,'#8ea76e',7,3)}
 p(cx+86,f-39,'#927751',3,52);p(cx+69,f-63,'#a1b183',32,10);p(cx+64,f-53,'#859c73',42,15);p(cx+73,f-38,'#859c73',25,6)
 for(let i=0;i<20;i++)p((i*53+11)%w,f+30+(i*17)%Math.max(12,h-f-35),'#b9a37d',2,1)
}
