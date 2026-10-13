import {CONTENT} from '../content/catalog'
import {newGame,greetNeighbor,tick} from './game'
import {scheduledEvents} from './events'
import {deserialize,serialize} from './save'
import {SCENES,ALBUM_IDS} from '../content/text'
import {isHome,HOME_RECT} from './world'
import {npcTile} from './neighbors'
import {placement} from './room'
import {freshStats} from './stats'

it('물 긷는 아이와 친해져도 공부 부탁·저녁 공부 일정이 생기지 않는다',()=>{
 const base={...newGame(CONTENT),hearts:{child:29}}
 const s=greetNeighbor(base,'child')
 expect(s.flags).not.toHaveProperty('childAsked')
 expect(s.scenes).not.toContain('childAsks')
 expect(s.inv.vase).toBe(1)
 const legacy={...s,clock:{day:1,minute:1090},flags:{...s.flags,childAsked:1,childLetters:0}}
 expect(scheduledEvents(legacy,CONTENT).some(e=>e.id.endsWith(':lesson'))).toBe(false)
 let next=legacy
 for(let i=0;i<500;i++)next=tick(next,.05,()=>.5,CONTENT).state as typeof legacy
 expect(isHome(npcTile(next.npcs.child))).toBe(false)
})
it('옛 저장의 공부 흔적만 정리하고 플레이어 아이와 다른 장면·기록은 보존한다',()=>{
 const base=newGame(CONTENT),child={name:'하린',look:'girl' as const,born:1,stats:freshStats(),lean:null}
 const legacy={...base,child,flags:{...base.flags,childAsked:1,childLetters:6,taughtDay:10,childHelping:1},
  scenes:['childAsks','firstLetter','childLearned','childStays'],
  album:[{id:'firstLetter',day:5},{id:'childStays',day:8}],todayNotes:['childLearned','childStays'],
  journal:[{day:5,heard:[],notes:['firstLetter','childStays']},{day:6,heard:[]}]}
 // 기존 버전의 저장을 직접 읽는 경로도 정리해야 한다.
 const loaded=deserialize(JSON.stringify(legacy),CONTENT)!
 expect(loaded).not.toBeNull()
 expect(loaded.scenes).toEqual(['childStays'])
 expect(loaded.album).toEqual([{id:'childStays',day:8}])
 expect(loaded.flags).not.toHaveProperty('childAsked')
 expect(loaded.flags).not.toHaveProperty('childLetters')
 expect(loaded.flags).not.toHaveProperty('taughtDay')
 expect(loaded.flags.childHelping).toBe(1)
 expect(loaded.child?.name).toBe('하린')
 expect(loaded.todayNotes).toEqual(['childStays'])
 expect(loaded.journal[0].notes).toEqual(['childStays'])
 const serialized=JSON.parse(serialize(legacy))
 expect(serialized.scenes).toEqual(['childStays'])
 expect(serialized.flags).not.toHaveProperty('childAsked')
})
it('공부 전용 장면·앨범은 제거하고 과거 공부 자리도 가구 배치를 허용한다',()=>{
 for(const id of ['childAsks','firstLetter','childLearned']){
  expect(SCENES[id]).toBeUndefined()
  expect(ALBUM_IDS).not.toContain(id)
 }
 expect(placement([],'stool',{x:HOME_RECT.x0+5,y:HOME_RECT.y0+2})).not.toBeNull()
})
