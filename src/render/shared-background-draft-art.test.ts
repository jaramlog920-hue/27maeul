import plan from '../../docs/event-art-remaining-138-plan.json'
import {SCENES} from '../content/text'
import {REQUESTS} from '../engine/bonds'
import {withLookDefaults} from '../engine/avatar'
import {storyLocationContext} from './story-location-context'
import {SHARED_BACKGROUND_DRAFT_IDS,sharedBackgroundDraftPeople,drawSharedBackgroundDraft} from './shared-background-draft-art'
import {SHARED_CONVERSATION_IDS,sharedConversationFrame,drawSharedConversationForeground} from './shared-conversation-art'
import {SHARED_RETURN_WALK_IDS,sharedReturnWalkFrame} from './shared-return-walk-art'
import {spriteRows,writerPalette} from './sprites'
import {drawSharedSpecial} from './shared-special-art'

const avatar=withLookDefaults({name:'현재 기록자',look:'f',skin:3,top:6,hairFront:8}),npc={avatar:withLookDefaults({name:'현재 세대',look:'m',skin:2,top:5}),who:'writer' as const}
function canvas(){
 const rects:{color:string;x:number;y:number;w:number;h:number}[]=[]
 const g={fillStyle:'',fillRect(this:{fillStyle:string},x:number,y:number,w:number,h:number){rects.push({color:this.fillStyle,x,y,w,h})}} as CanvasRenderingContext2D
 return {g,rects}
}
it('covers exactly the entire active 118-event background batch without splitting off a small completion unit',()=>{
 expect(SHARED_BACKGROUND_DRAFT_IDS).toHaveLength(118)
 expect(new Set(SHARED_BACKGROUND_DRAFT_IDS).size).toBe(118)
 expect([...SHARED_BACKGROUND_DRAFT_IDS].sort()).toEqual([...plan.productionBatches[0].entries].sort())
})
it.each(SHARED_BACKGROUND_DRAFT_IDS)('%s keeps original speaking actors and renders every original phase without mutating preview state',id=>{
 const scene=SCENES[id],people=sharedBackgroundDraftPeople(id),original=JSON.stringify(scene)
 expect(scene).toBeDefined()
 expect(people).toEqual([...new Set(scene.lines.map(l=>l.speaker).filter(s=>s!=='narration'&&s!=='player'))])
 for(const [w,h] of [[320,180],[320,693],[320,120]])for(let beat=0;beat<scene.lines.length;beat++)for(const t of [0,.6,8]){
  const c=storyLocationContext(),before=JSON.stringify(c),{g,rects}=canvas()
  expect(drawSharedBackgroundDraft(g,id,w,h,t,avatar,npc,beat,c)).toBe(true)
  expect(rects.length).toBeGreaterThan(50)
  expect(rects.every(r=>[r.x,r.y,r.w,r.h].every(Number.isFinite))).toBe(true)
  expect(JSON.stringify(c)).toBe(before)
 }
 expect(JSON.stringify(scene)).toBe(original)
})
it('does not alter request materials, rewards, unlocks or original future invitation text',()=>{
 const before=JSON.stringify(REQUESTS)
 for(const r of REQUESTS){expect(sharedConversationFrame(`ask:${r.id}`,320,1,.4)?.gesture).toBe('count');expect(sharedBackgroundDraftPeople(`ask:${r.id}`)).toEqual([r.npc])}
 expect(JSON.stringify(REQUESTS)).toBe(before)
 for(const id of ['invite:grandpa','invite:child','invite:baker'])expect(SCENES[id].lines.at(-1)?.text).toContain('여섯 시부터 여덟 시 반')
})
it.each(SHARED_CONVERSATION_IDS)('%s keeps native face, body, short hands and feet visible in all original phases',id=>{
 for(const av of [null,avatar])for(let beat=0;beat<SCENES[id].lines.length;beat++)for(const t of [0,.4,.9,8]){
  const frame=sharedConversationFrame(id,320,beat,t)!,{g,rects}=canvas()
  drawSharedConversationForeground(g,id,320,108,t,beat,av,npc)
  const pixels=new Map<string,string>()
  for(const r of rects)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)pixels.set(`${x},${y}`,r.color)
  const occupied=new Set<string>()
  for(const [actor,f] of [[{avatar:av},frame.player],[npc,frame.npc]] as const){
   const look=actor.avatar?withLookDefaults(actor.avatar):undefined,pal=writerPalette('spring',look),rows=spriteRows('writer',f.facing,{avatar:look,pose:f.pose,frame:f.walk?(Math.floor(t*3)%2?1:2):0,blink:false})
   rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'&&pal[ch])for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
    const pos=`${f.x+x*2+dx},${108-rows.length*2+y*2+dy}`
    expect(occupied.has(pos)).toBe(false);expect(pixels.get(pos)).toBe(pal[ch]);occupied.add(pos)
   }}))
  }
 }
})
it.each(SHARED_RETURN_WALK_IDS)('%s follows all four original return lines with grounded independent walking',id=>{
 expect(SCENES[id].lines).toHaveLength(4)
 expect(sharedBackgroundDraftPeople(id)).toEqual([id.split(':')[1]])
 for(let beat=0;beat<4;beat++)for(const t of [0,.6,1.6,8]){
  const f=sharedReturnWalkFrame(320,beat,t)
  expect(f.npc.x-f.player.x).toBeGreaterThanOrEqual(40)
  if(beat===1||beat===2){expect(f.player.facing).toBe('right');expect(f.npc.facing).toBe('left');expect(f.player.walk||f.npc.walk).toBe(false)}
  if(beat===3){expect(f.player.facing).toBe('right');expect(f.npc.facing).toBe('right');expect(f.player.walk).toBe(f.npc.walk)}
 }
 expect(sharedReturnWalkFrame(320,0,.9).npc.x).toBe(sharedReturnWalkFrame(320,0,8).npc.x)
})
it.each([null,avatar])('wraps only the player torso without covering head, hands, outline or feet',av=>{
 const {g,rects}=canvas(),look=av?withLookDefaults(av):undefined,rows=spriteRows('writer','down',{avatar:look,pose:'stand',frame:0,blink:false}),pal=writerPalette('spring',look)
 drawSharedSpecial(g,'blanket',320,180,8,av)
 const pixels=new Map<string,string>()
 for(const r of rects)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++)pixels.set(`${x},${y}`,r.color)
 rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.'&&pal[ch]&&(y<rows.length-9||y>=rows.length-4||x<3||x>6||'ks!5'.includes(ch)))expect(pixels.get(`${150+x*2},${108-rows.length*2+y*2}`)).toBe(pal[ch])}))
})
