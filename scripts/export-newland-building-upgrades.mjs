import fs from 'node:fs'
import './pixel-ts-loader.mjs'
import { draw,png } from './pixel-png.mjs'
const buildings=await import('../src/render/newland-building-art.ts'),boundary=await import('../src/render/newland-boundary-art.ts'),old=await import('../src/render/old-village-art.ts')
const out='assets/newland-building-upgrades',items=[],construction=[],gates=[],pal=buildings.BUILDING_ART_PALETTE
for(const folder of ['buildings','construction','boundaries','gates','work-props','before'])fs.mkdirSync(`${out}/${folder}`,{recursive:true})
function save(file,rows,palette=pal){const w=rows[0].length,h=rows.length,p=new Uint8Array(w*h*4);draw(p,w,rows,palette);png(`${out}/${file}`,w,h,p);return file}
function layered(stem,a,palette=pal){return {file:save(`${stem}.png`,a.rows,palette),width:a.width,height:a.height,anchor:a.anchor,entry:a.entry??null,footprint:a.footprint,layers:{back:save(`${stem}-back.png`,a.back,palette),front:save(`${stem}-front.png`,a.front,palette)}}}
function canvas(w,h){const p=new Uint8Array(w*h*4);for(let i=0;i<p.length;i+=4)p.set([246,237,218,255],i);return p}
function completed(id,d){
 if(buildings.PROFESSION_BUILDINGS.includes(id))return buildings.professionBuildingArt(id,d)
 const rows=old.OLD_BUILDINGS[id][d].rows,open=id==='garden'||id==='courtyard'
 return {rows,width:64,height:64,back:rows.map((r,y)=>y<55?r:'.'.repeat(64)),front:rows.map((r,y)=>y>=55?r:'.'.repeat(64)),anchor:{x:32,y:60},entry:open?null:buildings.buildingEntry(d),footprint:open?{w:4,h:4,dy:0}:{w:4,h:3,dy:1}}
}
const completeMap=new Map(),houseSheet=canvas(768,384),beforeAfter=canvas(768,768)
for(const id of buildings.CONSTRUCTION_BUILDINGS){
 const views={};for(const d of buildings.BUILDING_FACINGS)views[d]=layered(`buildings/${id}-${d}`,completed(id,d))
 completeMap.set(id,views)
 const professional=buildings.PROFESSION_BUILDINGS.includes(id),item={id,group:'buildings',label:old.BUILDING_LABELS[id],professional,views}
 if(professional){const i=buildings.PROFESSION_BUILDINGS.indexOf(id),a=completed(id,'down');item.style=buildings.PROFESSION_STYLES[id];item.workProp=save(`work-props/${id}.png`,buildings.professionWorkPropRows(id));item.before=save(`before/${id}-down.png`,old.OLD_BUILDINGS[id].down.rows);draw(houseSheet,768,a.rows,pal,(i%6)*128,Math.floor(i/6)*128,2);draw(beforeAfter,768,old.OLD_BUILDINGS[id].down.rows,pal,(i%3)*256,Math.floor(i/3)*128,2);draw(beforeAfter,768,a.rows,pal,(i%3)*256+128,Math.floor(i/3)*128,2)}
 items.push(item)
}
const examples=['home','archive','baker','weaver','potter','garden'],constructionSheet=canvas(512,768)
for(const id of buildings.CONSTRUCTION_BUILDINGS){
 const views={};for(const d of buildings.BUILDING_FACINGS)views[d]=buildings.CONSTRUCTION_STAGES.map((stage,f)=>{
  const a=buildings.constructionBuildingArt(id,d,stage),frame={...layered(`construction/${id}-${d}-${stage}`,a),stage,label:a.label,plannedEntry:a.plannedEntry,duration:900,loop:false,complete:false}
  if(d==='down'&&examples.includes(id))draw(constructionSheet,512,a.rows,pal,f*128,examples.indexOf(id)*128,2)
  return frame
 })
 construction.push({id,label:old.BUILDING_LABELS[id],views,completed:completeMap.get(id)})
 if(examples.includes(id))draw(constructionSheet,512,completed(id,'down').rows,pal,384,examples.indexOf(id)*128,2)
}
const boundarySheet=canvas(512,384)
for(const [i,material]of boundary.BOUNDARY_MATERIALS.entries())for(let mask=0;mask<16;mask++){
 const rows=boundary.boundaryRows(material,mask),a={rows,back:rows.map((r,y)=>y<10?r:'.'.repeat(16)),front:rows.map((r,y)=>y>=10?r:'.'.repeat(16)),width:16,height:16,anchor:{x:8,y:16}},count=[1,2,4,8].filter(bit=>mask&bit).length
 items.push({id:`${material}-${mask}`,group:'boundaries',material,mask,label:count===0?'독립 기둥':count===1?'끝 조각':count===2?(mask===5||mask===10?'일자':'모서리'):count===3?'T자':'교차',...layered(`boundaries/${material}-${mask}`,a,boundary.BOUNDARY_PALETTE)})
 draw(boundarySheet,512,rows,boundary.BOUNDARY_PALETTE,(mask%8)*64,i*128+Math.floor(mask/8)*64,4)
}
for(const [i,material]of boundary.BOUNDARY_MATERIALS.entries())for(const [j,axis]of ['horizontal','vertical'].entries())for(const action of ['open','close']){
 const frames=Array.from({length:4},(_,f)=>{
  const a=boundary.boundaryGateFrame(material,axis,action,f)
  if(action==='open')draw(boundarySheet,512,a.rows,boundary.BOUNDARY_PALETTE,(j*4+f)*64,256+i*64,4)
  return {...layered(`gates/${material}-${axis}-${action}-${f}`,a,boundary.BOUNDARY_PALETTE),duration:a.duration,loop:false,opening:a.opening}
 })
 gates.push({id:`${material}-${axis}-${action}`,material,axis,action,label:`${material==='wood'?'울타리':'돌담'} 문 · ${axis==='horizontal'?'가로':'세로'} · ${action==='open'?'열기':'닫기'}`,frames})
}
png(`${out}/buildings-contact-sheet.png`,768,384,houseSheet);png(`${out}/buildings-before-after.png`,768,768,beforeAfter);png(`${out}/construction-contact-sheet.png`,512,768,constructionSheet);png(`${out}/boundaries-contact-sheet.png`,512,384,boundarySheet)
const yard=new Uint8Array(128*96*4),cells=new Set()
for(let x=1;x<=6;x++){cells.add(`${x},1`);cells.add(`${x},4`)}for(let y=1;y<=4;y++){cells.add(`1,${y}`);cells.add(`6,${y}`)}
for(let y=0;y<6;y++)for(let x=0;x<8;x++)draw(yard,128,old.OLD_TERRAIN.grass.rows,pal,x*16,y*16)
for(const cell of cells){const [x,y]=cell.split(',').map(Number),mask=(cells.has(`${x},${y-1}`)?1:0)|(cells.has(`${x+1},${y}`)?2:0)|(cells.has(`${x},${y+1}`)?4:0)|(cells.has(`${x-1},${y}`)?8:0),rows=x===3&&y===4?boundary.boundaryGateFrame('wood','horizontal','open',3).rows:boundary.boundaryRows('wood',mask);draw(yard,128,rows,boundary.BOUNDARY_PALETTE,x*16,y*16)}
draw(yard,128,buildings.professionWorkPropRows('gardener'),pal,40,34);draw(yard,128,old.OLD_PROPS.courtyardBench.rows,pal,60,40);png(`${out}/example-yard.png`,128,96,yard)
const manifest={version:1,connected:false,tileSize:16,sources:['src/render/newland-boundary-art.ts','src/render/newland-building-art.ts'],palette:pal,boundaryPalette:boundary.BOUNDARY_PALETTE,items,construction,gates,note:'도트 자산만 준비. 완공 건물은 기존 64px 크기·문 좌표를 유지. 공사 단계는 시각 자료이고 날짜·진척도·보상·충돌을 연결하지 않는다. 공사에는 실제 출입구가 없으며 plannedEntry만 제공한다. 마당·정원은 지붕 대신 바닥·울타리 마감.'}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2))
const houseCards=items.filter(a=>a.group==='buildings'&&a.professional).map(a=>`<article><h3>${a.label}</h3><img data-building="${a.id}" src="${a.views.down.file}" width="192" height="192" alt="${a.label}"><p>${a.style.note}</p><details><summary>기존 도트와 비교</summary><img src="${a.before}" width="128" height="128" alt="기존 건물"></details></article>`)
const boundaryCards=items.filter(a=>a.group==='boundaries').map(a=>`<article><h3>${a.material==='wood'?'울타리':'돌담'} · ${a.label}</h3><img src="${a.file}" width="64" height="64" alt="${a.label}"><p>NESW 비트 ${a.mask}</p></article>`)
const stageCards=construction.map((s,i)=>`<article><h3>${s.label}</h3><img data-construction="${i}" src="${s.views.down[0].file}" width="192" height="192" alt="${s.label} 공사"><p data-stage="${i}">기초 놓기</p></article>`)
const gateCards=gates.map((s,i)=>`<article><h3>${s.label}</h3><img data-gate="${i}" src="${s.frames[0].file}" width="64" height="64" alt="${s.label}"><button data-replay="${i}">다시 보기</button></article>`)
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>구약맵 건물·경계·공사 도트</title><style>body{font:15px system-ui;background:#f6edda;color:#493729;margin:24px}nav{position:sticky;top:0;background:#f6edda;padding:12px;z-index:1}section{display:flex;gap:14px;flex-wrap:wrap}section[hidden]{display:none}article{background:#e3d8c2;border-radius:8px;padding:14px;max-width:230px}img{image-rendering:pixelated;object-fit:contain}h3{font-size:14px}p{font-size:13px}button,select{font:inherit;margin:4px;padding:7px}details{font-size:13px}</style><h1>구약맵 건물·경계·공사 도트</h1><p>직업 건물 18종·울타리와 돌담 이음·문·공사 25건물 3단계. 자산만 준비했습니다.</p><nav><button data-tab="buildings">직업 건물</button><button data-tab="boundaries">울타리·돌담</button><button data-tab="gates">문 열기·닫기</button><button data-tab="construction">공사 단계</button><select id="direction"><option value="down">앞</option><option value="up">뒤</option><option value="left">왼쪽</option><option value="right">오른쪽</option></select><select id="stage"><option value="0">기초</option><option value="1">기둥·들보</option><option value="2">지붕·마감</option><option value="3">완공</option></select><button id="replay-gates">문 동작 전체 다시 보기</button></nav><section id="buildings">${houseCards.join('')}</section><section id="boundaries" hidden><article><h3>조합 예시</h3><img src="example-yard.png" width="256" height="192" alt="울타리와 열린 문을 놓은 마당"></article>${boundaryCards.join('')}</section><section id="gates" hidden>${gateCards.join('')}</section><section id="construction" hidden>${stageCards.join('')}</section><script>const items=${JSON.stringify(items)},construction=${JSON.stringify(construction)},gates=${JSON.stringify(gates)},elapsed=gates.map(()=>Infinity);const direction=document.getElementById('direction'),stage=document.getElementById('stage');function update(){document.querySelectorAll('[data-building]').forEach(img=>img.src=items.find(a=>a.group==='buildings'&&a.id===img.dataset.building).views[direction.value].file);document.querySelectorAll('[data-construction]').forEach(img=>{const i=+img.dataset.construction,s=construction[i],f=+stage.value,a=f===3?s.completed[direction.value]:s.views[direction.value][f];img.src=a.file;document.querySelector('[data-stage="'+i+'"]').textContent=f===3?'완공':a.label});document.querySelectorAll('[data-gate]').forEach(img=>{const i=+img.dataset.gate,s=gates[i],f=Math.min(3,Math.floor(elapsed[i]/s.frames[0].duration));img.src=s.frames[f].file})}document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>document.querySelectorAll('section').forEach(s=>s.hidden=s.id!==b.dataset.tab));document.querySelectorAll('[data-replay]').forEach(b=>b.onclick=()=>{elapsed[+b.dataset.replay]=0;update()});document.getElementById('replay-gates').onclick=()=>{elapsed.fill(0);update()};direction.onchange=update;stage.onchange=update;setInterval(()=>{elapsed.forEach((_,i)=>elapsed[i]+=50);update()},50);update()</script></html>`)
console.log(`직업 건물 ${buildings.PROFESSION_BUILDINGS.length}종 × 4방향, 경계 32조각·문 8동작, 공사 ${construction.length}건물 × 4방향 × 3단계 → ${out}`)
