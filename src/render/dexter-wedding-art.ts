import {withLookDefaults,type Avatar} from '../engine/avatar'
import type {FinalePerson} from './library-finale-art'
import {person as nativePerson} from './milestone-moments-art'
import {weddingOutfitFrame,type WeddingDressedAvatar} from './wedding-outfits'
import {SHEEP,SMALL_PALETTE,PALETTE,spriteRows,writerPalette,ICONS,ICON_PALETTE} from './sprites'
import {WEDDING_ARCH,WEDDING_PROPS} from './wedding-art'
import {FURNI_PALETTE} from './furniture-art'
import {weddingGuestPlaces} from './wedding-ceremony-layout'

/** 덱스터가 양 목에 꽃을 달아 데려온 광장 결혼 잔치. */
export function drawDexterWedding(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,spouse:FinalePerson,guests:(FinalePerson&{id?:string})[],beat:number,theme:'sheep'|'table'|'invitations'|'grapes'|'herbalTea'|'patchwork'|'oliveCups'|'banquetTea'|'honeySpoons'|'fishPlatter'|'forgedRings'|'breadBoard'|'wovenFlags'='sheep'){
 // One fixed ceremony frame at every ratio. The camera scales all native pixels
 // together; it never stretches bodies or omits guests to fit a thumbnail.
 const scale=Math.min(w/320,h/220),ox=(w-320*scale)/2,oy=(h-220*scale)/2
 g.fillStyle='#9d9a7b';g.fillRect(0,0,w,h)
 const p=(x:number,y:number,c:string,a=1,b=1)=>{g.fillStyle=c;const xx=Math.round(ox+x*scale),yy=Math.round(oy+y*scale);g.fillRect(xx,yy,Math.max(1,Math.round(ox+(x+a)*scale)-xx),Math.max(1,Math.round(oy+(y+b)*scale)-yy))}
 w=320;h=220
 const portrait=false,cx=160,f=119
 const stamp=(rows:readonly string[],pal:Record<string,string>,x:number,y:number,scale=1)=>rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*scale,y+yy*scale,pal[c],scale,scale)}))
 const person:typeof nativePerson=(pixel,x,foot,av,facing='up',who='writer',crouch=false,walk=false,time=0,growth=1,short,elder,season='spring')=>{
  const outfit=(av as WeddingDressedAvatar|null)?.weddingOutfit
  if(!outfit||!av){nativePerson(pixel,x,foot,av,facing,who,crouch,walk,time,growth,short,elder,season);return}
  const frame=weddingOutfitFrame(av,outfit,facing,time,crouch?'crouch':'stand',walk,who,elder)
  stamp(frame.rows,frame.palette,x,foot-frame.rows.length*2,2)
 }
 g.imageSmoothingEnabled=false
 p(0,0,'#56586b',w,h);p(0,f-70,'#7c8571',w,h-f+70);p(0,f-20,'#9d9a7b',w,h-f+20)
 const sky=Math.max(0,f-100),colors=['#3d4259','#454b62','#51586d','#616a78']
 for(let y=0;y<sky;y++)p(0,y,colors[Math.min(3,Math.floor(y/Math.max(1,sky)*4))],w,1)
 for(let i=0;i<24&&sky>30;i++)p((i*67+23)%w,8+(i*43)%Math.max(1,sky-20),i%3?'#8e9aa8':'#c6c8b4',1,1)
 for(let i=0;i<45;i++)p((i*59+17)%w,f-9+(i*17)%Math.max(15,h-f+9),'#89866b',2,1)
 // 닫힌 광장 좌판, 가운데 꽃 아치, 실제 잔치에서 쓰는 탁자와 촛불.
 stamp(WEDDING_ARCH.down.rows,FURNI_PALETTE,cx-32,f-47)
 if(theme!=='oliveCups'&&theme!=='banquetTea'&&theme!=='honeySpoons'&&theme!=='fishPlatter'&&theme!=='forgedRings'&&theme!=='breadBoard'&&theme!=='wovenFlags')stamp(WEDDING_PROPS.candlePair.rows,FURNI_PALETTE,cx-49,f-15)
 stamp(WEDDING_PROPS.candlePair.rows,FURNI_PALETTE,cx+33,f-15)
 if(theme!=='table'){
  const beside=theme==='herbalTea'||theme==='grapes'
  stamp(theme==='herbalTea'?WEDDING_PROPS.feastTable.rows.map(r=>r.replace(/[bBlC]/g,'c')):WEDDING_PROPS.feastTable.rows,FURNI_PALETTE,cx+(beside?35:4),f+(beside?2:54))
 }
 if(theme!=='wovenFlags')stamp(WEDDING_PROPS.flowerPot.rows,FURNI_PALETTE,cx-48,f-34)
 stamp(WEDDING_PROPS.flowerPot.rows,FURNI_PALETTE,cx+32,f-34)
 // 앞줄부터 잘라 채우지 않고 실제로 이사 온 손님 전원을 양옆에 배치한다.
 const elder=theme==='grapes'?guests.find(a=>a.id==='grandpa'):undefined
 const crowd=elder?guests.filter(a=>a!==elder):guests
 for(const slot of weddingGuestPlaces(crowd.length,w,f)){
  const a=crowd[slot.index],x=slot.x,foot=slot.foot,side=x<cx?0:1
  const facing=Math.floor(t/3+slot.index)%7===0?'down':side===0?'right':'left'
  const greeting=beat>=2&&Math.floor(t*2+slot.index*1.7)%11===0
  if(greeting&&theme!=='invitations'){
   const av=a.avatar?withLookDefaults(a.avatar):undefined,rows=spriteRows(a.who,facing,{avatar:av,pose:'wave',frame:0,blink:false,growth:a.growth??1,short:a.short,elder:a.elder,season:a.season??'spring'})
   stamp(rows,a.who==='writer'?writerPalette(a.season??'spring',av):PALETTE,x,foot-rows.length*2,2)
  }else person(p,x,foot,a.avatar,facing,a.who,false,false,t,a.growth??1,a.short,a.elder,a.season)
  if(theme==='invitations'){
   // 손 곁의 실제 작은 봉투. 접은 삼각 덮개와 봉합선, 손 한 칸을 구분한다.
   const ex=x+(side===0?14:0),ey=foot-11
   p(ex,ey,'#bba789',7,5);p(ex+1,ey+1,'#efe0bd',5,3)
   p(ex+1,ey+1,'#b69b76',1,1);p(ex+5,ey+1,'#b69b76',1,1);p(ex+2,ey+2,'#b69b76',3,1)
   const pal=a.who==='writer'?writerPalette('spring',a.avatar?withLookDefaults(a.avatar):undefined):PALETTE
   p(side===0?ex:ex+5,ey+3,pal.s,2,2)
  }
 }
 // 등불 네 개: 줄과 기둥은 머리 위에 두며 불빛은 작은 두 프레임뿐이다.
 for(const dx of [-114,-61,48,109]){
  const x=cx+dx,y=7;p(x,y,'#876e51',2,19);p(x-4,y-4,'#b0976c',10,12)
  p(x-2,y-2,'#e2c389',6,8);p(x,y-1+Math.floor(t*2)%2,'#f3ddb0',2,5)
  if(theme==='forgedRings'){
   stamp(['.HHH.','H...H','H...H','.HHH.'],{H:'#b7bdaf'},x-2,y-8)
   p(x-1,y-8,'#e2dfc4',1,1);p(x+2,y-6,'#7c877b',1,1)
  }
 }
 // 원래 양 도트에 목의 작은 꽃만 더한다. 몸과 다리 비율은 바꾸지 않는다.
 if(theme==='sheep')for(const [x,y] of [[cx-57,f+15],[cx-44,f+(portrait?26:21)]]){
  stamp(SHEEP,SMALL_PALETTE,x,y,2)
  p(x+10,y+4,'#8b9e6b',2,3);p(x+9,y+3,'#deb3b2',4,3);p(x+10,y+4,'#f0ddbd',2,1)
 }
 if(theme==='grapes'&&elder)person(p,cx+65,f+5,elder.avatar,'left',elder.who,false,false,0,1,elder.short)
 if(theme==='oliveCups'){
  // 모닥불 옆의 낮은 두 사람 탁자와 낮은 의자. 얼굴은 컵에서 떨어져 있다.
  const tx=cx-48,ty=f+5
  p(tx+2,ty+3,'#896c4a',3,14);p(tx+23,ty+3,'#896c4a',3,14)
  p(tx,ty,'#a78661',28,4);p(tx+1,ty,'#d1b18a',26,1)
  for(const x of [cx-70,cx-24]){
   p(x+2,f+10,'#836b51',3,8);p(x+13,f+10,'#836b51',3,8)
   p(x,f+9,'#b99a72',18,3);p(x+1,f+9,'#d1b18a',16,1)
  }
 }
 if(theme==='wovenFlags'&&beat===1){
  person(p,cx+10,f+1,avatar,'left')
  person(p,cx-15,f+4,spouse.avatar,'left',spouse.who)
 }else if(theme==='breadBoard'&&beat===1){
  person(p,cx+11,f+1,avatar,'left')
  person(p,cx-18,f+10,spouse.avatar,'left',spouse.who)
 }else if(theme==='forgedRings'&&beat===1){
  person(p,cx+14,f+1,avatar,'left')
  person(p,cx-10,f+4,spouse.avatar,'left',spouse.who)
 }else if(theme==='fishPlatter'&&beat===1){
  person(p,cx+9,f+1,avatar,'left')
  person(p,cx-23,f+10,spouse.avatar,'left',spouse.who)
 }else if(theme==='honeySpoons'&&beat===1){
  person(p,cx+10,f+1,avatar,'left')
  person(p,cx-17,f+10,spouse.avatar,'left',spouse.who)
 }else if(theme==='banquetTea'&&beat===1){
  person(p,cx+12,f+1,avatar,'left')
  person(p,cx-18,f+8,spouse.avatar,'left',spouse.who)
 }else if(theme==='oliveCups'&&beat>=1){
  person(p,cx-69,f+16,avatar,'right','writer',beat>=2)
  person(p,cx-23,f+16,spouse.avatar,'left',spouse.who,beat>=2)
 }else if(theme==='patchwork'&&(beat===1||beat===2)){
  person(p,cx+2,f+1,avatar,'left')
  person(p,cx-24,f+8,spouse.avatar,'left',spouse.who)
 }else if(theme==='herbalTea'&&beat===1){
  person(p,cx-14,f+1,avatar,'right')
  person(p,cx+34,f+8,spouse.avatar,'left',spouse.who)
 }else if(theme==='grapes'&&beat===1){
  person(p,cx-22,f+1,avatar,'right')
  person(p,cx+5,f+5,spouse.avatar,'right',spouse.who)
 }else if(theme==='invitations'&&beat===1){
  person(p,cx-19,f+1,avatar,'left')
  person(p,cx+1,f+1,spouse.avatar,'right',spouse.who)
 }else if(theme==='invitations'&&beat===2){
  person(p,cx-19,f+1,avatar,'right')
  const av=spouse.avatar?withLookDefaults(spouse.avatar):undefined,pal=spouse.who==='writer'?writerPalette('spring',av):PALETTE
  const outfit=(spouse.avatar as WeddingDressedAvatar|null)?.weddingOutfit,formal=outfit&&spouse.avatar?weddingOutfitFrame(spouse.avatar,outfit,'down',t,'wave',false,spouse.who):null
  const rr=formal?.rows??spriteRows(spouse.who,'down',{avatar:av,pose:'wave',frame:0,blink:false})
  stamp(rr,formal?.palette??pal,cx+1,f+1-rr.length*2,2)
 }else if(beat===1){
  if(theme==='table'){
   const approach=Math.min(1,t/1.8)
   person(p,cx-21,f+5,avatar,'right')
   person(p,cx+2+Math.round(approach*13),f+5+Math.round(approach*8),spouse.avatar,approach===1?'right':'left',spouse.who,false,approach<1,t)
  }else{
   person(p,cx-10,f+1,avatar,'left')
   person(p,cx-37,f+23,spouse.avatar,'left',spouse.who,true)
  }
 }else{
  person(p,cx-19,f+1,avatar,beat>=2?'down':'right')
  person(p,cx+1,f+1,spouse.avatar,beat>=2?'down':'left',spouse.who)
 }
 if(theme==='wovenFlags'){
  // 삼각으로 짠 잔치 깃발. 윗변과 줄은 고정하고 아래 끝만 한 도트씩 바람에 움직인다.
  p(cx-80,f-28,'#8a7151',2,50);p(cx-38,f-28,'#8a7151',2,50)
  p(cx-78,f-23,'#c9b58d',40,1)
  const colors=['#c69ca4','#a8bbb1','#d8c49a'],sway=Math.floor(t*1.5)%2
  for(let i=0;i<3;i++){
   const x=cx-78+i*13,y=f-22
   for(let row=0;row<10;row++){
    const dx=Math.floor(row/2)+(row>=5?sway:0),width=12-row
    p(x+dx,y+row,colors[i],width,1)
    if(row===3||row===6)p(x+dx+1,y+row,'#e6d9bb',Math.max(1,width-2),1)
   }
   for(let stitch=1;stitch<12;stitch+=3)p(x+stitch,y,'#eee1c2',1,1)
  }
 }
 if(theme==='breadBoard'){
  // 밤새 구운 빵은 완성된 채 내놓는다. 같은 빵 하나를 받침에 옮겨 권한다.
  const tx=cx-80,ty=f+6
  p(tx+3,ty+4,'#82694c',4,16);p(tx+47,ty+4,'#82694c',4,16)
  p(tx,ty,'#a2845c',56,4);p(tx+1,ty,'#cfb58a',54,1)
  p(tx+2,ty-1,'#e1d4b1',52,3);p(tx+3,ty,'#c1b290',50,1)
  stamp(ICONS.bread,ICON_PALETTE,cx-77,f-6,2)
  stamp(ICONS.bread,ICON_PALETTE,cx-59,f-6,2)
  if(beat===1){
   p(cx-36,f+5,'#947851',18,2);p(cx-35,f+5,'#d8bd8e',16,1)
   stamp(ICONS.bread,ICON_PALETTE,cx-35,f-7,2)
   const pal=spouse.who==='writer'?writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined):PALETTE
   p(cx-18,f+4,pal.s,2,2)
  }else stamp(ICONS.bread,ICON_PALETTE,cx-41,f-6,2)
  const bx=cx-77,by=f+25
  p(bx,by,'#aa885c',27,9);p(bx+1,by,'#d0b487',25,2)
  for(let y=by+3;y<by+9;y+=2)p(bx+1,y,'#c1a071',25,1)
  for(let x=bx+5;x<bx+26;x+=6)p(x,by+2,'#94754f',1,7)
  stamp(ICONS.bread,ICON_PALETTE,bx+3,by-4)
  stamp(ICONS.bread,ICON_PALETTE,bx+15,by-4)
 }
 if(theme==='forgedRings'){
  // 낮은 등불 받침에서 새 고리를 보여 준다. 완성된 고리는 고정하고 한 점만 반짝인다.
  for(const dx of [-75,-43]){
   const x=cx+dx,y=f-14
   p(x+12,y-4,'#8b7254',3,45);p(x-5,y-4,'#ad916d',20,3)
   p(x+6,y+40,'#7d6a51',15,3)
   stamp(['..HHHH..','.H....H.','H......H','H......H','.H....H.','..HHHH..'],{H:'#adb8aa'},x-3,y)
   p(x-1,y,'#e4e0c8',3,1);p(x+4,y+3,'#718174',1,2)
   p(x-4,y+6,'#796c52',10,16);p(x-3,y+7,'#d7b578',8,12)
   p(x-2,y+8,'#edce91',6,10);p(x-5,y+21,'#796c52',12,2)
   p(x-1,y+9+Math.floor(t*2)%2,'#f3ddb0',2,7)
   if(beat===1)p(x-1,y+1,'#f1e8c9',1,1)
  }
 }
 if(theme==='fishPlatter'){
  // 잡은 물고기는 이미 잔치에 내놓았다. 낚시나 운반을 다시 시작하지 않는다.
  const tx=cx-79,ty=f+6
  p(tx+3,ty+3,'#886d50',4,17);p(tx+46,ty+3,'#886d50',4,17)
  p(tx,ty,'#a88a65',54,4);p(tx+1,ty,'#d4bb93',52,1)
  // 긴 접시 위 물고기 세 마리: 꼬리·등지느러미·눈을 원래 작은 소품 비율로 구분한다.
  p(cx-75,f+2,'#afa58b',46,5);p(cx-74,f+1,'#e1d6b8',44,4)
  const fish=['....dd........','t..dmmmmmd....','ttddmmmmmmme..','.tddmmmmmmmm..','ttddmmmmmmmd..','t..ddddddd....','....dd........']
  const pal={d:'#84937e',m:'#c9cfb7',t:'#9aa894',e:'#635f4d'}
  for(let i=0;i<3;i++)stamp(fish,pal,cx-73+i*14,f-5)
  // 다 내놓은 뒤의 빈 어획 바구니. 음식 수는 대사나 시간에 따라 늘지 않는다.
  const bx=cx-77,by=f+24
  p(bx,by,'#9d7c53',22,9);p(bx+1,by-1,'#d0b387',20,3);p(bx+3,by,'#766b50',16,2)
  for(let y=by+4;y<by+9;y+=2)p(bx+1,y,'#b6976b',20,1)
  for(let x=bx+5;x<bx+21;x+=5)p(x,by+3,'#876b4c',1,6)
 }
 if(theme==='honeySpoons'){
  // 원본 꿀단지와 작은 나눔 접시. 벌은 잔치에 데려오지 않으며 음식 보상도 추가하지 않는다.
  const tx=cx-73,ty=f+5
  p(tx+3,ty+4,'#8a7051',4,16);p(tx+38,ty+4,'#8a7051',4,16)
  p(tx,ty,'#b0956e',47,5);p(tx+1,ty,'#ded0ad',45,2)
  stamp(beat===0?ICONS.honey:ICONS.honey.map(r=>r.replace(/N/g,'.')),ICON_PALETTE,cx-69,f-11,2)
  if(beat>=1){p(cx-66,f-9,'#a57a40',10,1);p(cx-65,f-8,'#edc26b',8,1);p(cx-68,f+7,'#8d734e',8,2)}
  p(cx-47,f+4,'#b9ac8b',20,5);p(cx-46,f+3,'#eee2c4',18,3)
  const spoon=(x:number,y:number,loaded:boolean)=>{
   p(x,y,'#a68a60',4,3);p(x+4,y+1,'#bfa47c',5,1)
   if(loaded)p(x+1,y+1,'#edc26b',2,1)
  }
  spoon(cx-45,f-1,beat>=1);spoon(cx-45,f+3,beat>=1)
  if(beat===1){
   spoon(cx-26,f-1,true)
   const pal=spouse.who==='writer'?writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined):PALETTE
   p(cx-18,f, pal.s,2,2)
  }else spoon(cx-35,f+1,beat>=1)
 }
 if(theme==='banquetTea'){
  // 직접 우린 잔치 차를 여러 사람이 나눌 준비대: 큰 차통과 세 잔, 별도의 쟁반.
  const tx=cx-79,ty=f+4
  p(tx+3,ty+4,'#836c52',4,17);p(tx+47,ty+4,'#836c52',4,17)
  p(tx,ty,'#a78a65',56,5);p(tx+1,ty,'#d8c8a2',54,2)
  p(tx+2,ty+2,'#b9ac8b',52,1)
  const ux=cx-73,uy=f-14
  p(ux+2,uy,'#b68e66',16,17);p(ux+4,uy+1,'#d7b184',3,13)
  p(ux,uy-2,'#92734f',20,3);p(ux+7,uy-4,'#80694f',5,2)
  p(ux+4,uy+16,'#82694e',12,3)
  p(ux+18,uy+8,'#967853',4,3);p(ux+20,uy+8,'#d4b384',2,1)
  p(ux-3,uy+3,'#9d7d56',5,9);p(ux-2,uy+4,'#9d9a7b',2,6)
  const cup=(x:number,y:number)=>{p(x,y,'#e5dbc0',5,5);p(x+1,y,'#9a7850',3,1);p(x+5,y+1,'#e5dbc0',2,3)}
  cup(cx-50,f-1);cup(cx-39,f-1)
  if(beat===1){
   p(cx-30,f+1,'#937653',14,2);p(cx-29,f+1,'#d6bb8e',12,1)
   cup(cx-27,f-4)
   const pal=spouse.who==='writer'?writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined):PALETTE
   p(cx-18,f+2,pal.s,2,2)
  }else{p(cx-30,f+4,'#937653',14,2);cup(cx-28,f-1)}
  const steam=Math.floor(t*2)%2
  p(ux+8,uy-8-steam,'#c9cfb8',1,3);p(ux+10,uy-11-steam,'#b8c2aa',1,2)
 }
 if(theme==='oliveCups'){
  // 둘이 고른 잔은 두 개뿐이다. 약차 주전자나 꿀단지는 없는 별도의 장식 탁자.
  const cup=(x:number,y:number,color:string)=>{
   p(x-1,y+6,'#ddd3b5',10,1);p(x,y,color,6,6)
   p(x+1,y,'#9a805b',4,1);p(x+1,y+2,'#eee3c5',4,1)
   p(x+6,y+1,color,2,4);p(x+6,y+2,'#a78661',1,2)
  }
  cup(cx-45,f-3,'#b8c7c2');cup(cx-32,f-3,'#d6c09a')
  // 가는 가지에 쌍으로 달린 올리브 잎. 줄기와 잎 윤곽을 따로 남긴다.
  p(cx-43,f+5,'#9b8b62',18,1)
  for(let i=0;i<4;i++){
   const x=cx-42+i*4
   p(x,f+3,'#73896c',3,2);p(x+1,f+3,'#a4b493',1,1)
   p(x+1,f+6,'#829574',3,2);p(x+2,f+6,'#b1bda0',1,1)
  }
 }
 if(theme==='patchwork'){
  // 생활 천의 작은 직사각 조각을 실제 이음선으로 연결한다. 깃발이나 큰 현수막이 아니다.
  p(cx-78,f+3,'#806c52',2,27);p(cx-25,f+3,'#806c52',2,27)
  p(cx-76,f+7,'#c2ac82',51,1)
  const cloths=[['#b99978',10,8],['#a7b397',9,10],['#b59aa6',11,9],['#d5c29a',9,8],['#9da9b3',10,10]] as const
  let x=cx-75
  for(let i=0;i<cloths.length;i++){
   const [color,width,height]=cloths[i],y=f+8
   p(x,y,color,width,height)
   if(i%2===0){p(x+2,y+3,'#ddd0b1',width-4,1);p(x+2,y+5,'#ddd0b1',width-4,1)}
   else for(let xx=2;xx<width-1;xx+=3)p(x+xx,y+4,'#e2d8bc',1,1)
   // 구멍 난 끝단을 꿰맨 짧은 실: 줄과 천 윗부분은 고정한다.
   p(x,y,'#e3d6b4',1,1);p(x,y+3,'#e3d6b4',1,1);p(x,y+6,'#e3d6b4',1,1)
   p(x+1,y+height,'#867b68',width-2,1)
   x+=width
  }
 }
 if(theme==='table'){
  // 루디가 이미 완성해 가져온 새 탁자: 두꺼운 다리·장부 이음·가로 버팀대.
  const tx=cx+4,ty=f+54
  p(tx+3,ty+4,'#896c4a',5,22);p(tx+54,ty+4,'#896c4a',5,22)
  p(tx+6,ty+17,'#a38259',50,4);p(tx+7,ty+17,'#c29c6b',48,1)
  p(tx,ty,'#98744c',64,7);p(tx+1,ty,'#dbb887',62,3)
  for(let x=tx+16;x<tx+63;x+=16)p(x,ty,'#b69467',1,3)
  for(const x of [tx+5,tx+56]){p(x,ty+4,'#d4af79',2,2);p(x,ty+15,'#ddba85',2,2)}
  stamp(WEDDING_PROPS.feastTray.rows,FURNI_PALETTE,tx+9,ty-12)
  stamp(WEDDING_PROPS.feastTray.rows,FURNI_PALETTE,tx+35,ty-12)
 }
 if(theme==='grapes'){
  // 할아버지가 가져온 한 바구니. 덮개를 연 대사부터 포도 세 송이가 보인다.
  const bx=cx+43,by=f+4
  p(bx,by,'#ab865b',25,8);p(bx+1,by,'#d6b98a',23,2)
  for(let y=by+3;y<by+8;y+=2)p(bx+1,y,'#c3a376',23,1)
  for(let x=bx+5;x<bx+24;x+=6)p(x,by+2,'#98734e',1,6)
  if(beat===0){p(bx-1,by-4,'#ddd3b1',27,5);p(bx+2,by-4,'#aaa986',2,4);p(bx+20,by-4,'#aaa986',2,4)}
  else{
   p(cx+36,f+15,'#ddd3b1',8,3);p(cx+37,f+16,'#bab294',6,1)
   for(let i=0;i<3;i++){
    const x=bx+4+i*7,y=by-5+(i%2)*2
    p(x,y-3,'#849866',1,4);p(x+1,y-3,'#9bac78',4,2)
    for(let row=0;row<3;row++)for(let col=0;col<3-row;col++){
     p(x-2+col*2+row,y+row*2,'#917b9c',2,2)
     p(x-2+col*2+row,y+row*2,'#b5a0bd',1,1)
    }
   }
  }
 }
 if(theme==='herbalTea'){
  // 이미 꿀을 넣은 약차. 꿀/약초는 실제 소지품 도트를 쓰며 새 보상을 지급하지 않는다.
  stamp(ICONS.honey,ICON_PALETTE,cx+40,f+3)
  stamp(ICONS.herb,{...ICON_PALETTE,E:PALETTE.E},cx+40,f+10)
  const kx=cx+52,ky=f-1
  p(kx,ky,'#758779',13,11);p(kx+2,ky-2,'#9aa58c',9,3);p(kx+5,ky-4,'#6b7d70',3,2)
  p(kx-3,ky+3,'#758779',4,3);p(kx-5,ky+1,'#758779',3,2)
  p(kx+13,ky+2,'#758779',4,7);p(kx+14,ky+3,'#9d9a7b',2,4)
  p(kx+2,ky+2,'#aab69b',2,6);p(kx+3,ky+9,'#64776a',8,1)
  const cup=(x:number,y:number)=>{p(x,y,'#dfd8b8',5,6);p(x+1,y,'#a38b57',3,1);p(x+5,y+1,'#dfd8b8',2,3)}
  cup(cx+77,f+4)
  if(beat===1){
   cup(cx+36,f-3)
   const pal=spouse.who==='writer'?writerPalette('spring',spouse.avatar?withLookDefaults(spouse.avatar):undefined):PALETTE
   p(cx+36,f+1,pal.s,2,2)
  }else cup(cx+68,f+4)
  const steam=Math.floor(t*2)%2
  p(kx+6,ky-8-steam,'#c9d1b7',1,3);p(kx+7,ky-11-steam,'#b4c1a6',1,2)
 }
 // 꽃잎과 모닥불. 사람과 양의 발보다 앞에 놓되 윤곽을 가리지 않는다.
 stamp(WEDDING_PROPS.petalPatch.rows,FURNI_PALETTE,cx-20,f+11)
 const fire=f+23,fx=cx-61
 p(fx-10,fire+35,'#6f6551',26,5);p(fx-13,fire+33,'#88765a',5,6);p(fx+15,fire+33,'#88765a',5,6)
 p(fx-5,fire+28,'#83593c',17,6)
 const pulse=Math.floor(t*3)%2
 for(let y=0;y<18;y++){const span=3+Math.floor(y/3)*2;p(fx+3-Math.floor(span/2)+(y<5?pulse:0),fire+31-18+y,'#cc8b55',span,1);if(y>7)p(fx+1,fire+31-18+y,'#edd093',4,1)}
}

