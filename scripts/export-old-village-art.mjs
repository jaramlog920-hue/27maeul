import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {png,draw} from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(url,c,n){if(url.endsWith('.json'))return {format:'module',source:`export default ${fs.readFileSync(new URL(url),'utf8')}`,shortCircuit:true};return n(url,c)}})
const {OLD_PROPS,OLD_JOB_SIGNS,OLD_TERRAIN,OLD_PROP_LABELS,OLD_BUILDINGS,OLD_CONSTRUCTION,OLD_INTERIORS,OLD_VILLAGE_PALETTE,BUILDING_LABELS}=await import('../src/render/old-village-art.ts')
const {GENERATION_STAGES,FAMILY_ACTIONS,FAMILY_ACTION_LABELS,generationRows,familyFrame,familyPairFrame}=await import('../src/render/generation-art.ts')
const {withLookDefaults}=await import('../src/engine/avatar.ts')
const {writerPalette}=await import('../src/render/sprites.ts')
const out='assets/old-testament-generations',facings=['down','up','left','right'],items=[],sequences=[]
const groupLabels={props:'생활 소품','job-signs':'직업 표식',terrain:'지형·자연',buildings:'완성 건물',construction:'공사 골격',interiors:'실내 배치',growth:'성장 단계',motions:'가족 동작',pairs:'둘이 함께'}
const stageLabels={baby:'아기',toddler:'유아',child:'어린이',teen:'청소년',adult:'성인'}
for(const d of ['props','job-signs','terrain','buildings','construction','interiors','growth','motions','pairs'])fs.mkdirSync(`${out}/${d}`,{recursive:true})
const palette=OLD_VILLAGE_PALETTE
const avatar=withLookDefaults({look:'f',name:'미리보기',hairBack:0,top:12,bottom:2})
const child=withLookDefaults({look:'m',name:'아이',hairFront:1,hairBack:0,top:3,bottom:3,hairColor:[30,50,32]})
const actorPalette=writerPalette('spring',avatar),childPalette=writerPalette('spring',child)
function check(rows,pal){assert(rows.length);const w=rows[0].length;for(const r of rows){assert.equal(r.length,w);for(const c of r)assert(c==='.'||pal[c],`알 수 없는 색 ${c}`)}}
function paint(p,w,rows,pal,x=0,y=0){check(rows,pal);draw(p,w,rows.map(r=>r.replaceAll('z','.')),pal,x,y)}
function save(file,rows,pal){check(rows,pal);const width=rows[0].length,height=rows.length,p=new Uint8Array(width*height*4);paint(p,width,rows,pal);png(`${out}/${file}`,width,height,p);return {file,width,height}}
for(const[id,a]of Object.entries(OLD_PROPS))items.push({id,group:'props',label:OLD_PROP_LABELS[id],...save(`props/${id}.png`,a.rows,palette),anchor:{x:a.w*8,y:a.h*16},footprint:{w:a.w,h:a.h}})
for(const[group,all]of [['job-signs',OLD_JOB_SIGNS],['terrain',OLD_TERRAIN]])for(const[id,a]of Object.entries(all))items.push({id,group,label:BUILDING_LABELS[id]??id,...save(`${group}/${id}.png`,a.rows,palette),anchor:{x:a.w*8,y:a.h*16}})
for(const[group,all]of [['buildings',OLD_BUILDINGS],['construction',OLD_CONSTRUCTION]])for(const[id,views]of Object.entries(all))for(const[facing,a]of Object.entries(views)){
 const asset={id,group,label:BUILDING_LABELS[id],facing,...save(`${group}/${id}-${facing}.png`,a.rows,palette),anchor:{x:32,y:60},visualTiles:{w:4,h:4},footprint:{w:4,h:3},entry:facing==='up'?null:facing==='left'?{x:15,y:60}:facing==='right'?{x:47,y:60}:{x:32,y:60}}
 const front=a.rows.map((r,y)=>y>=55?r:'.'.repeat(64)),back=a.rows.map((r,y)=>y<55?r:'.'.repeat(64));save(`${group}/${id}-${facing}-back.png`,back,palette);save(`${group}/${id}-${facing}-front.png`,front,palette);asset.layers={back:`${group}/${id}-${facing}-back.png`,front:`${group}/${id}-${facing}-front.png`};items.push(asset)
}
for(const[id,a]of Object.entries(OLD_INTERIORS))items.push({id,group:'interiors',label:BUILDING_LABELS[id]+' 내부 배치',...save(`interiors/${id}.png`,a.rows,palette),entry:{x:64,y:94},note:'내부 배치 원안. 소품은 props에서 별도 배치하며 통행은 엔진에서 검사.'})
for(const stage of GENERATION_STAGES)for(const facing of facings){const frames=[];for(let f=0;f<4;f++){const rows=generationRows(stage,facing,f,{frame:0,blink:false,avatar:child});frames.push({...save(`growth/${stage}-${facing}-${f}.png`,rows,childPalette),duration:180,anchor:{x:5,y:14}})}sequences.push({id:stage,group:'growth',label:stageLabels[stage],facing,frames})}
for(const stage of ['toddler','child','teen','adult'])for(const action of FAMILY_ACTIONS){
 if(stage!=='adult'&&['holdBaby','sootheBaby'].includes(action))continue
 for(const facing of facings){const frames=[],isAdult=stage==='adult',av=isAdult?avatar:child,pal=isAdult?actorPalette:childPalette
  for(let f=0;f<4;f++){const a=familyFrame('writer',facing,action,f,stage,{frame:0,blink:false,avatar:av}),p=new Uint8Array(24*24*4);for(const[rows,colors]of [[a.propBack,palette],[a.actor,pal],[a.propFront,palette]])paint(p,24,rows,colors);const file=`motions/${stage}-${action}-${facing}-${f}.png`;png(`${out}/${file}`,24,24,p);const layers={};for(const[k,rows,colors]of [['actor',a.actor,pal],['back',a.propBack,palette],['front',a.propFront,palette]]){const l=`motions/${stage}-${action}-${facing}-${f}-${k}.png`;save(l,rows,colors);layers[k]=l}frames.push({file,width:24,height:24,duration:a.duration,anchor:a.anchor,loop:a.loop??true,layers})}
  sequences.push({id:action,stage,group:'motions',label:FAMILY_ACTION_LABELS[action],facing,frames})
 }
}
for(const action of ['readTogether','familyMeal','welcome'])for(const facing of facings){const frames=[];for(let f=0;f<4;f++){const a=familyPairFrame(facing,action,f,{frame:0,blink:false,avatar},{frame:0,blink:false,avatar:child}),p=new Uint8Array(48*24*4);a.actors.forEach((actor,i)=>{for(const[rows,pal]of [[actor.propBack,palette],[actor.actor,i===0?actorPalette:childPalette],[actor.propFront,palette]])paint(p,48,rows,pal,actor.offset.x,0)});const file=`pairs/${action}-${facing}-${f}.png`;png(`${out}/${file}`,48,24,p);frames.push({file,width:48,height:24,duration:300,actors:a.actors.map(v=>({offset:v.offset,anchor:v.anchor}))})}sequences.push({id:action,group:'pairs',label:FAMILY_ACTION_LABELS[action],facing,frames})}
const manifest={version:1,tileSize:16,status:'자산 준비 / 게임 기능 미연결',palette,actorPalette,childPalette,items,sequences,reuse:[{kind:'결혼식',source:'src/render/wedding-art.ts',function:'weddingActorFrame'},{kind:'생일·발표·집들이',source:'src/render/event-life-motion.ts',function:'eventMotionFrame'},{kind:'직업별 손일·요리',source:'src/render/cooking-art.ts',function:'cookingFrame'}]}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2))
const cards=items.map(a=>`<article data-group="${a.group}"><h3>${a.label} ${a.facing??''}</h3><img src="${a.file}" width="${a.width*3}" height="${a.height*3}"><p>${a.width}×${a.height} px · ${a.id}</p></article>`).concat(sequences.map((a,i)=>`<article data-group="${a.group}"><h3>${a.label} ${a.stage??''} ${a.facing}</h3><img data-animation="${i}" src="${a.frames[0].file}" width="${a.frames[0].width*5}" height="${a.frames[0].height*5}"><p>4프레임 · ${a.id}</p></article>`))
fs.writeFileSync(`${out}/미리보기.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>구약 마을과 주민 세대 도트</title><style>body{background:#eee4d0;color:#45392d;font:15px sans-serif;margin:24px}nav{position:sticky;top:0;background:#eee4d0;padding:12px}button{margin:4px;padding:8px}main{display:flex;flex-wrap:wrap;gap:14px}article{background:#f8f0df;border:1px solid #bda688;padding:12px;min-width:180px}img{image-rendering:pixelated;max-width:100%;object-fit:contain}h3{font-size:14px}p{font-size:12px}</style><h1>구약 마을 · 주민 세대 도트</h1><p>원본 16px 타일. 투명 PNG와 코드 원본 준비, 실제 게임 연결은 별도입니다.</p><nav>${['props','job-signs','terrain','buildings','construction','interiors','growth','motions','pairs'].map(g=>`<button data-filter="${g}">${groupLabels[g]}</button>`).join('')}<button id="pause">모션 멈추기</button></nav><main>${cards.join('')}</main><script>const sequences=${JSON.stringify(sequences)};let phase=0,paused=false;document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>document.querySelectorAll('article').forEach(a=>a.hidden=a.dataset.group!==b.dataset.filter));document.getElementById('pause').onclick=()=>{paused=!paused};setInterval(()=>{if(paused)return;phase=(phase+1)%4;document.querySelectorAll('[data-animation]').forEach(img=>{img.src=sequences[+img.dataset.animation].frames[phase].file})},300);document.querySelector('[data-filter="buildings"]').click()</script></html>`)
console.log(`완료: 정지 그림 ${items.length}개, 4프레임 시퀀스 ${sequences.length}개, ${out}`)
