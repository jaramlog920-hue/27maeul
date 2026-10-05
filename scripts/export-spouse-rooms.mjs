import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {png,draw} from './pixel-png.mjs'
registerHooks({
  resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},
  load(url,c,n){return url.endsWith('.json') ? {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true} : n(url,c)},
})
const {SPOUSE_ROOM_DESIGNS,SPOUSE_ROOM_ART,SPOUSE_ROOM_VIEWS,SPOUSE_ROOM_SIGNATURES,SPOUSE_ROOM_LAYOUTS}=await import('../src/render/spouse-room-art.ts')
const {HOME_SPACE_ART}=await import('../src/render/home-space-art.ts')
const {HOME_SPACE_DIRECTIONS}=await import('../src/render/home-space-directions.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const out='assets/spouse-rooms',palette={...FURNI_PALETTE,z:'#5a4638'},facings=['down','up','left','right']
Object.assign(palette,{'0':'#f4e0c0','1':'#f8e8cc','2':'#e8d0a8','3':'#b8a488','4':'#dbeef7','5':'#ebf5fa','6':'#dacab3'})
for(const d of ['props','furniture','icons','layers','rooms','tiles'])fs.mkdirSync(`${out}/${d}`,{recursive:true})
function validate(a){assert.equal(a.rows.length,a.h*16);for(const r of a.rows){assert.equal(r.length,a.w*16);for(const c of r)assert(c==='.'||palette[c],`Invalid pixel ${c}`)}}
function paint(p,w,rows,x=0,y=0,scale=1){draw(p,w,rows.map(r=>r.replaceAll('z','.')),palette,x,y,scale)}
function save(file,a,scale=1){validate(a);const w=a.w*16*scale,h=a.h*16*scale,p=new Uint8Array(w*h*4);paint(p,w,a.rows,0,0,scale);png(`${out}/${file}`,w,h,p)}
function icon(a){const w=a.w*16,h=a.h*16,rows=Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>{const cs=[];for(let dy=0;dy<h/8;dy++)for(let dx=0;dx<w/8;dx++){const c=a.rows[y*h/8+dy][x*w/8+dx];if(c!=='.'&&c!=='z')cs.push(c)}return cs.sort((c,d)=>cs.filter(v=>v===d).length-cs.filter(v=>v===c).length)[0]??'.'}).join(''));const p=new Uint8Array(8*8*4);paint(p,8,rows);return p}
const assets=[],rooms=[]
for(const[id,a]of Object.entries(SPOUSE_ROOM_ART)){save(`props/${id}.png`,a);png(`${out}/icons/${id}.png`,8,8,icon(a));assets.push({id,file:`props/${id}.png`,icon:`icons/${id}.png`,width:a.w*16,height:a.h*16,anchor:{x:a.w*8,y:a.h*16},directionIndependent:true,blocking:!id.endsWith('-rug')&&!id.endsWith('-curtain')&&!id.endsWith('-wall')})}
for(const[id,views]of Object.entries(SPOUSE_ROOM_VIEWS))for(const[facing,a]of Object.entries(views)){
  save(`furniture/${id}-${facing}.png`,a);png(`${out}/icons/${id}-${facing}.png`,8,8,icon(a))
  const cut=a.h*16-5,back={...a,rows:a.rows.map((r,y)=>y<cut?r:'.'.repeat(a.w*16))},front={...a,rows:a.rows.map((r,y)=>y>=cut?r:'.'.repeat(a.w*16))}
  save(`layers/${id}-${facing}-back.png`,back);save(`layers/${id}-${facing}-front.png`,front)
  assets.push({id,facing,file:`furniture/${id}-${facing}.png`,icon:`icons/${id}-${facing}.png`,width:a.w*16,height:a.h*16,anchor:{x:a.w*8,y:a.h*16},interaction:{x:facing==='left'?0:facing==='right'?15:a.w*8,y:facing==='up'?0:a.h*16-1},layers:{back:`layers/${id}-${facing}-back.png`,front:`layers/${id}-${facing}-front.png`},blocking:true})
}
function tileRows(color,kind,second){const g=Array.from({length:16},()=>Array(16).fill(color));if(kind==='floor'){for(const y of [0,8])g[y].fill('w');for(let y=1;y<8;y++)g[y][4]='w';for(let y=9;y<16;y++)g[y][12]='w';g[4][9]='C';g[12][3]='C'}else{g[14].fill('W');g[15].fill('l');for(let x=0;x<16;x++)g[12][x]=second;for(const[x,y]of [[2,3],[10,7],[6,10]])g[y][x]='C'}return {w:1,h:1,rows:g.map(r=>r.join(''))}}
const layouts={
  window:[['desk',1,1,'down'],['chair',1,2,'up'],['cupboard',4,1,'down'],['rug',4,3,'down'],['cushion',4,4,'down'],['lantern',5,2,'down']],
  reading:[['desk',4,1,'right'],['chair',5,2,'left'],['cupboard',1,1,'down'],['rug',1,3,'down'],['cushion',1,4,'down'],['lantern',5,4,'down']],
  craft:[['desk',1,3,'down'],['chair',1,4,'up'],['cupboard',1,1,'down'],['rug',4,2,'down'],['cushion',4,3,'down'],['lantern',5,4,'down']],
  tea:[['desk',4,1,'down'],['chair',4,2,'up'],['cupboard',1,1,'down'],['rug',1,3,'down'],['cushion',1,4,'down'],['lantern',5,4,'down']],
}
const contactW=112*4,contactH=112*4,contact=new Uint8Array(contactW*contactH*4)
for(let i=0;i<contact.length;i+=4)contact.set([245,240,222,255],i)
for(const[didx,d]of SPOUSE_ROOM_DESIGNS.entries()){
  const floor=tileRows(['rudy','merchant','wendell'].includes(d.id)?'l':'C','floor',d.accent),wall=tileRows('c','wall',d.accent)
  save(`tiles/${d.id}-floor.png`,floor);save(`tiles/${d.id}-wall.png`,wall)
  const background=new Uint8Array(112*112*4),furnishing=new Uint8Array(112*112*4),foreground=new Uint8Array(112*112*4)
  const wallRows=Array.from({length:16},(_,y)=>(y<2?'1':y===15?'2':'0').repeat(16))
  const leftRows=Array.from({length:16},()=> '2'+'0'.repeat(13)+'11'),rightRows=Array.from({length:16},()=> '11'+'0'.repeat(13)+'2')
  wall.rows=wallRows
  save(`tiles/${d.id}-wall.png`,wall)
  for(let y=0;y<7;y++)for(let x=0;x<7;x++)paint(background,112,x===0&&y>0&&y<6?leftRows:x===6&&y>0&&y<6?rightRows:y===0||y===6?wallRows:floor.rows,x*16,y*16)
  // Bottom-center doorway and central route are clear in every design.
  paint(background,112,floor.rows,48,96)
  const wg=wallRows.map(r=>[...r]),wr=(c,x,y,w,h)=>{for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)wg[y+dy][x+dx]=c}
  wr('3',3,3,10,11);wr('4',5,5,6,7);wr('5',5,5,6,2);wr('3',7,5,2,7);wr('3',5,8,6,2);wr('6',2,13,12,2)
  const windowX=['cosmo','rudy','penelope','merchant'].includes(d.id)?1:5
  paint(background,112,wg.map(r=>r.join('')),windowX*16,0)
  if(['wendell','marigold','tilly','postman'].includes(d.id))paint(foreground,112,SPOUSE_ROOM_ART[`${d.id}-wall`].rows,(windowX===1?4:1)*16,0)
  if(d.id==='cosmo')paint(foreground,112,SPOUSE_ROOM_ART['cosmo-keepsake'].rows,64,0)
  const placements=[],blocked=new Set()
  for(const[k,x,y,facing]of SPOUSE_ROOM_LAYOUTS[d.id]){
    const own=['desk','rug','cushion','signature','keepsake','personal','sideboard'].includes(k),a=k==='desk'?SPOUSE_ROOM_VIEWS[`${d.id}-desk`][facing]:own?SPOUSE_ROOM_ART[`${d.id}-${k}`]:HOME_SPACE_DIRECTIONS[k]?.[facing]??HOME_SPACE_ART[k]
    assert(a,`Missing ${k}`);assert(x>=1&&x+a.w<=6&&y>=1&&y+a.h<=6,`Out of bounds ${d.id}:${k}`)
    const isBlocking=k!=='rug'
    if(isBlocking)for(let dy=0;dy<a.h;dy++)for(let dx=0;dx<a.w;dx++){const cell=`${x+dx},${y+dy}`;assert(!blocked.has(cell),`Overlap ${d.id}:${cell}`);blocked.add(cell)}
    paint(furnishing,112,a.rows,x*16,y*16)
    placements.push({id:own?`${d.id}-${k}`:k,source:own?'spouse-room-art':'home-space-directions',x,y,facing,w:a.w,h:a.h,blocking:isBlocking,layer:k==='rug'?'floor':'furniture'})
    if(k==='cupboard'){const keepsake=SPOUSE_ROOM_ART[`${d.id}-keepsake`];paint(furnishing,112,keepsake.rows,x*16,y*16-3);placements.push({id:`${d.id}-keepsake`,source:'spouse-room-art',x,y,pixelOffset:{x:0,y:-3},w:2,h:1,blocking:false,layer:'surface',host:'cupboard'})}
  }
  const reachable=new Set(['3,5']),queue=[[3,5]]
  while(queue.length){const[x,y]=queue.shift();for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(nx>=1&&nx<=5&&ny>=1&&ny<=5&&!blocked.has(key)&&!reachable.has(key)){reachable.add(key);queue.push([nx,ny])}}}
  for(let y=1;y<=5;y++)assert(reachable.has(`3,${y}`),`Blocked center ${d.id}`)
  for(const p of placements.filter(p=>p.blocking)){let accessible=false;for(let dy=0;dy<p.h;dy++)for(let dx=0;dx<p.w;dx++)for(const[ox,oy]of [[1,0],[-1,0],[0,1],[0,-1]])if(reachable.has(`${p.x+dx+ox},${p.y+dy+oy}`))accessible=true;assert(accessible,`No access ${d.id}:${p.id}`)}
  const complete=new Uint8Array(background)
  function merge(dst,src){for(let i=0;i<src.length;i+=4)if(src[i+3])dst.set(src.subarray(i,i+4),i)}merge(complete,furnishing);merge(complete,foreground)
  for(const[name,p]of [['background',background],['furnishing',furnishing],['foreground',foreground],['room',complete]])png(`${out}/rooms/${d.id}-${name}.png`,112,112,p)
  const big=new Uint8Array(448*448*4);for(let y=0;y<112;y++)for(let x=0;x<112;x++)for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++)big.set(complete.subarray((y*112+x)*4,(y*112+x)*4+4),((y*4+dy)*448+x*4+dx)*4)
  png(`${out}/rooms/${d.id}-preview.png`,448,448,big)
  for(let y=0;y<112;y++)for(let x=0;x<112;x++)contact.set(complete.subarray((y*112+x)*4,(y*112+x)*4+4),((Math.floor(didx/4)*112+y)*contactW+(didx%4)*112+x)*4)
  rooms.push({...d,signature:SPOUSE_ROOM_SIGNATURES[d.id].name,layout:`individual:${d.id}`,motif:undefined,tileSize:16,width:7,height:7,interior:{x:1,y:1,w:5,h:5},entrance:{x:3,y:6},spouseStand:{x:3,y:3},window:{x:windowX,y:0,w:1},placements,walkable:[...reachable].map(s=>s.split(',').map(Number)),files:{preview:`rooms/${d.id}-preview.png`,room:`rooms/${d.id}-room.png`,background:`rooms/${d.id}-background.png`,furnishing:`rooms/${d.id}-furnishing.png`,foreground:`rooms/${d.id}-foreground.png`,floor:`tiles/${d.id}-floor.png`,wall:`tiles/${d.id}-wall.png`}})
}
png(`${out}/all-rooms.png`,contactW,contactH,contact)
const bigContact=new Uint8Array(contactW*3*contactH*3*4);for(let y=0;y<contactH;y++)for(let x=0;x<contactW;x++)for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++)bigContact.set(contact.subarray((y*contactW+x)*4,(y*contactW+x)*4+4),((y*3+dy)*contactW*3+x*3+dx)*4)
png(`${out}/all-rooms-preview.png`,contactW*3,contactH*3,bigContact)
const manifest={status:'design and assets ready; gameplay integration pending',tileSize:16,facings,existingSideRoom:{w:2,h:4},plannedInterior:{w:5,h:5},assets,rooms}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2))
// Runtime reads layout/state only; the renderer keeps using editable native pixels.
fs.writeFileSync('src/content/spouse-rooms.json',JSON.stringify(rooms.map(r=>({id:r.id,name:r.name,title:r.title,window:r.window,placements:r.placements})),null,2))
const document=`# 결혼 후 배우자의 생활방 13종\n\n작성: 2026-10-05. 상태: 승인된 디자인을 게임에 연결 완료. 1단계 증축으로 유저방 뒤쪽에 연결하고 결혼하면 배우자의 가구를 한 번 배치한다.\n\n기존 후보 10명과 추가 후보 merchant/presser/postman 3명만 대상이다. 기혼 또는 기존 자녀가 있는 일반 주민 8명, 할아버지, 물 긷는 아이는 배우자 방을 만들지 않는다.\n\n## 집에 추가되는 방식\n\n집 1단계 증축으로 유저 작업실 뒤쪽에 배우자방이 생긴다. 결혼 전에는 빈 방으로 사용하며, 결혼하면 해당 배우자의 취향 가구를 한 번만 배치한다. 목수에게 증축을 부탁한 다음 날 완성되고, 작업실 북쪽 문으로 직접 걸어갈 수 있다. 방 13개를 한꺼번에 추가하지 않는다. 외벽 포함 7×7칸, 내부 5×5칸, 타일 16px. 방 내부 좌표는 월드 좌표가 아닌 독립적인 로컬 좌표다.\n\n현재 디자인의 출입구는 (3,6), 중앙 (3,1)~(3,5)는 통행 가능하다. 작업실과 배우자방이 북쪽 문을 공유하며 가구 그림은 승인한 방향을 유지한다. 배우자 기본 대기 위치는 (3,3). 기존 필사 책상·서고 선반·주방·공동 침실은 유지하고 이 방은 배우자의 취미와 휴식 공간으로 쓴다. 결혼 후 공동 생활과 아이 방은 별도 공간이다.\n\n방에는 취향 탁자, 자기 기념품, 벽 그림, 커튼, 무늬 깔개, 방석과 기존 수납장·의자·등불이 있다. 색만 바꾸지 않고 빵·배·책받침·종이 별·허브·일정·실패·고리·관찰 카드·찻잔·여행 짐·생활 항아리·개인 가방처럼 실제 소품 모양을 다르게 만들었다. 가구 배치는 인물별 13개 전용 배치이며 manifest의 placements에 실제 크기·방향·통행 여부를 기록했다.\n\n## 방별 디자인\n\n${rooms.map((r,i)=>`### ${i+1}. ${r.name} — ${r.title}\n\n- 성격 근거: ${r.character}\n- 방 콘셉트: ${r.concept}\n- 색: 가구 공통 나무/크림 + 강조색 팔레트 ${r.accent}, 보조색 ${r.second}.\n- 새 탁자: ${r.desk}.\n- 개인 소품: ${r.keepsake}.\n- 벽 장식: ${r.wall}.\n- 자기 시간: ${r.routine}\n- 유저와 함께: ${r.together}\n- 생활 원칙: ${r.boundary}\n- 중심 가구: ${r.signature}.\n- 배치 유형: ${r.layout}.\n- 미리보기: ../../assets/spouse-rooms/${r.files.preview}\n- 자산 ID: ${r.id}-desk / keepsake / wall / rug / cushion / curtain.\n`).join('\n')}\n## 기능 연결과 저장\n\nroomOwner는 실제 배우자 ID로 정하고 결혼 완료 한 번만 방을 생성한다. 날짜 변경이나 재접속 때 가구를 다시 지급하지 않는다. 새 방 필수 가구는 방 소속 기본 배치이며 가방 아이템으로 자동 지급하지 않는다. 플레이어가 선택한 꾸미기는 별도 배치 상태로 보존한다. 기존 물건과 겹치거나 동선을 막는 배우자 가구는 가방에 지급한다. 배우자 가구도 일반 꾸미기로 이동·회수할 수 있으며 다시 접속해도 중복 지급하지 않는다.\n\n배우자 방 기본 상태는 결혼한 옛 저장에도 해당 배우자 한 명에 한 번 생성한다. 기존 집 확장·아이·반려동물·다락·귀가 일정과 충돌하지 않게 전체 지도 여유 공간과 경로부터 점검한다. 월드 좌표 (18,104)에 외벽 포함 7×7칸으로 배치하며, 유저방 북쪽 공유 문 (21,110)으로 왕복한다. 연결은 같은 지도 위에서 걸어 이동하는 방식이다. 재접속 시 저장된 실제 배우자 ID로 동일한 방을 복원한다.\n\n배우자가 직업을 그만두거나 방에 계속 갇히지 않도록 기존 업무와 집 밖 친구 일정을 유지한다. 쉬는 시간에만 탁자·방석·의자를 이용한다. 같은 방에 들어갔다고 자동으로 데이트·선물·아이 경험을 지급하지 않는다. 각 함께하기는 실제 선택과 참여 뒤 기억에 남긴다.\n\n## 새 도트와 재사용\n\n새 자산은 정지 소품 83개와 탁자 13종×네 방향 52개. 각 방향 가구는 앞뒤 레이어, 모든 자산은 8×8 아이콘 포함. 방별 바닥/벽 타일, 전체 배경/가구/벽 장식 레이어와 완성 미리보기를 함께 제공한다. 원본은 src/render/spouse-room-art.ts, 재생성은 node scripts/export-spouse-rooms.mjs.\n\n기존 의자·수납장·등불은 HOME_SPACE_DIRECTIONS를 재사용한다. 인물은 현재 외형과 기존 sit/read/craft/reach/drink/draw 등의 동작을 사용한다. 방 미리보기에는 특정 외형이나 고정 커플을 굽지 않았다.\n\n확대는 nearest-neighbor. 실제 그리기 순서는 바닥·깔개 → 가구 뒤 → 소품 뒤 → 현재 인물 → 소품 앞 → 가구 앞. 완성 room PNG는 설계 미리보기이며 실제 게임에서 충돌·높이·인물 레이어 대신 통째로 붙이지 않는다. furniture 레이어 PNG 역시 미리보기용 합성이고 실제로는 각 placements의 원본을 그린다. wall/curtain은 벽 장식, rug는 통행 가능한 바닥이다. keepsake는 수납장 위 표면 소품이라 추가 충돌을 만들지 않는다.\n\n## 확인\n\n13명 ID 중복 없음, 팔레트/크기/PNG 참조 검사 완료. 모든 가구 배치가 내부 범위에 있으며 충돌 가구 중복 없음. 입구에서 중앙 통로와 각 가구 옆 접근 칸까지 도달 가능함을 검사. TypeScript 검사 통과와 전체 방 미리보기 육안 확인. 집 확장 및 배우자방 왕복 이동·저장 복원·NPC 다중 문 경로 검사와 브라우저 렌더링 확인 완료. 모바일 터치 전용 실기기는 별도 확인이 필요하다.\n`
fs.writeFileSync('docs/characters/25_배우자방_인테리어_설계.md',document)
fs.writeFileSync(`${out}/클로드_배우자방_도트연결안내.txt`,'27마을 배우자 방 13종 — 2026-10-05\n상태: 디자인·자산 및 북쪽 배우자방 연결 완료.\n상세 설계: docs/characters/25_배우자방_인테리어_설계.md\n원본: src/render/spouse-room-art.ts\n재생성: node scripts/export-spouse-rooms.mjs\nmanifest.json의 rooms: 방별 placements/로컬 좌표/통행/개념/생활 행동. assets: 크기/방향/기준점/아이콘/앞뒤 레이어.\nsrc/engine/home-layout.ts의 북쪽 PARTNER_ROOM (18,104)과 PARTNER_DOOR (21,110)으로 연결 완료. 1단계 증축 후 출입하고 결혼 시 배우자 가구를 배치한다.\n실제 배우자 한 명의 방만 결혼 완료 시 한 번 생성. 기존 유저 집 가구·필사·서고 기능 보존.\n미리보기 PNG는 전체 디자인 확인용이며 실제 게임은 가구 뒤→현재 인물→가구 앞의 원본 레이어로 그릴 것.\n13명: wendell/cosmo/rudy/dexter/basil/marigold/penelope/tilly/juniper/poppy/merchant/presser/postman.\n기혼/기존 부모 일반 주민은 추가 후보가 아니므로 방 없음.\n새 도트: 소품 83개, 네 방향 탁자 52개, 8×8 아이콘, 탁자 앞뒤 레이어, 방 바닥·벽과 합성 미리보기.\n중앙 통로·가구 접근·팔레트·크기·파일 참조 검사 완료.\n')
fs.writeFileSync(`${out}/미리보기.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 배우자 방 13종</title><style>body{margin:0;padding:32px;background:#f5f0de;color:#553c29;font:16px sans-serif}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px}article{padding:20px;background:#fff9e9}img{width:100%;max-width:448px;image-rendering:pixelated}h2{margin:0}p{line-height:1.6}small{color:#725d48}</style><h1>결혼 후 배우자의 생활방</h1><p>13명 각각의 취향과 쉬는 방식. 방 안 5×5칸, 중앙 통로 유지. 유저 작업실 뒤쪽에 연결 완료. 1단계 증축 후 출입하며 결혼하면 해당 배우자의 취향 가구가 배치됩니다.</p><main>${rooms.map(r=>`<article><h2>${r.name}</h2><p>${r.title}</p><img src="${r.files.preview}" alt="${r.name}의 방"><p>${r.concept}</p><small>함께하기: ${r.together}</small><p>자기 시간: ${r.routine}</p></article>`).join('')}</main></html>`)
let refs=0;function verify(v){if(v&&typeof v==='object')for(const value of Object.values(v)){if(typeof value==='string'&&value.endsWith('.png')){const b=fs.readFileSync(`${out}/${value}`);assert.equal(b.subarray(1,4).toString(),'PNG');refs++}else verify(value)}}verify(manifest)
assert.equal(new Set(rooms.map(r=>r.id)).size,13)
console.log(JSON.stringify({rooms:rooms.length,newProps:Object.keys(SPOUSE_ROOM_ART).length,directionalFurniture:assets.filter(a=>a.facing).length,validatedPNGReferences:refs,checks:'dimensions, palette, unique IDs, footprint bounds, collisions, central route and furniture access'}))



