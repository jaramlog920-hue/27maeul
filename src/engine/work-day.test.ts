import { describe, expect, it } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { T } from '../content/text'
import { newGame, finishHelp, routineOf, storyPropsNow } from './game'
import { canWorkDay, startWorkDay, prepareWorkDay, finishWorkStep, finishWorkDay, expireWorkDay, sanitizeWorkDay, shopOf, workLine, WORK_SHOPS, type WorkState } from './work-day'
import { finishNow } from './minigame'
import { deserialize, serialize } from './save'
import { grapesRipe, isWet, weatherOf } from './calendar'

function working():WorkState {
  const s=newGame(CONTENT)
  return {...s,clock:{day:2,minute:480},player:{...s.player,x:5,y:24},flags:{...s.flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))},life:{...s.life,seen:Object.values(PEOPLE.people).flatMap(p=>(p.events??[]).map(e=>e.id))},npcs:{...s.npcs,carpenter:{...s.npcs.carpenter,x:6,y:24,visible:true}}}
}
/** 그 이웃이 일하는 자리·때를 찾아 곁에 선다 (날씨·요일·일정이 맞는 첫 때) */
function ready(npc:string, ok:(day:number)=>boolean=()=>true, base:WorkState=working()):WorkState {
  for (let day=2; day<90; day++) {
    if (!ok(day)) continue
    for (let minute=360; minute<=960; minute+=30) {
      const s0={...base,clock:{day,minute}}
      const r=routineOf(s0,npc)
      if (!r) continue
      const s={...s0,player:{...s0.player,x:r.at.x,y:r.at.y+1},npcs:{...s0.npcs,[npc]:{...s0.npcs[npc],x:r.at.x,y:r.at.y,visible:true}}}
      if (canWorkDay(s,npc,CONTENT)===null) return s
    }
  }
  throw new Error(`${npc}: 일하는 때 없음`)
}
const finishHand=(s:WorkState):WorkState=>finishWorkStep({...s,workDay:{...s.workDay!,mini:finishNow(s.workDay!.mini!)}},()=>.5)
const NPCS=Object.values(WORK_SHOPS).flatMap(sh=>sh.npcs)

