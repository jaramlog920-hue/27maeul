import fs from 'node:fs'
import path from 'node:path'
import { registerHooks } from 'node:module'
import { draw, png } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const { SETTLEMENT_GUESTS,GUEST_ACTIONS,GUEST_ACTION_LABELS,GUEST_PROP_PALETTE,settlementGuestFrame,guestPropRows }=await import('../src/render/settlement-guests-art.ts')
const { OLD_BUILDINGS,OLD_CONSTRUCTION,OLD_VILLAGE_PALETTE,BUILDING_LABELS }=await import('../src/render/old-village-art.ts')
const out='assets/settlement-guests',facings=['down','up','left','right'],guests=[],buildings=[]
fs.mkdirSync(out,{recursive:true})
function save(file,w,h,layers){const p=new Uint8Array(w*h*4);for(const [rows,pal]of layers)draw(p,w,rows,pal);png(`${out}/${file}`,w,h,p);return file}
const sheet=new Uint8Array(768*640*4)
for(let i=0;i<sheet.length;i+=4)sheet.set([246,237,218,255],i)
for(const [i,[id,def]]of Object.entries(SETTLEMENT_GUESTS).entries()) {
 const actions={},sequences=[]
 for(const action of GUEST_ACTIONS){actions[action]={};for(const facing of facings)actions[action][facing]=[0,1,2,3].map(f=>{
  const a=settlementGuestFrame(id,facing,action,f)
  const layers=[[a.propBack,GUEST_PROP_PALETTE],[a.actor,a.palette],[a.propFront,GUEST_PROP_PALETTE]]
  if(f===0&&facing===(action==='sleep'?'right':'down')){const x=GUEST_ACTIONS.indexOf(action)*96;for(const [rows,pal]of layers)draw(sheet,768,rows,pal,x,i*96,4)}
  const file=`${id}-${action}-${facing}-${f}`
  const split={}
  for(const [key,rows,pal]of [['back',a.propBack,GUEST_PROP_PALETTE],['actor',a.actor,a.palette],['front',a.propFront,GUEST_PROP_PALETTE]])split[key]=save(`${file}-${key}.png`,24,24,[[rows,pal]])
  sequences.push({action,facing,frame:f,anchor:a.anchor,duration:a.duration,loop:a.loop,layers:split})
  return save(`${id}-${action}-${facing}-${f}.png`,24,24,layers)
 })}
 guests.push({id,label:def.label,elder:def.elder,anchor:settlementGuestFrame(id,'down','stand',0).anchor,actions,sequences,prop:save(`${id}-prop.png`,8,8,[[guestPropRows(id),GUEST_PROP_PALETTE]])})
}
for(const [i,id]of ['guest','home','weaver','courtyard','garden'].entries()) {
 const views={}
 for(const facing of facings){views[facing]=save(`building-${id}-${facing}.png`,64,64,[[OLD_BUILDINGS[id][facing].rows,OLD_VILLAGE_PALETTE]])
 save(`construction-${id}-${facing}.png`,64,64,[[OLD_CONSTRUCTION[id][facing].rows,OLD_VILLAGE_PALETTE]])}
 draw(sheet,768,OLD_BUILDINGS[id].down.rows,OLD_VILLAGE_PALETTE,i*150,304,2)
 draw(sheet,768,OLD_BUILDINGS[id].right.rows,OLD_VILLAGE_PALETTE,i*150,456,2)
 buildings.push({id,label:BUILDING_LABELS[id],views,size:[64,64],anchor:[32,64]})
}
png(`${out}/contact-sheet.png`,768,640,sheet)
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({guests,buildings,actorSource:'src/render/settlement-guests-art.ts',buildingSource:'src/render/settlement-building-details.ts',guestGameplayConnected:false,buildingsConnected:true,note:'손님 입주·일과는 별도 엔진 연결. 기존 시설 건물은 OLD_BUILDINGS로 바로 적용. 방향별 출입구와 footprint는 기존 그대로.'},null,2))
fs.writeFileSync(`${out}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>손님과 새 터 건물</title><style>body{font:16px system-ui;background:#f6edda;color:#493729;margin:24px}article{background:#e3d8c2;padding:16px;margin:16px 0;border-radius:8px}section{display:flex;gap:20px;flex-wrap:wrap}figure{margin:0;text-align:center}img{image-rendering:pixelated}figcaption{font-size:13px}button,select{font:inherit;padding:8px}</style><h1>손님 3명 · 새 터 건물 5종</h1><p>헤이즐: 바구니 짜기 / 모리스: 노년의 뱃사람·별자리판 / 아이비: 씨앗 주머니 손질</p><button id="toggle">멈추기</button> <select id="direction">${facings.map(f=>`<option value="${f}">${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[f]}</option>`).join('')}</select>${guests.map((g,i)=>`<article><h2>${g.label}</h2><section>${GUEST_ACTIONS.map(a=>`<figure><img data-guest="${i}" data-action="${a}" src="${g.actions[a].down[0]}" width="120" height="120" alt="${g.label} ${GUEST_ACTION_LABELS[a]}"><figcaption>${GUEST_ACTION_LABELS[a]}</figcaption></figure>`).join('')}</section></article>`).join('')}${buildings.map(b=>`<article><h2>${b.label}</h2><section>${facings.map(f=>`<figure><img src="${b.views[f]}" width="192" height="192" alt="${b.label} ${f}"><figcaption>${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[f]}</figcaption></figure>`).join('')}</section></article>`).join('')}<script>const guests=${JSON.stringify(guests)};let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,f=0;const btn=document.getElementById('toggle'),sel=document.getElementById('direction');function update(){btn.textContent=playing?'멈추기':'재생';document.querySelectorAll('[data-guest]').forEach(el=>el.src=guests[+el.dataset.guest].actions[el.dataset.action][sel.value][f])}btn.onclick=()=>{playing=!playing;update()};sel.onchange=update;setInterval(()=>{if(playing){f=(f+1)%4;update()}},300);update()</script></html>`)
console.log(`손님 3명 × 8동작 × 4방향 × 4프레임, 건물 5종 → ${out}`)
