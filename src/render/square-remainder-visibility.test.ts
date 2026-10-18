import {SQUARE_REMAINDER_IDS,squareRemainderPeople} from './square-remainder-art'
import {drawSquareEvent,squareEventPeople} from './square-events-art'
import {SCENES} from '../content/text'
import neighbors from '../content/neighbors.json'
import {withLookDefaults,type Avatar} from '../engine/avatar'
import {spriteRows,writerPalette,PALETTE,type Pose} from './sprites'
import type {Facing} from '../engine/types'
import type {FinalePerson} from './library-finale-art'
const actor=(id:string,custom:boolean):FinalePerson=>{
 const n=neighbors.find(n=>n.id===id)!
 return custom?{avatar:withLookDefaults({name:'다음 세대',look:'f',skin:4,hairFront:3,hairBack:5,top:6,bottom:2}),who:'writer',short:id==='child'?1:undefined}:{avatar:withLookDefaults({name:n.role,look:n.look,...n.avatar} as Avatar),who:n.avatar?'writer':n.sprite as FinalePerson['who']}
}
const frames=SQUARE_REMAINDER_IDS.flatMap(id=>SCENES[id].lines.flatMap((_,beat)=>[0,.5,1.2,8].flatMap(t=>[170,180,480,693].flatMap(h=>[false,true].flatMap(custom=>[false,true].map(actual=>({id,beat,t,h,custom,actual})))))))
it.each(frames)('$id 행$beat h$h t$t 교체세대$custom 실제플레이어$actual: 얼굴·짧은 팔·몸통·발 보존',({id,beat,t,h,custom,actual})=>{
 const av=actual?withLookDefaults({name:'기록자',look:'f',top:7,skin:3}):null,ground=Math.round(h>320?h*.54:h<=170?h*.69:h*.6)+8,pixels=new Map<string,string>()
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,hh:number){for(let yy=Math.max(ground-60,y);yy<Math.min(ground+1,y+hh);yy++)for(let xx=Math.max(8,x);xx<Math.min(310,x+w);xx++)pixels.set(`${xx},${yy}`,this.fillStyle)}} as unknown as CanvasRenderingContext2D
 const cast=squareRemainderPeople(id).map(n=>actor(n,custom))
 drawSquareEvent(g,id,320,h,t,av,cast[0]??{avatar:null,who:'writer'},cast.slice(1),beat)
 type A={x:number,a:FinalePerson|null,face:Facing,pose?:Pose,walk?:boolean}
 let layout:A[]=[]
 if(id==='village:1')layout=[{x:108,a:null,face:beat?'down':'right',walk:beat===0}]
 if(id==='village:2')layout=[{x:111,a:null,face:beat?'down':'right'},{x:174,a:cast[0],face:'down',pose:beat?'wave':'stand'},{x:227,a:cast[1],face:'down',pose:beat?'wave':'stand'},{x:47,a:cast[2],face:beat?'down':'right',pose:beat?'wave':'stand',walk:beat===0}]
 if(id==='village:4')layout=[{x:122,a:null,face:beat?'down':'right'},...cast.map((a,i)=>({x:[54,176,224][i],a,face:'down' as const,pose:beat===0||i===1?'wave' as const:'stand' as const}))]
 if(id==='saw:bread:swap')layout=[{x:155,a:null,face:'down'},{x:beat===0?48:beat===1?216:252,a:cast[0],face:beat<2?'right':'down'},{x:beat===0?97:beat===1?262:50,a:cast[1],face:beat<2?'left':'down'}]
 for(const a of layout){
  const avatar=a.a?a.a.avatar:av,full=avatar?withLookDefaults(avatar):undefined,who=a.a?a.a.who:'writer',rows=spriteRows(who,a.face,{avatar:full,frame:a.walk?(Math.floor(t*3)%2?1:2):0,pose:a.pose??'stand',blink:false,growth:1,short:a.a?.short}),pal=who==='writer'?writerPalette('spring',full):PALETTE,top=ground-rows.length*2
  let body=0,visible=0
  rows.forEach((r,y)=>[...r].forEach((c,x)=>{
   if(c==='.'||!pal[c])return
   if(y<7||y===rows.length-1){for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)expect(pixels.get(`${a.x+x*2+xx},${top+y*2+yy}`),`${id} ${a.x} 머리/발 ${x},${y}`).toBe(pal[c])}
   if(y>=7){body++;if(pixels.get(`${a.x+x*2},${top+y*2}`)===pal[c])visible++}
  }))
  expect(visible/body,`${id} ${a.x} 몸통·팔`).toBeGreaterThanOrEqual(.85)
 }
})
it('광장 잔여 전체 네 사건이 공통 게임·미리보기 등록과 정확한 원래 인물로 연결된다',()=>{
 expect(SQUARE_REMAINDER_IDS).toHaveLength(4)
 expect(squareEventPeople('saw:bread:swap')).toEqual(['poppy','wendell'])
 expect(squareEventPeople('village:1')).toEqual([])
})
