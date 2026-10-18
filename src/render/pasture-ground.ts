/** Existing sloping pasture ground; no livestock or fences are added. */
export function drawPastureGround(p:(x:number,y:number,c:string,a?:number,b?:number)=>void,w:number,h:number,floor:number,night=false){
 p(0,0,night?'#424e64':'#d7dfc8',w,h)
 // 언덕의 완만한 경사와 이어지는 흙길. 발밑 높이는 인물 둘이 같다.
 for(let x=0;x<w;x+=4){const ridge=floor-45+Math.round(14*Math.sin(x/w*5));p(x,ridge,night?'#64765c':'#a7bb8c',4,h-ridge);p(x,ridge+14,night?'#586b54':'#99af7d',4,h-ridge-14)}
 p(0,floor-7,night?'#8a9270':'#b2bb88',w,h-floor+7);p(0,floor+12,night?'#9c9479':'#c8b38c',w,h-floor-12)
 for(let i=0;i<36;i++){const x=(i*47+9)%w,y=floor-31+(i*13)%34;p(x,y,night?'#768c68':'#7f9c66',1,3);p(x+1,y+1,night?'#768c68':'#7f9c66',2,1)}
}
