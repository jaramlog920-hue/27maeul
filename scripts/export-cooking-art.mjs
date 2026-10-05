import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { png, draw } from './pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)}})
const {COOKING_PROPS,COOKING_LABELS,COOL_CUPBOARD,COOK_ACTIONS,COOK_ACTION_LABELS,CHILD_COOK_ACTIONS,cookingFrame}=await import('../src/render/cooking-art.ts')
const {LIFE_GAP_PROPS,LIFE_GAP_LABELS,LIFE_GAP_STRUCTURES,PET_PERSONALITIES,petPersonalityFrame}=await import('../src/render/life-gap-art.ts')
const {FURNI_PALETTE}=await import('../src/render/furniture-art.ts')
const {writerPalette,ANIMAL_PALETTE}=await import('../src/render/sprites.ts')
const out='assets/cooking',facings=['down','up','left','right']
for(const d of ['props','icons','structures','motions','children','pairs','pets','layers'])fs.mkdirSync(`${out}/${d}`,{recursive:true})
const palette={...FURNI_PALETTE,z:'#5a4638'},actorPalette=writerPalette('spring')
function check(rows,w,h,pal){assert.equal(rows.length,h);for(const r of rows){assert.equal(r.length,w);for(const c of r)assert(c==='.'||pal[c],`Unknown pixel ${c}`)}}
function paint(p,w,rows,pal,x=0,y=0,scale=1){draw(p,w,rows.map(r=>r.replaceAll('z','.')),pal,x,y,scale)}
function save(file,rows,pal=palette){const h=rows.length,w=rows[0].length;check(rows,w,h,pal);const p=new Uint8Array(w*h*4);paint(p,w,rows,pal);png(`${out}/${file}`,w,h,p)}
function icon(rows){const h=rows.length,w=rows[0].length;return Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>{const chars=[];for(let dy=0;dy<h/8;dy++)for(let dx=0;dx<w/8;dx++){const c=rows[Math.floor(y*h/8+dy)][Math.floor(x*w/8+dx)];if(c!=='.'&&c!=='z')chars.push(c)}return chars.sort((a,b)=>chars.filter(c=>c===b).length-chars.filter(c=>c===a).length)[0]??'.'}).join(''))}
const items=[],motions=[],pets=[],pairs=[]
for(const [group,props,labels]of [['cooking',COOKING_PROPS,COOKING_LABELS],['life',LIFE_GAP_PROPS,LIFE_GAP_LABELS]])for(const[id,a]of Object.entries(props)){
  const file=`props/${id}.png`,ico=`icons/${id}.png`;save(file,a.rows);save(ico,icon(a.rows));items.push({id,label:labels[id],group,file,icon:ico,width:a.w*16,height:a.h*16,anchor:{x:a.w*8,y:a.h*16},rows:a.rows})
}
for(const [id,views]of Object.entries({...Object.fromEntries(Object.entries(COOL_CUPBOARD).map(([state,v])=>[`coolCupboard-${state}`,v])),...LIFE_GAP_STRUCTURES}))for(const[facing,a]of Object.entries(views)){
  const file=`structures/${id}-${facing}.png`,ico=`icons/${id}-${facing}.png`;save(file,a.rows);save(ico,icon(a.rows))
  const cut=a.h*16-7,back=a.rows.map((r,y)=>y<cut?r:'.'.repeat(a.w*16)),front=a.rows.map((r,y)=>y>=cut?r:'.'.repeat(a.w*16))
  save(`layers/${id}-${facing}-back.png`,back);save(`layers/${id}-${facing}-front.png`,front)
  items.push({id,label:id.startsWith('coolCupboard')?'냉장 찬장 '+id.split('-')[1]:id,group:'structure',facing,file,icon:ico,width:a.w*16,height:a.h*16,anchor:{x:a.w*8,y:a.h*16},layers:{back:`layers/${id}-${facing}-back.png`,front:`layers/${id}-${facing}-front.png`},rows:a.rows})
}
function motion(action,facing,child){const size=24, sheets=Object.fromEntries(['sheet','actor','back','front'].map(k=>[k,new Uint8Array(96*24*4)])),frames=[],prefix=`${child?'children':'motions'}/${action}-${facing}`
  for(let f=0;f<4;f++){
    const a=cookingFrame('writer',facing,action,f,{frame:0,blink:false,season:'spring',short:child?1:undefined}),p=new Uint8Array(24*24*4)
    for(const [rows,pal,key]of [[a.propBack,palette,'back'],[a.actor,actorPalette,'actor'],[a.propFront,palette,'front']]){check(rows,24,24,pal);paint(p,24,rows,pal);paint(sheets.sheet,96,rows,pal,f*24);paint(sheets[key],96,rows,pal,f*24)}
    assert(a.anchor.x>=0&&a.anchor.x<24&&a.anchor.y>=0&&a.anchor.y<24);png(`${out}/${prefix}-${f}.png`,size,size,p)
    frames.push({frame:f,duration:a.duration,anchor:a.anchor,interaction:a.interaction,propId:a.propId,loop:a.loop})
  }
  for(const[k,p]of Object.entries(sheets))png(`${out}/${prefix}-${k}.png`,96,24,p)
  motions.push({action,label:COOK_ACTION_LABELS[COOK_ACTIONS.indexOf(action)],facing,child,file:`${prefix}-sheet.png`,layers:{actor:`${prefix}-actor.png`,back:`${prefix}-back.png`,front:`${prefix}-front.png`},width:24,height:24,frames})
}
for(const child of [false,true])for(const action of child?CHILD_COOK_ACTIONS:COOK_ACTIONS)for(const facing of facings)motion(action,facing,child)
// The child prepares cold dough/plates while the adult handles hot tools.
for(const [id,adultAction,childAction]of [['cookTogether','stir','sort'],['bakeTogether','ovenOut','shapeRound'],['serveTogether','ladle','choosePlate']])for(const facing of facings){
  const sheet=new Uint8Array(192*32*4),frames=[]
  for(let f=0;f<4;f++){
    const p=new Uint8Array(48*32*4)
    for(const[child,action,x]of [[false,adultAction,0],[true,childAction,24]]){
      const a=cookingFrame('writer',facing,action,f,{frame:0,blink:false,short:child?1:undefined})
      for(const[rows,pal]of [[a.propBack,palette],[a.actor,actorPalette],[a.propFront,palette]]){paint(p,48,rows,pal,x,4);paint(sheet,192,rows,pal,f*48+x,4)}
    }
    png(`${out}/pairs/${id}-${facing}-${f}.png`,48,32,p);frames.push({frame:f,duration:[280,200,340,240][f]})
  }
  png(`${out}/pairs/${id}-${facing}-sheet.png`,192,32,sheet);pairs.push({id,facing,file:`pairs/${id}-${facing}-sheet.png`,width:48,height:32,adultAction,childAction,anchors:[{x:12,y:22},{x:36,y:22}],frames,loop:true})
}
for(const kind of ['cat','dog'])for(const baby of [false,true])for(const action of PET_PERSONALITIES)for(const facing of facings){
  const sheet=new Uint8Array(64*16*4)
  for(let f=0;f<4;f++){const rows=petPersonalityFrame(kind,facing,action,f,baby);check(rows,16,16,ANIMAL_PALETTE[kind]);save(`pets/${kind}-${baby?'baby':'adult'}-${action}-${facing}-${f}.png`,rows,ANIMAL_PALETTE[kind]);paint(sheet,64,rows,ANIMAL_PALETTE[kind],f*16)}
  const file=`pets/${kind}-${baby?'baby':'adult'}-${action}-${facing}-sheet.png`;png(`${out}/${file}`,64,16,sheet);pets.push({kind,baby,action,facing,file,width:16,height:16,durations:[320,240,360,240],anchor:{x:8,y:14}})
}
const manifest={tileSize:16,facings,propsDirectionIndependent:true,status:'assets-ready; gameplay integration pending',items:items.map(({rows,...a})=>a),motions,pairs,pets}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2))
const cols=8,cell=96,w=cols*cell,h=Math.ceil(items.length/cols)*cell,preview=new Uint8Array(w*h*4)
for(let i=0;i<preview.length;i+=4)preview.set([245,240,222,255],i)
items.forEach((a,i)=>{const scale=a.height>16?2:4;paint(preview,w,a.rows,palette,i%cols*cell+(cell-a.width*scale)/2,Math.floor(i/cols)*cell+(cell-a.height*scale)/2,scale)})
png(`${out}/preview.png`,w,h,preview)
const pw=384,ph=COOK_ACTIONS.length*96,mp=new Uint8Array(pw*ph*4)
for(let i=0;i<mp.length;i+=4)mp.set([245,240,222,255],i)
COOK_ACTIONS.forEach((action,y)=>{for(let f=0;f<4;f++){const a=cookingFrame('writer','right',action,f,{frame:0,blink:false});for(const[r,pal]of [[a.propBack,palette],[a.actor,actorPalette],[a.propFront,palette]])paint(mp,pw,r,pal,f*96,y*96,4)}})
png(`${out}/motion-preview.png`,pw,ph,mp)
fs.writeFileSync(`${out}/미리보기.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>27마을 요리·생활 보완 도트</title><style>body{background:#f5f0de;color:#553c29;font:15px sans-serif;padding:24px}nav{display:flex;gap:8px;flex-wrap:wrap}button{padding:10px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}section{background:#fff9e9;padding:16px}img,canvas{image-rendering:pixelated;display:block;margin:12px auto}small{overflow-wrap:anywhere}</style><h1>요리·생활 보완 도트</h1><p>도트 제작 완료 · 게임 기능 연결은 별도. 인물 PNG는 기본 외형 예시이며 실제 외형은 코드 함수로 유지합니다.</p><nav>${[['items','소품·시설'],['adult','성인 요리'],['child','아이 안전 준비'],['pairs','보호자와 아이'],['pets','동물 성격']].map(([id,label])=>`<button data-tab="${id}">${label}</button>`).join('')}</nav><main></main><script>const data=${JSON.stringify(manifest)};let generation=0;function show(type){const gen=++generation,main=document.querySelector('main');main.replaceChildren();const list=type==='items'?data.items:type==='adult'||type==='child'?data.motions.filter(i=>i.child===(type==='child')):data[type];for(const i of list){const box=document.createElement('section'),label=document.createElement('small');label.textContent=[i.label||i.id||i.action,i.kind,i.baby?'새끼':'',i.facing].filter(Boolean).join(' · ');box.append(label);main.append(box);const img=new Image();img.src=i.file;if(i.frames||i.durations){const cv=document.createElement('canvas');cv.width=i.width;cv.height=i.height;cv.style.width=i.width*4+'px';box.append(cv);const ctx=cv.getContext('2d');let f=0;img.onload=()=>tick();function tick(){if(gen!==generation)return;ctx.clearRect(0,0,i.width,i.height);ctx.drawImage(img,f*i.width,0,i.width,i.height,0,0,i.width,i.height);const duration=i.frames?i.frames[f].duration:i.durations[f];f=(f+1)%4;setTimeout(tick,duration)}}else{img.style.width=i.width*4+'px';box.append(img)}}}document.querySelectorAll('button').forEach(b=>b.onclick=()=>show(b.dataset.tab));show('items')</script></html>`)
// Validate exported references and PNG headers, including separate layers.
const references=[]
function refs(value){if(value&&typeof value==='object')for(const[k,v]of Object.entries(value)){if(typeof v==='string'&&v.endsWith('.png'))references.push(v);else refs(v)}}refs(manifest)
for(const file of references){const b=fs.readFileSync(`${out}/${file}`);assert.equal(b.subarray(1,4).toString(),'PNG');assert(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0)}
for(const action of COOK_ACTIONS)assert(COOKING_PROPS[cookingFrame('writer','down',action,0,{frame:0,blink:false}).propId])
assert.throws(()=>cookingFrame('writer','down','stir',0,{frame:0,blink:false,short:1}))
console.log(JSON.stringify({items:items.length,adultSequences:motions.filter(i=>!i.child).length,childSequences:motions.filter(i=>i.child).length,pairSequences:pairs.length,petSequences:pets.length,validatedReferences:references.length}))
