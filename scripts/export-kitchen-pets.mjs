import './pixel-ts-loader.mjs'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {png,draw} from './pixel-png.mjs'
const {KITCHEN_PET_ITEMS:items,KITCHEN_PET_PALETTE:palette,KITCHEN_ACTIONS,PET_SUPPLY_ACTIONS,kitchenFrame,petSupplyFrame}=await import('../src/render/kitchen-pet-art.ts')
const {writerPalette,ANIMAL_PALETTE}=await import('../src/render/sprites.ts')
const {withLookDefaults}=await import('../src/engine/avatar.ts')
const {petMotionRows}=await import('../src/render/pet-art.ts')
const root='assets/kitchen-pets',dirs=['down','up','left','right']
for(const folder of ['props','icons','motions','pets','layers'])fs.mkdirSync(`${root}/${folder}`,{recursive:true})
const manifest={version:1,description:'요리 3종과 펫 용품 3종 · 원본 픽셀 및 분리 모션',items:[],sequences:[]}
function check(rows,pal,n){assert.equal(rows.length,n);for(const r of rows){assert.equal(r.length,n);for(const c of r)assert(c==='.'||pal[c],`Unknown ${c}`)}}
function save(file,rows,pal){const n=rows.length;check(rows,pal,n);const p=new Uint8Array(n*n*4);draw(p,n,rows,pal);png(`${root}/${file}`,n,n,p)}
function icon(rows){return Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>{const cs=[rows[y*2][x*2],rows[y*2][x*2+1],rows[y*2+1][x*2],rows[y*2+1][x*2+1]].filter(c=>c!=='.');return cs.find(c=>cs.filter(v=>v===c).length>1)??cs[0]??'.'}).join(''))}
for(const[id,a]of Object.entries(items)){save(`props/${id}.png`,a.rows,palette);save(`icons/${id}.png`,icon(a.rows),palette);manifest.items.push({id,label:a.label,group:a.group,file:`props/${id}.png`,icon:`icons/${id}.png`,width:16,height:16,anchor:{x:8,y:13}})}
const looks={female:withLookDefaults({look:'f',name:'여성 예시',skin:2,hairFront:8,hairBack:4,top:13,bottom:4}),male:withLookDefaults({look:'m',name:'남성 예시',skin:4,hairFront:3,hairBack:0,top:10,bottom:6})}
function sequence(id,label,group,size,pal,frameFn,loop=true){
 const seq={id,label,group,width:size,height:size,loop,views:{},sheets:{}}
 for(const d of dirs){const sheet=new Uint8Array(size*4*size*4);seq.views[d]=[];const hashes=[]
  for(let f=0;f<4;f++){const a=frameFn(d,f),p=new Uint8Array(size*size*4),layers={}
   for(const key of ['back','actor','front','hands'])if(a[key]){const colors=key==='actor'||key==='hands'?pal:palette;check(a[key],colors,size);const file=`layers/${id}-${d}-${key}-${f}.png`;save(file,a[key],colors);layers[key]=file;draw(p,size,a[key],colors);draw(sheet,size*4,a[key],colors,size*f)}
   const file=`${group==='pets'?'pets':'motions'}/${id}-${d}-${f}.png`;png(`${root}/${file}`,size,size,p);seq.views[d].push({file,layers,duration:a.duration,anchor:{x:size/2,y:size-3}});hashes.push(Buffer.from(p).toString('base64'))
  }
  assert(new Set(hashes).size>1,`${id} ${d} has incorrect frame changes`)
  const file=`${group==='pets'?'pets':'motions'}/${id}-${d}-sheet.png`;png(`${root}/${file}`,size*4,size,sheet);seq.sheets[d]=file
 }
 manifest.sequences.push(seq)
}
for(const[gender,avatar]of Object.entries(looks))for(const[action,label]of Object.entries(KITCHEN_ACTIONS))sequence(`${gender}-${action}`,`${gender==='female'?'여성':'남성'} · ${label}`,'motions',24,writerPalette('spring',avatar),(d,f)=>kitchenFrame(d,action,f,{avatar,frame:0,blink:false,season:'spring'}))
for(const kind of ['cat','dog'])for(const baby of [false,true])for(const[action,label]of Object.entries(PET_SUPPLY_ACTIONS))sequence(`${kind}-${baby?'baby':'adult'}-${action}`,`${baby?'새끼 ':''}${kind==='cat'?'고양이':'강아지'} · ${label}`,'pets',32,ANIMAL_PALETTE[kind],(d,f)=>petSupplyFrame(kind,baby,d,action,f))
// Include the revised baby walk here for a direct comparison in the new preview.
for(const kind of ['cat','dog'])sequence(`${kind}-baby-walk`, `새끼 ${kind==='cat'?'고양이':'강아지'} · 발 고정 따라오기`,'pets',16,ANIMAL_PALETTE[kind],(d,f)=>({actor:petMotionRows(kind,d,'walk',f,true),duration:360}))
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2))
function review(file,rows,cols,cell,render){const p=new Uint8Array(cols*cell*rows*cell*4);for(let i=0;i<p.length;i+=4)p.set([245,234,214,255],i);render(p,cols*cell);png(`${root}/${file}`,cols*cell,rows*cell,p)}
const main=['grapeJuice','barleyPorridge','oliveBread','petCushion','yarnBall','petWaterBowl']
review('items-review.png',2,3,112,(p,w)=>main.forEach((id,i)=>draw(p,w,items[id].rows,palette,(i%3)*112+24,Math.floor(i/3)*112+24,4)))
const sample=[...Object.keys(KITCHEN_ACTIONS).map(action=>({id:`female-${action}`})),...['cat','dog'].flatMap(kind=>Object.keys(PET_SUPPLY_ACTIONS).map(action=>({id:`${kind}-baby-${action}`})))]
// Contact sheet rows are four consecutive frames, preserving exact native pixels.
review('motions-review.png',sample.length,4,112,(p,w)=>sample.forEach(({id},i)=>{const seq=manifest.sequences.find(s=>s.id===id);for(let f=0;f<4;f++){const a=id.startsWith('female')?kitchenFrame('down',id.slice(7),f,{avatar:looks.female,frame:0,blink:false,season:'spring'}):petSupplyFrame(id.startsWith('cat')?'cat':'dog',true,'down',id.split('-').slice(2).join('-'),f),pal=id.startsWith('female')?writerPalette('spring',looks.female):ANIMAL_PALETTE[id.startsWith('cat')?'cat':'dog'];for(const k of ['back','actor','front','hands'])if(a[k])draw(p,w,a[k],k==='actor'||k==='hands'?pal:palette,f*112+(112-seq.width*3)/2,i*112+(112-seq.height*3)/2,3)}}))
review('baby-walk-review.png',4,4,80,(p,w)=>['cat','dog'].forEach((kind,i)=>['down','up'].forEach((d,j)=>{for(let f=0;f<4;f++)draw(p,w,petMotionRows(kind,d,'walk',f,true),ANIMAL_PALETTE[kind],f*80+8,(i*2+j)*80+8,4)})))
// Script-free APNG gallery: all cards exist on first paint, including four directions.
const cards=manifest.items.map(a=>`<article><h3>${a.label}</h3><img width="96" height="96" src="${a.file}"><p><a href="${a.file}">원본 PNG</a></p></article>`).join('')
const anim=manifest.sequences.map(s=>`<article><h3>${s.label}</h3><div class="views">${dirs.map(d=>{const key=`kitchen-pets/sequences/${s.group}/${s.id}////`;
const hash=createHash('sha1').update(key+'/'+d).digest('hex').slice(0,20);return `<div><p>${{down:'앞',up:'뒤',left:'왼쪽',right:'오른쪽'}[d]}</p><img width="${s.width*3}" height="${s.height*3}" src="../all-preview/motion/${hash}.png"><p><a href="${s.sheets[d]}">프레임 PNG</a></p></div>`}).join('')}</div></article>`).join('')
fs.writeFileSync(`${root}/preview.html`,`<!doctype html><html lang="ko"><meta charset="utf-8"><title>요리·펫 용품 모션</title><style>body{background:#f6eddd;color:#704b35;font-family:system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(390px,1fr));gap:16px}article{background:#fff9ef;border:1px solid #ddc9ad;border-radius:10px;padding:18px}img{image-rendering:pixelated;background:#eee0c9}.views{display:flex;gap:8px;flex-wrap:wrap}a{color:#407c79}h3{font-size:15px}</style><h1>요리·펫 용품</h1><p>원본 14종 · 요리 8동작(남녀) · 펫 3동작(성체·새끼) · 새끼 걸음. 모든 방향이 자동 재생됩니다.</p><h2>정지 도트</h2><main>${cards}</main><h2>모션</h2><main>${anim}</main></html>`)
console.log(`Exported ${manifest.items.length} items and ${manifest.sequences.length} four-direction motions`)
