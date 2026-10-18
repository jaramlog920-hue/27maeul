import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {person}=await import('../../src/render/milestone-moments-art.ts')
const {withLookDefaults}=await import('../../src/engine/avatar.ts')
for(let kind=1;kind<=3;kind++){
 const W=320,H=180,S=2,pixels=new Uint8Array(W*H*S*S*4)
 const p=(x,y,c,a=1,b=1)=>{const rgb=c.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(0,Math.round(y));yy<Math.min(H,Math.round(y)+Math.ceil(b));yy++)for(let xx=Math.max(0,Math.round(x));xx<Math.min(W,Math.round(x)+Math.ceil(a));xx++)for(let sy=0;sy<S;sy++)for(let sx=0;sx<S;sx++)pixels.set([...rgb,255],(((yy*S+sy)*W*S)+xx*S+sx)*4)}
 p(0,0,'#d7dfc8',W,H)
 const cloud=(x,y)=>{p(x+7,y,'#f2ecdb',22,3);p(x+2,y+3,'#f2ecdb',35,5);p(x,y+8,'#eee7d4',40,3)}
 cloud(38,19);cloud(233,31)
 for(let x=0;x<W;x+=2){const y=72+Math.round(8*Math.sin(x/70+.8));p(x,y,'#bdc9a4',2,H-y)}
 const crest=x=>kind===1?89+Math.round(12*Math.sin(x/77+.3)):kind===2?90+Math.round(8*Math.sin(x/95+1)):87+Math.round(11*Math.sin(x/82+2))
 for(let x=0;x<W;x+=2){const y=crest(x);p(x,y,'#93aa78',2,H-y);p(x,y+3,'#a7bb8c',2,8)}
 // A continuous grass surface, with a small curved worn path rather than a flat rectangle.
 for(let y=119;y<H;y++){
  const u=(y-119)/(H-119),center=kind===1?185-31*Math.sin(u*1.9):kind===2?179+30*Math.sin(u*1.6):168+23*Math.sin(u*2.4)
  const half=8+u*21;p(Math.round(center-half),y,'#baa982',Math.round(half*2),1)
  if(y%7===0)p(Math.round(center-half+2),y,'#c8b38c',Math.max(3,Math.round(half*.6)),1)
 }
 for(let i=0;i<100;i++){
  const x=(i*47+9)%W,y=94+(i*31)%85
  if(y<crest(x)+9||Math.abs(x-175)<43&&y>116)continue
  p(x,y,'#7f9c66',1,3);if(i%3===0)p(x+1,y+2,'#b2c28c',2,1)
 }
 if(kind===2){
  // Tree and stone belong to this proposal only; no game objects are installed.
  p(43,91,'#a28561',8,40);p(45,83,'#846e50',4,45);p(37,77,'#846e50',13,4)
  for(const [x,y,w,h,c] of [[16,49,51,12,'#718c63'],[8,60,72,17,'#718c63'],[16,73,57,12,'#718c63'],[22,43,40,12,'#8fa97a'],[12,57,64,9,'#8fa97a'],[25,48,31,5,'#a5b98a'],[19,69,43,5,'#829e6e']])p(x,y,c,w,h)
  p(240,124,'#858e7c',31,8);p(244,119,'#a4aa91',23,8);p(249,117,'#c0c2a5',13,3)
  p(35,132,'#82996d',25,2)
 }
 if(kind===3){
  for(let i=0;i<32;i++){
   const x=12+(i*67)%297,y=104+(i*29)%71
   if(Math.abs(x-171)<46&&y>116)continue
   p(x+1,y+2,'#708c59',1,5)
   const c=['#f0e7cb','#d9c278','#d5b2b5'][i%3]
   p(x,y,c,3,3);p(x+1,y+1,'#bba563',1,1)
  }
  for(let i=0;i<12;i++){const x=8+i*26,y=crest(x)+8;p(x,y,'#779361',1,7);p(x+1,y+2,'#a9bc86',3,1)}
 }
 // Same existing two characters in each proposal, to compare depth and grounding.
 person(p,137,139,null,'right','writer')
 person(p,180,139,withLookDefaults({name:'이웃',look:'f',top:6,hairBack:3}),'left','writer')
 png(`artifacts/scenery/hill-proposal-${kind}.png`,W*S,H*S,pixels)
}