describe('함께 일하는 하루',()=>{
  it('근무·현장·두 시간 여유가 있을 때만 시작한다',()=>{
    const s=working()
    expect(canWorkDay(s,'carpenter',CONTENT)).toBeNull()
    expect(canWorkDay({...s,player:{...s.player,x:50,y:50}},'carpenter',CONTENT)).toBe('away')
    expect(canWorkDay({...s,clock:{day:2,minute:1200}},'carpenter',CONTENT)).toBe('late')
    expect(canWorkDay({...s,helped:['carpenter']},'carpenter',CONTENT)).toBe('done')
    // 작업장이 없는 이웃은 입구가 없다
    expect(canWorkDay(s,'beekeeper',CONTENT)).toBe('away')
  })
  it('준비·두 손일·마무리 뒤 수고비와 참여 기억을 한 번만 받는다',()=>{
    const s=working()
    let n=startWorkDay(s,'carpenter','finish',CONTENT)
    n=prepareWorkDay(n,()=>.5)
    expect(finishWorkStep(n,()=>.5)).toBe(n)
    n=finishHand(n);n=finishHand(n);n=finishWorkDay(n,'dark')
    expect(n.clock.minute-s.clock.minute).toBe(120)
    expect(n.coins-s.coins).toBe(8)
    expect(n.workDay?.choices).toEqual(['finish','dark'])
    expect(n.life.experiences['work:carpenter']).toMatchObject({with:['carpenter'],kind:'work',choice:1,item:'woodenFinishDark',count:1})
    expect(n.inv).toEqual(s.inv)
    expect(finishWorkDay(n,'light')).toBe(n)
    const carpenter=CONTENT.neighbors.find(d=>d.id==='carpenter')!
    expect(finishHelp(n,carpenter)).toBe(n)
    // 고른 마감이 작업장 앞에 며칠 남는다
    expect(storyPropsNow(n).filter(p=>p.npc==='carpenter'&&p.id.includes('Work_')).map(p=>p.art)).toEqual(['woodenFinishDark'])
    expect(storyPropsNow({...n,clock:{day:9,minute:480}}).some(p=>p.id.includes('Work_'))).toBe(false)
  })
  it('중단 저장은 끝낸 단계를 유지하고 다음 날 부분 정산 한 번 — 마음·관계는 그대로',()=>{
    const s=working()
    let n=prepareWorkDay(startWorkDay(s,'carpenter','sort',CONTENT),()=>.5)
    n=finishHand(n)
    const restored=sanitizeWorkDay(JSON.parse(JSON.stringify(n.workDay)))
    expect(restored?.step).toBe(2)
    expect(restored?.mini?.kind).toBe('hold')
    expect(deserialize(serialize(n),CONTENT)?.workDay?.step).toBe(2)
    const next=expireWorkDay({...n,workDay:restored,clock:{day:3,minute:480}})
    expect(next.coins-s.coins).toBe(2)
    expect(expireWorkDay(next)).toBe(next)
    expect(next.life.experiences['work:carpenter']).toBeUndefined()
    expect(next.hearts).toEqual(n.hearts)
    expect(next.life.cool).toEqual(n.life.cool)
  })
  it('겹치는 일정이 있으면 시작하지 않는다',()=>{
    const s=working()
    const n={...s,plans:{nextId:2,appts:[{id:'appt:1',kind:'event' as const,day:2,from:480,to:600,place:'teaTable' as const,members:['carpenter'],state:'planned' as const,rewarded:false,remembered:false}]}}
    expect(canWorkDay(n,'carpenter',CONTENT)).toBe('busy')
  })
})

