import {describe,it,expect} from 'vitest'
import {CONTENT} from '../../../src/content/catalog'
import {legacyGame} from '../../../src/engine/growth-test-support'
import {goToSleep,lookOf,dressUp,canGiveBouquet,giveBouquet,neighborDoor,tick,type GameState} from '../../../src/engine/game'
import {withLookDefaults} from '../../../src/engine/avatar'
import {newChild,kidMailFor,childStage} from '../../../src/engine/child'
import {newGenState,BAKER_BABY_ID,canPair,relationId,type GenPerson} from '../../../src/engine/gen'
import {settleGrowth,slotPerson} from '../../../src/engine/gen-growth'
import {companionsOf} from '../../../src/engine/gen-looks'
import {marry,consultFor,settleMarriage,weddingTodayOf} from '../../../src/engine/gen-marriage'
import {homeOfFor} from '../../../src/engine/gen-settle'
import {settleBirth} from '../../../src/engine/gen-birth'
import {familyMorning,childBirthday} from '../../../src/engine/family-days'
import {selectKid,swapKid} from '../../../src/engine/siblings'
import {serialize,deserialize} from '../../../src/engine/save'
import {familyHomes,giveFamilyHome,livesInNewland,familyMoveMorning,sharedHomeOf} from '../../../src/engine/gen-homes'
import {demolishBuild,type Build} from '../../../src/engine/newland-build'
import {playRound,roundGuests,wantOf,roundDone} from '../../../src/engine/club-round'
import {doFestivalRole} from '../../../src/engine/fest'
import {FIRE} from '../../../src/engine/neighbors'
import {ROOMS} from '../../../src/engine/world'
import {scheduledEvents} from '../../../src/engine/events'
import {lodgingChildren,LODGING_CHILD_SEATS} from '../../../src/engine/lodging'
import {useGame} from '../../../src/store/game-store'
import {availability,scheduleAppt,advancePlans,appointmentSpots} from '../../../src/engine/plans'
import {peopleData} from '../../../src/engine/people'
import {festivalOf,isMarketDay} from '../../../src/engine/calendar'
const base=():GameState=>({...legacyGame(CONTENT),clock:{day:300,minute:600},scenes:[]})
const person=(id:string,parents:string[],look:'m'|'f'):GenPerson=>({id,origin:'born',born:100,stage:'adult',look,name:id,parents,spouse:null,household:null})
const inherited=()=>{
 const g=newGenState(CONTENT,17,300)
 return {...g,persons:{...g.persons,'g-0001':person('g-0001',['cosmo'],'f'),'g-0002':person('g-0002',['poppy'],'m')},retired:{cosmo:{heir:'g-0001',day:250},poppy:{heir:'g-0002',day:250}}}
}
describe('round2 current social boundary checks',()=>{
 it('known remains: inherited spouse wardrobe edits original resident instead of current person',()=>{
  const g=inherited();g.persons['g-0001']={...g.persons['g-0001'],name:'이어받은 딸',avatar:{skin:5,hairFront:9,top:7}}
  const s={...base(),avatar:withLookDefaults({look:'m',name:'검사'}),gen:g,romance:{partner:'cosmo',stage:'married' as const,since:270,weddingDay:null,marriedDay:280}}
  const loaded=lookOf(s,'spouse',CONTENT)!
  expect(loaded.look).toBe('m');expect(loaded.name).not.toBe('이어받은 딸')
  const dressed=dressUp(s,'spouse',withLookDefaults({...loaded,top:8}),CONTENT)
  expect(dressed.looks?.cosmo.top).toBe(8);expect(dressed.gen!.persons['g-0001'].avatar!.top).toBe(7)
 })
 it('fixed baker duplicate: real growth pipeline yields one apprentice and no duplicate retired heir',()=>{
  let g=newGenState(CONTENT,1,91);g=settleGrowth(g,92)
  expect(g.heirs!.baker.heir).toBe(BAKER_BABY_ID)
  expect(companionsOf(g,'baker',92).filter(c=>c.person.id===BAKER_BABY_ID)).toHaveLength(1)
  g=settleGrowth(g,132)
  expect(slotPerson(g,'baker')).toBe(BAKER_BABY_ID)
  expect(companionsOf(g,'baker',132).filter(c=>c.person.id===BAKER_BABY_ID)).toHaveLength(0)
  expect(companionsOf(g,'baker',132).map(c=>c.person.id)).toEqual(['baker'])
 })
 it('birthday repro: an unselected sibling birthday is skipped by the actual sleep pipeline',()=>{
  const b=base()
  const born=Array.from({length:80},(_,i)=>i+30).find(n=>!kidMailFor({born:n,left:false},n+160)&&!kidMailFor({born:n-20,left:false},n+160))!
  expect(born).toBeDefined()
  const older={...newChild(born-20,b.stats,'hand'),name:'큰아이',job:'cook' as const,jobConfirmed:true,left:false,inherited:30,mode:'home' as const}
  const birthday={...newChild(born,b.stats,'hand'),name:'생일아이',job:'cook' as const,jobConfirmed:true,left:false,inherited:30,mode:'home' as const,kidFlags:{childWalked:1,childHelping:1}}
  const s={...b,clock:{day:born+159,minute:1320},child:older,siblings:[birthday],flags:{...b.flags,childWalked:1,childHelping:1},scenes:[]}
  expect(childBirthday(birthday,born+160)).toBe(true)
  const missed=goToSleep(s,CONTENT)
  expect(missed.child!.born).toBe(older.born)
  expect(missed.scenes).not.toContain('fam:bdayChild')
  const selected=goToSleep(selectKid(s,born),CONTENT)
  expect(selected.scenes).toContain('fam:bdayChild')
  expect(familyMorning({...s,clock:{day:born+160,minute:360}}).scenes).not.toContain('fam:bdayChild')
 })
 it('siblings keep independent wardrobe flags and jobs through two swaps and actual save roundtrip',()=>{
  const b=base(),a={...newChild(1,b.stats,'hand'),name:'A',job:'cook' as const,jobConfirmed:true,left:false},z={...newChild(20,b.stats,'luck'),name:'B',job:'herbalist' as const,jobConfirmed:false,left:false,kidFlags:{kidActs:1,kidActDay:300,childLetter:200},wardrobe:{look:'f',name:'B',top:7}}
  const s={...b,child:a,siblings:[z],flags:{...b.flags,kidActs:2,kidActDay:300,childLetter:180},looks:{child:withLookDefaults({look:'m',name:'A',top:5})}}
  const once=swapKid(s,0);expect(once.flags.kidActs).toBe(1);expect(once.child!.job).toBe('herbalist');expect(once.looks!.child.top).toBe(7)
  const loaded=deserialize(serialize(once),CONTENT)!
  const twice=swapKid(loaded,0);expect(twice.flags.kidActs).toBe(2);expect(twice.child!.name).toBe('A');expect(twice.child!.job).toBe('cook');expect(twice.looks!.child.top).toBe(5)
 })
 it('sibling lodging repro: two children can move into four rooms already shared with three generated adults',()=>{
  localStorage.clear();const b=base();let g=newGenState(CONTENT,23,90)
  for(const [a,z] of [['cosmo','poppy'],['rudy','penelope'],['basil','juniper']]){
   const r={id:relationId(a,z),a,b:z,stage:'preparing' as const,since:80,prep:{tasks:[],done:[],wedding:90}}
   g=marry(g,r,90,homeOfFor(CONTENT,g));const hid=g.persons[a].household!
   g={...g,households:{...g.households,[hid]:{...g.households[hid],birthDue:100}}}
  }
  g=settleBirth(g,100,{partner:null,busy:()=>false});g=settleGrowth(g,300)
  expect(Object.values(g.persons).filter(p=>p.origin==='born'&&p.stage==='adult')).toHaveLength(3)
  const older={...newChild(1,b.stats,'hand'),name:'큰아이',job:'cook' as const,jobConfirmed:true,left:false}
  const younger={...newChild(20,b.stats,'hand'),name:'작은아이',job:'cook' as const,jobConfirmed:true,left:false}
  useGame.setState({game:{...b,gen:g,child:older,siblings:[younger]},modal:null,toast:null})
  expect(lodgingChildren(useGame.getState().game)).toHaveLength(3)
  useGame.getState().setChildResidence('lodging')
  expect(lodgingChildren(useGame.getState().game)).toHaveLength(4)
  useGame.getState().selectKid(20)
  expect(lodgingChildren(useGame.getState().game)).toHaveLength(3)
  useGame.getState().setChildResidence('lodging')
  const s=useGame.getState().game
  expect(s.child).toMatchObject({name:'작은아이',left:true});expect(s.flags['lodging:playerChild']).toBe(1)
  expect(s.siblings![0]).toMatchObject({name:'큰아이',left:true,kidFlags:{'lodging:playerChild':1}})
  const residents=lodgingChildren(s);expect(residents).toHaveLength(LODGING_CHILD_SEATS.length)
  expect(residents.map(x=>x.name)).not.toContain('큰아이')
  // Five saved adult residents request four rooms, but only the selected child is counted.
  expect(3+1+s.siblings!.filter(x=>x.left&&x.kidFlags?.['lodging:playerChild']).length).toBe(5)
 })
 it('inherited unrelated adults may marry, remain reciprocal, inherit a real home and produce one child only',()=>{
  let g=inherited();const [a,b]=['g-0001','g-0002'];expect(canPair(g,null,a,b)).toBe(true)
  const r={id:relationId(a,b),a,b,stage:'preparing' as const,since:280,prep:{tasks:[],done:[],wedding:299}}
  g={...g,relations:{[r.id]:r}};g=marry(g,r,299,homeOfFor(CONTENT,g))
  expect(g.persons[a].spouse).toBe(b);expect(g.persons[b].spouse).toBe(a)
  const hid=g.persons[a].household!;expect(g.households[hid].home.startsWith('g-')).toBe(false)
  expect(canPair(g,null,a,'cosmo')).toBe(false)
  g={...g,households:{...g.households,[hid]:{...g.households[hid],birthDue:327}}}
  const ctx={partner:null,busy:()=>false};g=settleBirth(g,327,ctx);const next=g.nextPerson
  expect(g.households[hid].children).toHaveLength(1);g=settleBirth(g,500,ctx);expect(g.nextPerson).toBe(next)
 })
 it('inherited married pair repro: shared household is real but spouse slot still returns original parent home door',()=>{
  let g=inherited();const [a,b]=['g-0001','g-0002'];const r={id:relationId(a,b),a,b,stage:'preparing' as const,since:280,prep:{tasks:[],done:[],wedding:299}}
  g={...g,relations:{[r.id]:r}};g=marry(g,r,299,homeOfFor(CONTENT,g))
  const h=g.households[g.persons[b].household!]!;const hasRoom=(id:string)=>ROOMS.some(x=>x.owner===id)
  expect(h.home).toBe('fisher');expect(sharedHomeOf(g,b,hasRoom)).toBe('fisher')
  const d=CONTENT.neighbors.find(x=>x.id==='poppy')!,shared=ROOMS.find(x=>x.owner==='fisher')!
  expect(neighborDoor({...base(),gen:g},d)).toEqual(d.door)
  expect(neighborDoor({...base(),gen:g},d)).not.toEqual(shared.door)
 })
 it('heir consultation uses visible slot hearts and player dating releases preparing NPC relationship immediately',()=>{
  let g=inherited();const [a,b]=['g-0001','g-0002'],rid=relationId(a,b)
  g={...g,relations:{[rid]:{id:rid,a,b,stage:'lover',since:250,consult:{asked:[],answers:[],nextAsk:300}}}}
  expect(consultFor(g,a,{cosmo:10,poppy:30},300)).toBeNull();expect(consultFor(g,b,{cosmo:10,poppy:30},300)?.id).toBe(rid)
  g={...g,relations:{[rid]:{id:rid,a,b,stage:'preparing',since:290,prep:{tasks:['bread'],done:[],wedding:301}}}}
  const s={...base(),avatar:withLookDefaults({look:'m',name:'검사'}),gen:g,hearts:{cosmo:90},inv:{bouquet:1}}
  const def=CONTENT.neighbors.find(n=>n.id==='cosmo')!;expect(canGiveBouquet(s,def)).toBeNull()
  const dating=giveBouquet(s,def);expect(dating.romance.stage).toBe('dating');expect(dating.gen!.relations[rid]).toBeUndefined()
 })
 it('calendar heir wedding names repro: NPC couple names are empty and player wedding names original parent',()=>{
  let g=inherited();g.persons['g-0001']={...g.persons['g-0001'],name:'새봄'};g.persons['g-0002']={...g.persons['g-0002'],name:'하늘'}
  const a='g-0001',b='g-0002',rid=relationId(a,b);g={...g,relations:{[rid]:{id:rid,a,b,stage:'preparing',since:294,prep:{tasks:['bread'],done:[],wedding:301}}}}
  const s={...base(),gen:g};const wedding=scheduledEvents(s,CONTENT).find(e=>e.id.includes('genWedding'))!
  expect(wedding).toBeDefined();expect(wedding.title).not.toContain('새봄');expect(wedding.title).not.toContain('하늘')
  const own=scheduledEvents({...s,romance:{partner:'cosmo',stage:'engaged',since:280,weddingDay:301,marriedDay:null}},CONTENT).find(e=>e.id.endsWith(':wedding'))!
  expect(own.title).toContain(CONTENT.neighbors.find(n=>n.id==='cosmo')!.role);expect(own.title).not.toContain('새봄')
 })
 it('NPC wedding appointment conflict repro: real prepared wedding participants may be booked for another evening event',()=>{
  let g=inherited();const a='g-0001',b='g-0002',rid=relationId(a,b)
  g={...g,relations:{[rid]:{id:rid,a,b,stage:'lover',since:250,consult:{asked:[291,292,293],answers:['cheer','cheer','cheer'],nextAsk:294}}}}
  g=settleMarriage(g,295,{partner:null,busy:()=>false,weddingFree:d=>!festivalOf(d)&&!isMarketDay(d)},homeOfFor(CONTENT,g))
  const wedding=g.relations[rid].prep!.wedding;expect(wedding).toBe(302);expect(weddingTodayOf(g,wedding)?.id).toBe(rid)
  let s={...base(),gen:g,clock:{day:300,minute:600},flags:{...base().flags,villageLevel:10,...Object.fromEntries(CONTENT.neighbors.map(n=>[`movedIn:${n.id}`,1]))}}
  s={...s,life:{...s.life,seen:Object.values(peopleData().people).flatMap(p=>(p.events??[]).map(e=>e.id))}}
  expect(availability(s,'cosmo',wedding,1080,1200,CONTENT)).toBe('ok')
  const r=scheduleAppt(s,{kind:'event',day:wedding,from:1080,to:1200,place:'hallTable',members:['cosmo','poppy'],activity:'tea'},CONTENT)
  expect(r.appt).toBeDefined()
  const started=advancePlans({...r.state,clock:{day:wedding,minute:1081}},CONTENT)
  expect(started.plans.appts.find(x=>x.id===r.appt!.id)?.startedWith).toEqual(['cosmo','poppy'])
  expect(appointmentSpots(started)).toHaveProperty('cosmo');expect(appointmentSpots(started)).toHaveProperty('poppy')
  const moved=tick(started,.05,()=>0,CONTENT).state
  expect(moved.npcs.cosmo.goal).toEqual(appointmentSpots(started).cosmo)
  expect(moved.npcs.cosmo.goal).not.toEqual({x:24,y:19})
 })
 it('newland inherited household resolves slot and person identity then demolition clears old moving wish',()=>{
  let s=base();let g=inherited();const h={id:'h-0001',home:'g-0001',members:['g-0001','g-0002'],children:[],lastBirth:null,since:9}
  g={...g,households:{'h-0001':h},persons:{...g.persons,'g-0001':{...g.persons['g-0001'],household:h.id},'g-0002':{...g.persons['g-0002'],household:h.id}}}
  const home:Build={id:'b1',kind:'home',x:16,y:12,facing:'down',state:'done',orderedDay:1,paid:{coins:100,items:{}},refunded:false,slot:0}
  s={...s,gen:g,flags:{...s.flags,'familyHome:1':1,'familyHomeDay:1':10,'moveWish:1':300},newland:{builds:[home],tiles:{},nextId:2,settledDay:300}}
  expect(livesInNewland(s,'cosmo')).toBe(true);expect(livesInNewland(s,'g-0001')).toBe(true)
  s=demolishBuild(s,'b1')!;expect(familyHomes(s)).toHaveLength(0);expect(s.flags['moveWish:1']).toBeUndefined()
  const home2={...home,id:'b2'};s={...s,clock:{day:301,minute:600},newland:{...s.newland!,builds:[home2]}};s=giveFamilyHome(s,h.id,home2,()=>false)
  expect(familyHomes(familyMoveMorning({...s,clock:{day:303,minute:360}}))).toHaveLength(1)
 })
 it('festival guests lock on first round and no guest case finishes exactly once',()=>{
  const b=base();const f={id:'fest:1',kind:'festival' as const,day:20,place:'bench' as const,members:[],role:'deco' as const,reserve:{},step:'tidy' as const,joined:false,consumed:false,closed:false,cancelled:false}
  let s={...b,clock:{day:20,minute:1090},player:{...b.player,...FIRE},plans:{appts:[],nextId:1},fests:[f]}
  const guests=['baker','cosmo'];s=playRound(s,f.id,'festivalDeco',guests,wantOf('baker','festivalDeco')).state
  expect(roundGuests(s,f.id,['poppy'])).toEqual(guests)
  s=playRound(s,f.id,'festivalDeco',[],wantOf('cosmo','festivalDeco')).state;expect(roundDone(s,f.id)).toBe(true)
  const completed=doFestivalRole(s,f.id);expect(completed.fests[0].closed).toBe(true);expect(doFestivalRole(completed,f.id)).toBe(completed)
  const noNpcs=Object.fromEntries(Object.entries(b.npcs).map(([id,n])=>[id,{...n,visible:false}]))
  const empty={...b,clock:{day:20,minute:1090},player:{...b.player,...FIRE},npcs:noNpcs,plans:{appts:[],nextId:1},fests:[f]}
  expect(doFestivalRole(empty,f.id).fests[0].closed).toBe(true)
 })
})
