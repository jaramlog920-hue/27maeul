import {drawSmithWork,SMITH_WORK_IDS,smithWorkPeople} from './smith-work-art'
import {SCENES} from '../content/text'
import {spriteRows,writerPalette} from './sprites'
import {withLookDefaults} from '../engine/avatar'
const npc={avatar:withLookDefaults({name:'실제 이웃',look:'m',top:3}),who:'writer' as const}
const frames=SMITH_WORK_IDS.flatMap(id=>[...SCENES[id].lines.map((_,beat)=>({id,beat,choice:undefined as number|undefined})),...(SCENES[id].choices??[]).flatMap((c,choice)=>c.reply.map((_,reply)=>({id,beat:SCENES[id].lines.length+reply,choice})))])
it.each(frames.flatMap(v=>[null,withLookDefaults({name:'기록자',look:'f',skin:3,top:6})].flatMap(avatar=>[170,180,480,693].map(height=>({...v,avatar,height})))))('$id 대사 $beat 선택 $choice에서 얼굴·몸통·팔을 가리지 않는다',({id,beat,choice,avatar,height})=>{
 const pixels=new Map<string,string>(),g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,a:number,b:number){for(let yy=y;yy<y+b;yy++)for(let xx=x;xx<x+a;xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const others=smithWorkPeople(id).slice(1).map(name=>({...npc,avatar:withLookDefaults({name,look:'f',top:5})}))
 drawSmithWork(g,id,320,height,8,avatar,npc,others,beat,choice)
 const ground=Math.round(height>320?height*.66:height<=170?height*.69:height*.6)+8
 type Cast=[number,typeof avatar,'left'|'right',boolean]
 let cast:Cast[]=[[75,avatar,'right',false],[215,npc.avatar,'left',false]]
 if(id==='ev:smith:small:earlyClose')cast=[[75,avatar,'right',choice===0],[215,npc.avatar,'left',beat>=1]]
 else if(id==='ev:tilly:love:2'&&choice===0)cast.push([240,others[0].avatar,'left',false])
 else if(id==='ev:tilly:tongs')cast=[[125,avatar,'right',false],[201,npc.avatar,'left',false]]
 else if(id==='ev:tilly:busy')cast=choice===0&&beat>=4?[[125,avatar,'right',false],[162,npc.avatar,'right',false]]:[[choice===0&&beat===3?58:75,avatar,'right',false],[201,npc.avatar,'right',false]]
 for(const [x,av,facing,seated] of cast){
  const rows=spriteRows('writer',facing,{frame:0,blink:false,avatar:av??undefined,pose:seated?'crouch':'stand'}),palette=writerPalette('spring',av??undefined)
  for(let yy=0;yy<8;yy++)for(let xx=0;xx<rows[yy].length;xx++){const c=rows[yy][xx];if(['h','k','s','o','+','1'].includes(c)&&palette[c]&&!(id==='ev:tilly:tongs'&&beat>=1&&x===201&&['s','+'].includes(c))&&!(id==='ev:tilly:love:2'&&choice===0&&x===240&&c==='+'))expect(pixels.get(`${x+xx*2},${ground-rows.length*2+yy*2}`),`${id} 얼굴 ${x},${yy}`).toBe(palette[c])}
  const torso=rows.flatMap((r,yy)=>yy<8?[]:[...r].flatMap((c,xx)=>c==='.'||['s','h','k','o','+','1'].includes(c)||!palette[c]?[]:[{xx,yy,c}]))
  const visible=torso.filter(({xx,yy,c})=>pixels.get(`${x+xx*2},${ground-rows.length*2+yy*2}`)===palette[c]).length
  expect(visible/torso.length,`${id} 몸통·팔·발 ${x}`).toBeGreaterThanOrEqual(.8)
 }
})
