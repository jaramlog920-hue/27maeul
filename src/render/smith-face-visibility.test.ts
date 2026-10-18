import {drawSmithEvent,SMITH_EVENT_IDS} from './smith-events-art'
import {spriteRows,writerPalette} from './sprites'
import {withLookDefaults} from '../engine/avatar'
const npc={avatar:withLookDefaults({name:'브루노',look:'m',top:3}),who:'writer' as const}
const cases=SMITH_EVENT_IDS.filter(id=>id.startsWith("ev:smith:")&&!id.endsWith("earlyClose"))
it.each(cases.flatMap(id=>[null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})].flatMap(avatar=>[undefined,0,1,2].flatMap(choice=>[180,170,480,693].map(height=>({id,avatar,choice,height}))))))('$id 선택 $choice에서 기본/실제 외형의 얼굴을 소품이 덮지 않는다',({id,avatar,choice,height})=>{
 const w=320,h=height,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const others=[{...npc,avatar:withLookDefaults({name:"아서",look:"m",top:2})},{...npc,avatar:withLookDefaults({name:"틸리",look:"f",top:4})}]
 drawSmithEvent(g,id,w,h,8,avatar,npc,others,3,choice)
 const foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6)+14
 for(const [x,av,facing] of [[160-100,avatar,'right'],[160-75,npc.avatar,'right'],[235,others[0].avatar,'left'],[261,others[1].avatar,'left']] as const){
  const rows=spriteRows('writer',facing,{frame:0,blink:false,avatar:av??undefined,pose:'stand'}),palette=writerPalette('spring',av??undefined)
  for(let y=0;y<Math.min(8,rows.length);y++)for(let xx=0;xx<rows[y].length;xx++){
   const c=rows[y][xx];if(!['h','k','s','o','+','1'].includes(c)||!palette[c])continue
   expect(pixels.get(`${x+xx*2},${foot-rows.length*2+y*2}`),`${id} ${facing} ${x+xx*2},${foot-rows.length*2+y*2} glyph=${c}`).toBe(palette[c])
  }
  const torso=rows.flatMap((row,yy)=>yy<8?[]:[...row].flatMap((c,xx)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!palette[c]?[]:[{xx,yy,c}]))
  expect(torso.length).toBeGreaterThan(0)
  const visible=torso.filter(({xx,yy,c})=>pixels.get(`${x+xx*2},${foot-rows.length*2+yy*2}`)===palette[c]).length
  expect(visible/torso.length,`${id} 몸통·팔·발 가림`).toBeGreaterThanOrEqual(.8)

 }
})