describe('작업장별 함께 일하기',()=>{
  it('작업장마다 맡을 부분·손일 둘·마무리 둘, 화면 문구와 이웃 말이 있다',()=>{
    for (const [id,sh] of Object.entries(WORK_SHOPS)) {
      const tx=(T.work.shops as Record<string,{about:string;prep:Record<string,string>;hands:string[];finish:Record<string,string>;result:string}>)[id]
      expect(tx?.about,id).toBeTruthy()
      for (const p of sh.prep) expect(tx.prep[p],`${id} ${p}`).toBeTruthy()
      for (const f of sh.finish) expect(tx.finish[f],`${id} ${f}`).toBeTruthy()
      expect(tx.hands).toHaveLength(2)
      expect(sh.prep.length).toBeGreaterThanOrEqual(2)
      expect(sh.finish.length).toBeGreaterThanOrEqual(2)
      for (const npc of sh.npcs) {
        expect((T.work.jobs as Record<string,string>)[npc],npc).toBeTruthy()
        for (const at of ['start','hand','finish'] as const) expect(workLine(working(),npc,at),`${npc} ${at}`).toBeTruthy()
      }
    }
    // 여섯 손일을 모두 다시 쓴다
    const kinds=new Set(Object.values(WORK_SHOPS).flatMap(sh=>[...sh.hands(200),...sh.hands(10)]))
    expect([...kinds].sort()).toEqual(['hold','mash','order','pick','timing','weave'])
  })
  it.each(NPCS)('%s: 근무 중에 끝까지 — 수고비 한 번, 그 이웃만 기억, 가방은 그대로, 고른 결과가 흔적으로',(npc)=>{
    const s=ready(npc)
    const sh=WORK_SHOPS[shopOf(npc)!]
    let n=startWorkDay(s,npc,sh.prep[1],CONTENT)
    expect(n.workDay?.hands).toEqual(sh.hands(s.clock.day))
    n=prepareWorkDay(n,()=>.5)
    expect(n.workDay?.mini?.kind).toBe(sh.hands(s.clock.day)[0])
    n=finishHand(n)
    expect(n.workDay?.mini?.kind).toBe(sh.hands(s.clock.day)[1])
    n=finishHand(n)
    n=finishWorkDay(n,sh.finish[1])
    expect(n.coins-s.coins).toBe(8)
    expect(n.inv).toEqual(s.inv)
    const e=n.life.experiences[`work:${npc}`]
    expect(e.with).toEqual([npc])
    expect(e.item).toBe(sh.art(sh.prep[1],sh.finish[1],sh.hands(s.clock.day)))
    for (const other of NPCS.filter(x=>x!==npc)) expect(n.life.memories[other]?.some(m=>m.tag===`exp:work:${npc}`)??false).toBe(false)
    const traces=storyPropsNow(n).filter(p=>p.id.includes('Work_'))
    expect(traces.map(p=>[p.npc,p.art])).toEqual([[npc,e.item]])
    // 같은 날 다른 작업장도 수고비는 이미 받았다
    const again=NPCS.find(x=>x!==npc)!
    expect(canWorkDay({...n,npcs:{...n.npcs,[again]:{...n.npcs[again],visible:true}}},again,CONTENT)).not.toBeNull()
  })
  it('베 짜는 집은 서고 7권으로 이사 온 뒤에만 — 그 전에는 입구가 없다',()=>{
    const s=ready('weaver')
    const flags={...s.flags};delete flags['movedIn:weaver']
    expect(canWorkDay({...s,flags},'weaver',CONTENT)).toBe('away')
    const p=ready('penelope')
    const pf={...p.flags};delete pf['movedIn:weaver']
    expect(canWorkDay({...p,flags:pf},'penelope',CONTENT)).toBe('away')
  })
  it('나루는 궂은 날 쉰다',()=>{
    const s=ready('fisher')
    let wet=s.clock.day+1
    while(!isWet(weatherOf(wet))) wet++
    expect(canWorkDay({...s,clock:{...s.clock,day:wet}},'fisher',CONTENT)).toBe('weather')
  })
  it('포도원은 철에 맞는 일 — 익는 철엔 수확, 다른 때는 바구니와 덩굴',()=>{
    const ripe=ready('grandpa',d=>grapesRipe(d))
    const other=ready('grandpa',d=>!grapesRipe(d))
    expect(startWorkDay(ripe,'grandpa','look',CONTENT).workDay?.hands?.[0]).toBe('pick')
    expect(startWorkDay(other,'grandpa','look',CONTENT).workDay?.hands?.[0]).toBe('order')
    expect(WORK_SHOPS.vineyard.art('look','share',['order','weave'])).toBe('basketEmpty')
  })
  it('옛 저장의 다른 이웃 회차(손일 정보 없음)는 길게 누르기로 이어가고 맞지 않는 고름은 버린다',()=>{
    const w=sanitizeWorkDay({id:'work:grandpa:4',npc:'grandpa',day:4,startedAt:480,step:1,choices:['sort'],used:true,paid:false})
    expect(w?.choices).toEqual([])
    expect(w?.mini?.kind).toBe('hold')
    expect(sanitizeWorkDay({id:'x',npc:'beekeeper',day:4,startedAt:480,step:1,choices:[],used:true,paid:false})).toBeUndefined()
    const loaded=deserialize(serialize({...working(),workDay:undefined}),CONTENT)
    expect(loaded?.workDay).toBeUndefined()
  })
  it('연인·배우자에게는 다른 첫마디, 일은 누구나 할 수 있다',()=>{
    const s=working()
    const lover={...s,hearts:{...s.hearts,tilly:100},romance:{...s.romance,partner:'tilly',stage:'dating' as const}}
    expect(workLine(lover,'tilly','start')).toBe(PEOPLE.people.tilly.workLines?.lover)
    expect(workLine(s,'tilly','start')).toBe(PEOPLE.people.tilly.workLines?.start)
  })
})
