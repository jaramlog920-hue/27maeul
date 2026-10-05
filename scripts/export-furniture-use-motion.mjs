import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { registerHooks } from 'node:module'
registerHooks({ resolve(s,c,n) { return n(s.startsWith('.') && !path.extname(s) ? `${s}.ts` : s,c) } })
const { furnitureUseFrame, USE_ACTIONS, USE_INFO, USE_PROP_PALETTE } = await import('../src/render/furniture-use-motion.ts')
const { writerPalette } = await import('../src/render/sprites.ts')
const out='assets/furniture/use-motion'; fs.mkdirSync(out,{recursive:true})
function crc32(bytes) { let c=0xffffffff; for(const b of bytes) {c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0)}return(c^0xffffffff)>>>0 }
function chunk(t,d){const n=Buffer.from(t),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(d.length);c.writeUInt32BE(crc32(Buffer.concat([n,d])));return Buffer.concat([l,n,d,c])}
function png(file,w,h,p){const hd=Buffer.alloc(13);hd.writeUInt32BE(w);hd.writeUInt32BE(h,4);hd[8]=8;hd[9]=6;const scan=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)Buffer.from(p.slice(y*w*4,(y+1)*w*4)).copy(scan,y*(w*4+1)+1);fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hd),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]))}
function draw(p,w,rows,palette,ox=0,oy=0,scale=1){rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='.')return;const hex=palette[c];if(!hex)throw Error(`Unknown color ${c}`);const color=hex.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++)p.set(color,((oy+y*scale+dy)*w+ox+x*scale+dx)*4)}))}
const actorPalette=writerPalette('spring'),facings=['down','up','left','right'],items=[]

for(const [ai,action] of USE_ACTIONS.entries())for(const [di,facing]of facings.entries()){
 const sheet=new Uint8Array(96*24*4),actors=new Uint8Array(96*24*4),backs=new Uint8Array(96*24*4),fronts=new Uint8Array(96*24*4),frames=[]
 for(let f=0;f<4;f++){
  const pose=furnitureUseFrame('writer',facing,action,f,{frame:0,blink:false,season:'spring'}),p=new Uint8Array(24*24*4)
  for(const [rows,pal,target]of [[pose.propBack,USE_PROP_PALETTE,backs],[pose.actor,actorPalette,actors],[pose.propFront,USE_PROP_PALETTE,fronts]]){draw(p,24,rows,pal);draw(sheet,96,rows,pal,f*24);draw(target,96,rows,pal,f*24)}
  png(`${out}/${action}-${facing}-${f}.png`,24,24,p);frames.push({frame:f,x:f*24,y:0,duration:pose.duration,anchor:pose.anchor,interaction:pose.interaction})
 }
 for(const [suffix,p]of [['sheet',sheet],['actor',actors],['prop-back',backs],['prop-front',fronts]])png(`${out}/${action}-${facing}-${suffix}.png`,96,24,p)
 items.push({action,facing,label:USE_INFO[action].label,furniture:USE_INFO[action].furniture,sheet:`${action}-${facing}-sheet.png`,layers:{actor:`${action}-${facing}-actor.png`,back:`${action}-${facing}-prop-back.png`,front:`${action}-${facing}-prop-front.png`},frames})
}
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({size:24,frameCount:4,facings,sampleCharacter:'writer, default spring appearance; use source function for customized characters',items},null,2))
// Contact sheet: each action has four facing rows and four frame columns.
const contact=new Uint8Array(384*3072*4);for(let i=0;i<contact.length;i+=4)contact.set([245,240,222,255],i)
for(const [ai,a]of USE_ACTIONS.entries())for(const [di,d]of facings.entries())for(let f=0;f<4;f++){const p=furnitureUseFrame('writer',d,a,f,{frame:0,blink:false,season:'spring'});draw(contact,384,p.propBack,USE_PROP_PALETTE,f*96,(ai*4+di)*96,4);draw(contact,384,p.actor,actorPalette,f*96,(ai*4+di)*96,4);draw(contact,384,p.propFront,USE_PROP_PALETTE,f*96,(ai*4+di)*96,4)}
png(`${out}/preview-4x.png`,384,3072,contact)
fs.writeFileSync(`${out}/미리보기.html`, `<!doctype html><meta charset="utf-8"><title>27마을 가구 사용 모션</title><style>body{background:#f5f0de;color:#553c29;font:16px sans-serif;padding:24px}main{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}section{background:#fff8e9;padding:12px;border-radius:10px}canvas{width:144px;height:144px;image-rendering:pixelated}small{display:block}</style><h1>가구 사용 모션 · 4방향</h1><p>각 동작은 4프레임입니다. 방향 순서: 앞 · 뒤 · 왼쪽 · 오른쪽. PNG는 기본 외형 예시이며 선택한 외형은 소스 함수로 유지합니다.</p><main></main><script>const items=${JSON.stringify(items)};for(const i of items){const s=document.createElement('section');s.innerHTML='<b>'+i.label+'</b><small>'+i.facing+'</small><canvas width="24" height="24"></canvas>';document.querySelector('main').append(s);const c=s.querySelector('canvas').getContext('2d'),im=new Image;im.src=i.sheet;let f=0;function tick(){c.clearRect(0,0,24,24);if(im.complete)c.drawImage(im,f*24,0,24,24,0,0,24,24);const t=i.frames[f].duration;f=(f+1)%4;setTimeout(tick,t)}im.onload=tick}</script>`)
console.log(`Exported ${items.length*4} frames and ${items.length*4} layered sheets`)

