import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {drawHomeFamily,HOME_ROOM_IDS}=await import('../../src/render/home-family-art.ts')
const neighbors=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8'))
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const parent=withLookDefaults({name:'기록자',look:'m'}),spouse=withLookDefaults({name:'배우자',look:'f',hairFront:3,hairBack:3,top:4})

const kid={avatar:withLookDefaults({name:'아이',look:'f',skin:1}),who:'child',short:1}
const actor=id=>{const n=neighbors.find(n=>n.id===id);return {avatar:withLookDefaults({name:n.role,look:n.look??'m',...n.avatar}),who:n.avatar?'writer':n.sprite}}
for(let sheet=0;sheet<4;sheet++){
 const w=1280,h=720,scale=2,pixels=new Uint8Array(w*scale*h*scale*4)
 let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){
 const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255)
 for(let yy=Math.max(0,(y+oy)*scale);yy<Math.min(h*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(0,(x+ox)*scale);xx<Math.min(w*scale,(x+ox+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)
 }}
 for(let cell=0;cell<16;cell++){
 const index=sheet*8+Math.floor(cell/2),id=HOME_ROOM_IDS[index];if(!id)continue
 ox=cell%4*320;oy=Math.floor(cell/4)*180
 drawHomeFamily(g,id,320,180,8,parent,id.includes(':with:')?actor(id.split(':')[2]):id.includes('supper')||id.includes('meal')||id==='fam:bdaySpouse'||id==='fam:bdayChild'?actor('wendell'):kid,[kid],cell%2,0)
 }
 png(`artifacts/scenery/home-family-sheet-${sheet}.png`,w*scale,h*scale,pixels)
}
console.log(HOME_ROOM_IDS.map((id,i)=>`${i}: ${id}`).join('\n'))

for(const id of HOME_ROOM_IDS)for(const choice of id.startsWith('fam:with:')||id==='fam:cook'?[0,1,2]:[0]){
 const w=320,h=693,scale=1,pixels=new Uint8Array(w*h*4)
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(0,y);yy<Math.min(h,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(w,x+a);xx++)pixels.set(color,(yy*w+xx)*4)}}
 drawHomeFamily(g,id,w,h,8,parent,id.startsWith('fam:with:')?actor(id.split(':')[2]):id.includes('supper')||id.includes('meal')||id==='fam:bdaySpouse'||id==='fam:bdayChild'?actor('wendell'):kid,[kid],1,choice)
 png(`artifacts/scenery/home-${id.replaceAll(':','-')}-${choice}.png`,w,h,pixels)
}

const variants=HOME_ROOM_IDS.filter(id=>id.startsWith('fam:with:')).flatMap(id=>[0,1,2].map(choice=>({id,choice})))
for(let sheet=0;sheet<3;sheet++){
 const w=1280,h=720,scale=2,pixels=new Uint8Array(w*scale*h*scale*4);let ox=0,oy=0
 const g={fillStyle:'#000000',fillRect(x,y,a,b){const color=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let yy=Math.max(0,(y+oy)*scale);yy<Math.min(h*scale,(y+oy+b)*scale);yy++)for(let xx=Math.max(0,(x+ox)*scale);xx<Math.min(w*scale,(x+ox+a)*scale);xx++)pixels.set(color,(yy*w*scale+xx)*4)}}
 for(let cell=0;cell<16;cell++){const v=variants[sheet*16+cell];if(!v)continue;ox=cell%4*320;oy=Math.floor(cell/4)*180;drawHomeFamily(g,v.id,320,180,8,parent,actor(v.id.split(':')[2]),[kid],1,v.choice)}
 png(`artifacts/scenery/home-family-choices-${sheet}.png`,w*scale,h*scale,pixels)
}
