import {it,vi} from 'vitest'
import {writeFileSync} from 'node:fs'
import {performance} from 'node:perf_hooks'
import {CONTENT} from '../../src/content/catalog'
import {establishedGame} from '../../src/engine/growth-test-support'
import {settle} from '../../src/engine/game'
import {weatherOf} from '../../src/engine/calendar'
import {createRenderer} from '../../src/render/renderer'
it('목장 날씨별 렌더링 JS 비용 조사',()=>{
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320
 let calls=0
 const ctx=new Proxy({canvas,imageSmoothingEnabled:false},{get(o,k){if(k in o)return (o as any)[k];if(k==='measureText')return ()=>({width:10});if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});if(k==='getImageData')return (_x:number,_y:number,w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)});return ()=>{calls++}},set(o,k,v){(o as any)[k]=v;return true}}) as unknown as CanvasRenderingContext2D
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx)
 const renderer=createRenderer(ctx,CONTENT),rows=[]
 let t=100
 for(const day of [1,3])for(const player of [{x:5,y:27},{x:5,y:29},{x:10,y:30},{x:20,y:20}]){
  let game=establishedGame(CONTENT,14)
  game=settle({...game,scenes:[],clock:{day,minute:720},player:{...game.player,...player,path:[]}},CONTENT)
  for(let i=0;i<5;i++)renderer.draw(game,t+=.016,.016)
  const times=[];calls=0
  for(let i=0;i<30;i++){const start=performance.now();renderer.draw(game,t+=.016,.016);times.push(performance.now()-start)}
  rows.push({weather:weatherOf(day),player,meanMs:times.reduce((a,b)=>a+b,0)/times.length,maxMs:Math.max(...times),canvasCalls:calls})
 }
 vi.restoreAllMocks()
 writeFileSync('artifacts/scenery/pasture-render-profile.json',JSON.stringify(rows,null,2))
},120000)
