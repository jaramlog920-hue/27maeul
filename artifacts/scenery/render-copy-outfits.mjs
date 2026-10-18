import fs from 'node:fs'
import path from 'node:path'
import {registerHooks} from 'node:module'
import {png} from '../../scripts/pixel-png.mjs'
registerHooks({resolve(s,c,n){return n(s.startsWith('.')&&!path.extname(s)?`${s}.ts`:s,c)},load(u,c,n){return u.endsWith('.json')?{format:'module',source:`export default ${fs.readFileSync(new URL(u),'utf8')}`,shortCircuit:true}:n(u,c)}})
const {COPY_OUTFITS,copyOutfitTop}=await import('../../src/engine/copy-outfits.ts'),{withLookDefaults}=await import('../../src/engine/avatar.ts'),{spriteRows,writerPalette}=await import('../../src/render/sprites.ts')
for(const look of ['m','f']){
 const items=COPY_OUTFITS.filter(o=>o.look===look),cw=72,ch=42,W=cw*5,H=ch*4,S=2,out=new Uint8Array(W*H*S*S*4)
 const p=(x,y,c,w=1,h=1)=>{const rgb=c.slice(1).match(/../g).map(v=>parseInt(v,16));for(let yy=Math.max(0,y);yy<Math.min(H,y+h);yy++)for(let xx=Math.max(0,x);xx<Math.min(W,x+w);xx++)for(let sy=0;sy<S;sy++)for(let sx=0;sx<S;sx++)out.set([...rgb,255],(((yy*S+sy)*W*S)+xx*S+sx)*4)}
 p(0,0,'#eee5d4',W,H)
 items.forEach((o,i)=>{const x=i%5*cw,y=Math.floor(i/5)*ch,a=withLookDefaults({name:o.name,look,top:copyOutfitTop(o.id),skin:i%4,hairBack:look==='f'?i%2?3:7:0}),pal=writerPalette('spring',a)
 p(x+2,y+2,'#f9f3e7',cw-4,ch-4)
 for(const [facing,scale,dx,dy,pose] of [['down',2,9,6,'stand'],['right',1,40,9,'wave'],['up',1,56,20,'stand']]){const rows=spriteRows('writer',facing,{avatar:a,pose,blink:false,frame:0});rows.forEach((r,yy)=>[...r].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+dx+xx*scale,y+dy+yy*scale,pal[c],scale,scale)}))}
 })
 png(`artifacts/scenery/copy-outfits-${look}.png`,W*S,H*S,out)
}
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>필사 수집 의상 40종</title><style>body{background:#eee5d4;color:#40372f;font:16px sans-serif;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}article{background:#fff9ee;border-radius:12px;padding:12px;text-align:center}canvas{image-rendering:pixelated;width:140px;height:140px}h2{font-size:16px}p{line-height:1.6}</style><h1>필사 수집 의상 40종</h1><p>남녀 각20종 · 장 완성 시5% 확률 · 미보유 옷 획득 · 옷장에 영구 보관<br>이 페이지는 모양 비교용이며 저장·획득·앨범을 변경하지 않습니다.</p><main></main><script type="module">
import {COPY_OUTFITS,copyOutfitTop} from '/src/engine/copy-outfits.ts';import {withLookDefaults} from '/src/engine/avatar.ts';import {spriteRows,writerPalette} from '/src/render/sprites.ts';
const cards=COPY_OUTFITS.map(o=>{const el=document.createElement('article'),c=document.createElement('canvas');c.width=40;c.height=40;const h=document.createElement('h2');h.textContent=o.name;const p=document.createElement('p');p.textContent=(o.look==='m'?'남성':'여성')+' · '+o.theme+' 테마';el.append(c,h,p);document.querySelector('main').append(el);return {o,c,a:withLookDefaults({name:'기록자',look:o.look,top:copyOutfitTop(o.id),hairBack:o.look==='f'?3:0})}});
function frame(ms){for(const {o,c,a} of cards){const g=c.getContext('2d');g.clearRect(0,0,40,40);const facing=['down','right','up','left'][Math.floor(ms/1700)%4],pose=Math.floor(ms/800)%3===1?'wave':'stand',rows=spriteRows('writer',facing,{avatar:a,frame:Math.floor(ms/260)%2?1:2,pose}),pal=writerPalette('spring',a);rows.forEach((r,y)=>[...r].forEach((v,x)=>{if(v!=='.'&&pal[v]){g.fillStyle=pal[v];g.fillRect(10+x*2,5+y*2,2,2)}}))}requestAnimationFrame(frame)}requestAnimationFrame(frame);
</script></html>`
fs.writeFileSync('artifacts/scenery/copy-outfits.html',html)
