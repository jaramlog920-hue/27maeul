import type {ForgePixel} from './forge-room-background'
/** 대장간 뒤편: 기존 화덕의 벽돌·나무·잔불 색을 바깥 풀밭에 이어 놓는다. */
export function drawForgeYardBackground(p:ForgePixel,w:number,h:number,ground:number,night=false){
 const cx=Math.round(w/2),left=cx-112
 p(0,0,night?'#344758':'#cfdbbc',w,h);p(0,ground-13,night?'#667965':'#8fa379',w,h-ground+13)
 p(left,ground-77,night?'#958975':'#c8b899',124,77)
 p(left-5,ground-99,night?'#695746':'#8d7155',134,23);p(left-3,ground-96,night?'#7d654e':'#a58769',130,15)
 for(let y=ground-93;y<ground-79;y+=5)p(left-3,y,night?'#695746':'#947458',130,1)
 p(left+11,ground-61,'#6b5945',31,30);p(left+14,ground-58,night?'#bd9560':'#d5c6a0',25,24);p(left+25,ground-58,'#886747',2,24)
 p(left+83,ground-54,'#a58769',30,54);p(left+87,ground-40,'#5e5144',22,40);p(left+90,ground-8,'#886747',15,6);p(left+94,ground-10,'#bd9560',6,2)
 for(let i=0;i<25;i++){const x=(i*43+13)%w,y=ground+5+(i*13)%Math.max(10,h-ground-7);p(x,y,night?'#536a58':'#718d5e',1,4);p(x-1,y+1,night?'#536a58':'#718d5e',3,1)}
 p(cx+100,ground-59,'#786449',3,61);p(cx+83,ground-86,night?'#516c58':'#719467',34,12);p(cx+76,ground-75,night?'#45624f':'#5d855b',46,20)
}
