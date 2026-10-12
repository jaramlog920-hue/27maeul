// 별도 로컬 포트에서만 여는 검증 화면. 기존 플레이 저장을 사용하지 않는다.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CONTENT } from '../src/content/catalog'
import { newGame, type GameState } from '../src/engine/game'
import { CRADLE_SPOT, newChild } from '../src/engine/child'
import { freshStats } from '../src/engine/stats'
import { newGenState, relationId } from '../src/engine/gen'
import { settleOneDay } from '../src/engine/gen-settle'
import { ROOMS, HOME_ENTRY } from '../src/engine/world'
import { useGame } from '../src/store/game-store'
import { Play } from '../src/features/play/Play'
import '../src/app/global.css'
import '../src/app/parts.css'

function state(kind: 'adult' | 'baby' | 'grown'): GameState {
  const base = newGame(CONTENT, { look: 'f', name: '검증', skin: 2 })
  const flags = { ...base.flags, homeLayout: 2, villageLevel: 27, ...Object.fromEntries(CONTENT.neighbors.map(n => [`movedIn:${n.id}`, 1])) }
  if (kind === 'adult') return { ...base, flags, scenes: [], homeLevel: 2, clock: { day: 100, minute: 600 },
    room: [...base.room, { item: 'homeCradle', ...CRADLE_SPOT }],
    player: { ...base.player, x: CRADLE_SPOT.x + 2, y: CRADLE_SPOT.y, path: [] }, child: { ...newChild(1, freshStats(), 'wit'), name: '성인 자녀', mode: 'home', job: 'scribe', jobConfirmed: true },
    romance: { partner: 'rudy', stage: 'married', since: 1, marriedDay: 2, weddingDay: null } }
  let g = newGenState(CONTENT, 7, 160)
  g = { ...g, persons: { ...g.persons,
    'g-0001': { id: 'g-0001', origin: 'born', born: 1, stage: 'adult', look: 'm', name: '첫 자녀', parents: ['rudy', 'poppy'], spouse: null, household: 'h-old1', avatar: { skin: 2 }, hair: [0, 100, 65] },
    'g-0002': { id: 'g-0002', origin: 'born', born: 1, stage: 'adult', look: 'f', name: '둘째 집 자녀', parents: ['wendell', 'tilly'], spouse: null, household: 'h-old2', avatar: { skin: 3 }, hair: [0, 100, 65] },
  }, households: {
    'h-old1': { id: 'h-old1', members: ['rudy', 'poppy'], home: 'carpenter', children: ['g-0001'], since: 1, lastBirth: 1 },
    'h-old2': { id: 'h-old2', members: ['wendell', 'tilly'], home: 'baker', children: ['g-0002'], since: 1, lastBirth: 1 },
  }, retired: { rudy: { heir: 'g-0001', day: 130 }, wendell: { heir: 'g-0002', day: 130 } }, nextPerson: 3,
    relations: { [relationId('g-0001','g-0002')]: { id: relationId('g-0001','g-0002'), a: 'g-0001', b: 'g-0002', stage: 'preparing', since: 150, prep: { wedding: 159, tasks: ['bread','oil'], done: ['bread','oil'] } } } }
  g = settleOneDay(g, 160, {}, CONTENT, {})
  const h = Object.values(g.households).find(h => h.members.includes('g-0001'))!
  g = { ...g, households: { ...g.households, [h.id]: { ...h, birthDue: 160 } } }
  g = settleOneDay(g, 160, {}, CONTENT, {})
  if (kind === 'grown') g = settleOneDay(g, 174, {}, CONTENT, {})
  const room = ROOMS.find(r => r.owner === g.households[h.id].home)!
  const at = kind === 'baby' ? room.entry : CONTENT.neighbors.find(n => n.id === 'rudy')!.door
  return { ...base, flags, scenes: [], clock: { day: kind === 'baby' ? 160 : 174, minute: 600 }, gen: g, player: { ...base.player, ...at, path: [] } }
}

function Check() {
  const [selected, setSelected] = useState('')
  function select(kind: 'adult' | 'baby' | 'grown') {
    useGame.getState().load(state(kind))
    setSelected(kind)
  }
  return <><nav style={{ position: 'fixed', zIndex: 1000, left: 8, top: 8, maxWidth: 300, background: '#fff', color: '#222', padding: 8 }}>
    <p>가족 검증용 상태 · 실제 플레이 진행 아님</p>
    <button onClick={() => select('adult')}>성인 자녀 (옷장 미사용)</button>
    <button onClick={() => select('baby')}>손주 출생 · 빨간 머리</button>
    <button onClick={() => select('grown')}>손주 성장 · 14일 후</button>
    <p>선택: {selected || '아직 없음'}</p>
  </nav>{selected ? <Play /> : null}</>
}
createRoot(document.getElementById('root')!).render(<Check />)
