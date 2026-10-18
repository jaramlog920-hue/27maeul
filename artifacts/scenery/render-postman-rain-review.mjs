import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {drawPostmanEvent}=await import('../../src/render/postman-events-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
const ns=JSON.parse(fs.readFileSync('src/content/neighbors.json','utf8')),n=ns.find(n=>n.id==='postman')
const npc={avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar}),who:n.avatar?'writer':n.sprite}
const dims=[[480,270],[320,480],[300,170]]
for(const [cw,ch] of dims){const w=cw*3,h=ch*2,buf=new Uint8Array(w*h*4);let ox=0,oy=0
const g={fillStyle:'#000000',fillRect(x,y,a,b){const c=this.fillStyle.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(0,y);yy<Math.min(ch,y+b);yy++)for(let xx=Math.max(0,x);xx<Math.min(cw,x+a);xx++)buf.set([...c,255],((yy+oy)*w+xx+ox)*4)}}
for(let i=0;i<6;i++){ox=i%3*cw;oy=Math.floor(i/3)*ch;drawPostmanEvent(g,'ev:postman:small:rainCover',cw,ch,[0,.45,1.1][i%3],i<3?null:withLookDefaults({name:'기록자',look:'f',skin:3,top:6}),npc,[],i%3===0?0:1,i%3===0?null:i%3-1)}
png(`artifacts/scenery/postman-rain-${process.argv[2]??'review'}-${cw}x${ch}.png`,w,h,buf)}
