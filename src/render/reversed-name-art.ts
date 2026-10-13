import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person} from './milestone-moments-art'
import {PALETTE,writerPalette} from './sprites'

/** 저녁 공방 앞: 작은 이름판을 건네고, 고쳐 적는 선택만 숯 글씨를 더한다. */
export function drawReversedName(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,rudy:FinalePerson,beat:number,choice?:number|null){
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
 const cx=Math.round(w/2),f=Math.round(h<=170?h*.64:Math.min(h*.52,h-92)),help=choice===1,keep=choice===0
 p(0,0,'#b3aea0',w,h);p(0,f-29,'#8e9c7c',w,h-f+29);p(0,f+3,'#b6a382',w,h-f-3)
 // 원래 저녁 시간의 공방 벽, 정리해 둔 목재와 짧은 공구.
 p(cx-133,f-79,'#bfad8b',93,82);p(cx-137,f-89,'#8d7058',101,11);p(cx-134,f-87,'#a47e64',95,5)
 p(cx-119,f-66,'#806547',38,30);p(cx-116,f-63,'#d9b68a',32,24);p(cx-102,f-63,'#ad895f',2,24);p(cx-116,f-52,'#ad895f',32,2)
 p(cx-122,f-39,'#947351',44,3)
 p(cx-74,f-47,'#957450',27,50);p(cx-71,f-44,'#765a40',21,47);p(cx-57,f-23,'#d6b685',2,3)
 for(let i=0;i<4;i++){p(cx-128+i*9,f-14-i*3,'#9d7c54',6,26+i*3);p(cx-127+i*9,f-13-i*3,'#c4a275',2,24+i*3)}
 p(cx+65,f-15,'#a98a62',43,5);p(cx+68,f-10,'#7c6044',3,23);p(cx+101,f-10,'#7c6044',3,23)
 p(cx+75,f-19,'#c8aa7c',24,4);p(cx+96,f-26,'#826347',3,7);p(cx+93,f-27,'#a0a799',9,3)
 p(cx+123,f-30,'#77674e',4,40);p(cx+113,f-62,'#758466',28,13);p(cx+108,f-49,'#657658',38,17)
 for(let i=0;i<22;i++)p((i*59+7)%w,f+19+(i*17)%Math.max(12,h-f-23),'#aa9776',2,1)
 // 팔을 늘리지 않고 가까운 손 사이에 판을 둔다. 두 사람의 얼굴보다 아래다.
 person(p,cx-23,f,avatar,'right')
 person(p,cx+12,f,rudy.avatar,'left',rudy.who)
 const bx=cx-3+(keep? -4:0),by=f-12
 p(bx,by,'#987043',24,11);p(bx+1,by+1,'#d3b084',22,9);p(bx+2,by+1,'#e2c497',20,1);p(bx+2,by+10,'#ad8454',20,1)
 // 두 줄의 이름. 마지막 글자만 뒤집은 비대칭 새김.
 const glyphs=['111/010/010/011','101/111/101/101','110/010/010/111','111/001/011/001']
 for(let row=0;row<2;row++)for(let k=0;k<2;k++){
  const rows=glyphs[row*2+k].split('/'),flipped=row===1&&k===1
  rows.forEach((line,y)=>[...line].forEach((a,x)=>{if(a==='1')p(bx+3+k*7+x,by+2+row*4+(flipped?3-y:y),'#735536')}))
 }
 if(help){
  // 바른 글자를 옆에 숯으로 적는다. 원래 새김과 판을 보존한다.
  const rows=glyphs[3].split('/'),n=Math.min(12,Math.floor(t*6))
  rows.forEach((line,y)=>[...line].forEach((a,x)=>{if(a==='1'&&y*3+x<n)p(bx+19+x,by+6+y,'#514d43')}))
  const playerPal=writerPalette('spring',avatar?withLookDefaults(avatar):undefined),rudyPal=rudy.who==='writer'?writerPalette('spring',rudy.avatar?withLookDefaults(rudy.avatar):undefined):PALETTE
  if(t<2||beat<3){p(bx+7,by+5,playerPal.s,2,2);p(bx+9,by+5,'#514d43',3,1)}
  else{const trace=Math.floor(t*2)%4;p(bx+19,by+6+trace,rudyPal.s,2,2)}
 }
 // 그대로 간직하는 선택에서도 거꾸로 새긴 글자를 남긴다.
 p(cx+108+Math.floor(t)%12,f-23,'#99a17d',2,1)
}
