import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {MAP,TILE,HOUSES,treeKind}=await import('../../src/engine/world.ts')
const {drawNativeGround,drawTree}=await import('../../src/render/world-ground-art.ts')
const {houseWallTile,drawRoof,HOUSE_STYLES,drawLibraryExterior}=await import('../../src/render/house-exterior-art.ts')
const {drawHillMapTile}=await import('../../src/render/hill-map-art.ts')
const {bench}=await import('../../src/render/bond-decor-art.ts')
const {spriteRows,writerPalette}=await import('../../src/render/sprites.ts')
const x0=9*16,y0=7*16,W=13*16,H=10*16,S=3
const before=JSON.stringify(MAP),at=(x,y)=>MAP[y]?.[x]??'T'
for(let kind=4;kind<=4;kind++){
 const out=new Uint8Array(W*H*S*S*4)
 const p=(x,y,c,w=1,h=1)=>{let rgb,alpha=1;if(c.startsWith('rgba')){const v=c.match(/[\d.]+/g).map(Number);rgb=v.slice(0,3);alpha=v[3]}else rgb=c.slice(1).match(/../g).map(v=>parseInt(v,16));x=Math.round(x-x0);y=Math.round(y-y0);for(let yy=Math.max(0,y);yy<Math.min(H,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(W,x+w);xx++)for(let sy=0;sy<S;sy++)for(let sx=0;sx<S;sx++){const k=(((yy*S+sy)*W*S)+xx*S+sx)*4;for(let i=0;i<3;i++)out[k+i]=Math.round(rgb[i]*alpha+out[k+i]*(1-alpha));out[k+3]=255}}
 const g={fillStyle:'#000000',fillRect(x,y,w,h){p(x,y,this.fillStyle,w,h)}}
 for(let y=6;y<18;y++)for(let x=8;x<23;x++)drawNativeGround(g,at(x,y),x,y,'spring',at,40)
 const tuft=(x,y)=>{p(x,y,'#7da65d',1,3);p(x-1,y+1,'#96b778',3,1)}
 const flower=(x,y,c)=>{p(x+1,y+2,'#749752',1,3);p(x,y,c,3,2);p(x+1,y+1,'#dfbe6d',1,1)}
 if(kind&&kind!==4){
  // Proposed height is decoration on existing grass only, never a new map obstruction.
  for(let x=11*16;x<18*16;x++){
   const u=(x-11*16)/(7*16),rise=Math.round(Math.sin(u*Math.PI)*5)
   const edge=12*16+8-rise
   const opening=x>=14*16+1&&x<14*16+14
   if(kind===1){
    p(x,11*16+1,'#b8d29e',1,edge-11*16)
    if(!opening){p(x,edge,'#9b8b5e',1,7);p(x,edge,'#73964f',1,2);p(x,edge+6,'#b09b71',1,1);p(x,edge-2,'#c4dcaa',1,2)}
   }else if(kind===2){
    p(x,11*16+2,'#b8d29e',1,edge-11*16-1)
    if(!opening){p(x,edge,'#969787',1,8);p(x,edge,'#c4c3ab',1,2);if((x+3)%13===0)p(x,edge+2,'#7c8371',1,6);p(x,edge-2,'#8cad64',1,2)}
   }else{
    p(x,11*16+2,'#b8d29e',1,edge-11*16)
    if(!opening){p(x,edge,'#819f62',1,3);p(x,edge+3,'#a0ac7a',1,4);p(x,edge-2,'#c7dca9',1,2)}
   }
  }
  for(let i=0;i<3;i++)p(14*16+1,12*16+i*4,kind===2?'#bdb7ab':'#c6b18a',13,2)
  for(let i=0;i<25;i++){const x=11*16+3+(i*29)%106,y=11*16+4+(i*7)%13;if(Math.abs(x-(14*16+8))<12||Math.abs(x-(15*16+8))<8||Math.abs(x-(16*16+8))<8)continue;tuft(x,y);if(kind===3&&i%2===0)flower(x,y-3,['#fff5da','#f0bbca','#eed584'][i%3])}
  if(kind===2){for(const [x,y] of [[11*16+4,11*16+7],[17*16+7,11*16+8]]){p(x,y,'#8f9582',7,4);p(x+1,y-2,'#c2c4ad',5,3)}}
 }
 if(kind===4)for(let y=6;y<18;y++)for(let x=8;x<23;x++)drawHillMapTile(g,x,y,'spring',at(x,y))
 // Same world objects, positions, original house roofs and mailbox in every variant.
 for(let y=6;y<18;y++)for(let x=8;x<23;x++){
  const ch=at(x,y),house=HOUSES.find(h=>x>=h.x0&&x<=h.x1&&y>=h.y0&&y<=h.y1)
  if(house&&['#','D','S','L'].includes(ch))houseWallTile(g,x,y,ch,house.id,house)
  if(ch==='T')drawTree(g,x,y,'spring',treeKind(x,y))
  if(ch==='B')bench(g,{x,y})
  if(ch==='l'){p(x*16+2,y*16+3,'#aa8759',12,10);for(let i=0;i<3;i++){p(x*16+3+i*4,y*16+3,'#708b48',2,7);p(x*16+2+i*4,y*16+4,'#8db15c',4,2)}}
 }
 for(const h of HOUSES){if(h.id==='library')drawLibraryExterior(g,h);else drawRoof(g,h.x0,h.y0,h.x1,h.y1-2,(HOUSE_STYLES[h.id]??HOUSE_STYLES.child).roof)}
 // Existing hill mailbox (15,11), drawn with its native palette and proportions.
 const bx=15*16,by=11*16;p(bx+7,by+9,'#917c65',2,5);p(bx+4,by+4,'#c3b29a',8,6);p(bx+3,by+3,'#a6947c',10,2);p(bx+5,by+1,'#a6947c',6,2);p(bx+5,by+6,'#7f6d5a',6,2);p(bx+6,by+5,'#fbf1dc',4,2)
 const rows=spriteRows('writer','up',{frame:0,blink:false}),pal=writerPalette('spring')
 rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c!=='.'&&pal[c])p(14*16+3+x,12*16+15-rows.length+y,pal[c])}))
 png(`artifacts/scenery/map-hill-applied.png`,W*S,H*S,out)
}
if(JSON.stringify(MAP)!==before)throw Error('Map was mutated')
