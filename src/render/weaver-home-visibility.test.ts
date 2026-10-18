import {drawWeaverHome,WEAVER_HOME_IDS} from './weaver-home-art'
import {spriteRows,writerPalette} from './sprites'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import neighbors from '../content/neighbors.json'
import {SCENES} from '../content/text'
const n=neighbors.find(n=>n.id==='penelope')!,npc={avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:'writer' as const}
const frames=WEAVER_HOME_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,reply)=>({id,choice,beat:SCENES[id].lines.length+reply})))])
it.each(frames.flatMap(frame=>[null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})].flatMap(avatar=>[170,180,480,693].map(h=>({...frame,avatar,h})))))('$id 대사 $beat 선택 $choice 높이 $h: 얼굴·어깨·몸통과 짧은 팔 보존',({id,beat,choice,avatar,h})=>{
 const pixels=new Map<string,string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const foot=Math.round(h>320?h*.56:h<=170?h*.69:h*.6)+8
 drawWeaverHome(g,id,320,h,8,avatar,npc,beat,choice)
 for(const a of [{x:75,av:avatar,face:'right' as const,seat:false},{x:215,av:npc.avatar,face:'left' as const,seat:false}]){
  const full=a.av?withLookDefaults(a.av):undefined,rows=spriteRows('writer',a.face,{frame:0,blink:false,avatar:full,pose:a.seat?'crouch':'stand'}),pal=writerPalette('spring',full)
  for(let y=0;y<8;y++)for(let x=0;x<rows[y].length;x++){const c=rows[y][x];if(!['h','k','s','o','+','1'].includes(c)||!pal[c])continue;expect(pixels.get(`${a.x+x*2},${foot-rows.length*2+y*2}`),`${id} face ${c}`).toBe(pal[c])}
  const torso=rows.flatMap((r,y)=>y<8?[]:[...r].flatMap((c,x)=>c==='.'||['h','k','s','o','+','1'].includes(c)||!pal[c]?[]:[{x,y,c}]))
  const visible=torso.filter(({x,y,c})=>pixels.get(`${a.x+x*2},${foot-rows.length*2+y*2}`)===pal[c]).length/torso.length
  // The lap cloth can naturally cover knees, while the shoulders and short arms stay free.
  expect(visible).toBeGreaterThanOrEqual(.8)
 }
})
