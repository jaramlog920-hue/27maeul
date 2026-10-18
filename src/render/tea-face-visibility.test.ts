import {drawTeaEvent} from './tea-events-art'
import {spriteRows,writerPalette} from './sprites'
import {withLookDefaults} from '../engine/avatar'
const npc={avatar:withLookDefaults({name:'웬델',look:'m',top:3}),who:'writer' as const}
const cases=['ev:poppy:small:coaster','ev:poppy:story:3','ev:baker:story:4','ev:wendell:dateTea','ev:wendell:love:1','dateTea']
it.each(cases.flatMap(id=>[null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})].flatMap(avatar=>[undefined,0,1].flatMap(choice=>[180,170,480,693].map(height=>({id,avatar,choice,height}))))))('$id 선택 $choice에서 기본/실제 외형의 얼굴을 소품이 덮지 않는다',({id,avatar,choice,height})=>{
 const w=320,h=height,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 drawTeaEvent(g,id,w,h,8,avatar,npc,[],3,choice)
 const corner=id==='ev:poppy:small:coaster'||id==='ev:poppy:story:3',foot=Math.round(h>w?h*.66:h<=170?h*.69:h*.6)
 for(const [x,av,facing] of [[160+(corner?-72:-40),avatar,'right'],[160+(corner?-19:20),npc.avatar,'left']] as const){
  const rows=spriteRows('writer',facing,{frame:0,blink:false,avatar:av??undefined,pose:'crouch'}),palette=writerPalette('spring',av??undefined)
  for(let y=0;y<Math.min(8,rows.length);y++)for(let xx=0;xx<rows[y].length;xx++){
   const c=rows[y][xx];if(!['h','k','s','o','+','1'].includes(c)||!palette[c])continue
   expect(pixels.get(`${x+xx*2},${foot-rows.length*2+y*2}`),`${id} ${facing} ${x+xx*2},${foot-rows.length*2+y*2} glyph=${c}`).toBe(palette[c])
  }
 }
})
