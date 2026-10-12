import { CONTENT } from '../content/catalog'
import text from '../content/neighbor-moments.json'
import { newGame, type GameState } from './game'
import { BOOKS, type Tile } from './types'
import { oldNeighborLine, eventNeighborLine } from './neighbor-moments'
import { rememberTalkPopup } from './talk-popups'
import { deserialize, serialize } from './save'
import { FESTIVAL_SPOTS } from './neighbors'
import { festivalOf, isWet, weatherOf } from './calendar'
import { spotsForAppt, type Appt } from './plans'
import { BABY_PARTY_SPOTS, gatheringWindow, HILL_SPOTS } from './bonds'
import { hallGuestsToday } from './game'
import { HALL_SPOTS } from './places'
import { chaptersOf } from './books'

function ready(count = 25): GameState {
  const s = newGame(CONTENT)
  return { ...s, scenes: [], clock: { day: 3, minute: 600 },
    progress: Object.fromEntries(BOOKS.map(b => [b, { ...s.progress[b], completed: BOOKS.slice(0, count).includes(b) ? chaptersOf(b, CONTENT) : [] }])) as GameState['progress'],
    shelved: Object.fromEntries(BOOKS.slice(0, count).map(b => [b, 2 as const])),
    flags: { ...s.flags, villageLevel: 10, ...Object.fromEntries(CONTENT.neighbors.map(n => [`movedIn:${n.id}`, 1])) },
  }
}
function present(s: GameState, id: string, at: Tile): GameState {
  return { ...s, npcs: { ...s.npcs, [id]: { id, ...at, visible: true, path: [], goal: at, facing: 'down', walkTime: 0 } } }
}

describe('25권 오래된 이웃의 말', () => {
  it('24권에는 잠겨 있고 25권부터 각 이웃의 말이 열린다', () => {
    expect(oldNeighborLine(ready(24), 'baker', 0)).toBeNull()
    for (const n of CONTENT.neighbors) expect(oldNeighborLine(ready(), n.id, 0.9)).toBeTruthy()
  })
  it('그 이웃과 실제로 함께한 경험만 기억하며 침대 전달을 지어내지 않는다', () => {
    const s = ready()
    expect(oldNeighborLine(s, 'baker', 0.9)).toBe(text.oldNeighbors.baker)
    expect(oldNeighborLine({ ...s, flags: { ...s.flags, bakerCribGiven: 8 } }, 'baker', 0.9)).toBe(text.memories.crib)
    const e = { id: 'work:baker', kind: 'work' as const, with: ['baker'], first: 2, last: 2, count: 1 }
    const worked = { ...s, life: { ...s.life, experiences: { [e.id]: e } } }
    expect(oldNeighborLine(worked, 'baker', 0.9)).toBe(text.memories.work)
    expect(oldNeighborLine(worked, 'tilly', 0.9)).toBe(text.oldNeighbors.tilly)
  })
  it('읽은 말은 저장 이후 우선 표시하지 않지만 가끔 평소 대화로 나온다', () => {
    const s = rememberTalkPopup(ready(), 'baker', text.oldNeighbors.baker)
    const saved = deserialize(serialize(s), CONTENT)!
    expect(oldNeighborLine(saved, 'baker', 0.9)).toBeNull()
    expect(oldNeighborLine(saved, 'baker', 0)).toBe(text.oldNeighbors.baker)
    expect(oldNeighborLine(saved, 'tilly', 0.9)).toBe(text.oldNeighbors.tilly)
  })
})

describe('행사 참석자에게 말을 걸기', () => {
  function appointment(kind: 'tea' | 'housewarming' | 'showcase' = 'tea'): GameState {
    let s = ready(0)
    const a: Appt = { id: 'appt:1', kind: 'event', day: 3, from: 600, to: 720, place: 'hallTable', members: ['baker'], startedWith: ['baker'], state: 'running', rewarded: false, remembered: false }
    s = { ...s, plans: { appts: [a], nextId: 2 }, fests: [{ id: 'fest:1', apptId: a.id, kind, day: 3, place: a.place, members: ['baker'], reserve: {}, step: 'talk', joined: true, consumed: false, closed: false, cancelled: false }] }
    return present(s, 'baker', spotsForAppt(a)[0])
  }
  it.each(['tea', 'housewarming', 'showcase'] as const)('%s 행사는 25권 전에도 해당 행사 이야기가 나온다', kind => {
    const s = appointment(kind)
    expect(eventNeighborLine(s, 'baker', CONTENT)).toBe(text.events[kind])
    expect(eventNeighborLine(s, 'smith', CONTENT)).toBeNull()
    expect(eventNeighborLine({ ...s, clock: { day: 3, minute: 720 } }, 'baker', CONTENT)).toBeNull()
    expect(eventNeighborLine(present(s, 'baker', { x: 1, y: 1 }), 'baker', CONTENT)).toBeNull()
    expect(eventNeighborLine({ ...s, map: 'newland' }, 'baker', CONTENT)).toBeNull()
    expect(eventNeighborLine({ ...s, npcs: { ...s.npcs, baker: { ...s.npcs.baker, visible: false } } }, 'baker', CONTENT)).toBeNull()
  })
  it('초대만 된 사람·끝난 행사는 대화 대상에서 제외하며 보상이나 기억을 만들지 않는다', () => {
    const s = appointment()
    const original = serialize(s)
    eventNeighborLine(s, 'baker', CONTENT)
    expect(serialize(s)).toBe(original)
    const a = s.plans.appts[0]
    expect(eventNeighborLine({ ...s, plans: { ...s.plans, appts: [{ ...a, startedWith: [] }] } }, 'baker', CONTENT)).toBeNull()
    expect(eventNeighborLine({ ...s, plans: { ...s.plans, appts: [{ ...a, state: 'done' }] } }, 'baker', CONTENT)).toBeNull()
  })
  it.each(['blossom', 'barley', 'grapes', 'hearth'] as const)('%s 계절 잔치는 실제 잔치 시간·장소에만 나온다', festival => {
    let day = 1
    while (day < 1500 && (festivalOf(day) !== festival || isWet(weatherOf(day)))) day++
    expect(day).toBeLessThan(1500)
    const s = present({ ...ready(0), clock: { day, minute: 1100 } }, 'baker', FESTIVAL_SPOTS.baker)
    expect(eventNeighborLine(s, 'baker', CONTENT)).toBe(text.events[festival])
    expect(eventNeighborLine({ ...s, clock: { day, minute: 1260 } }, 'baker', CONTENT)).toBeNull()
  })
  it.each(['picnic', 'babyParty', 'starNight'] as const)('%s 모임 자리에 있는 이웃과 대화한다', gathering => {
    const [minute] = gatheringWindow(gathering)
    const base = ready(0)
    const s = present({ ...base, today: { ...base.today, gathering }, clock: { day: 3, minute } }, 'baker', (gathering === 'babyParty' ? BABY_PARTY_SPOTS : HILL_SPOTS).baker)
    expect(eventNeighborLine(s, 'baker', CONTENT)).toBe(text.events[gathering])
  })
  it('낭독 모임에서는 실제 사랑방 손님과 대화한다', () => {
    let s = { ...ready(0), clock: { day: 5, minute: 1150 } }
    const id = hallGuestsToday(s, CONTENT)[0]
    expect(id).toBeTruthy()
    s = present(s, id, HALL_SPOTS[0])
    expect(eventNeighborLine(s, id, CONTENT)).toBe(text.events.reading)
  })
})
