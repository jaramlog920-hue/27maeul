import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { babyRoomTalk, newGame, syncHome, type GameState } from './game'
import { CHILD_AFTER_WEDDING } from './child'
import { moodOf } from './mood'
import { cameraFor, homeRect, setHomeLevel, VIEW_H, VIEW_W } from './world'
import { LIVING_ROOM, BABY_ROOM } from './home-layout'

const married = (homeLevel: GameState['homeLevel'], day: number): GameState => {
  const s = newGame(CONTENT)
  return {
    ...s,
    homeLevel,
    clock: { ...s.clock, day },
    romance: { ...s.romance, partner: 'wendell', stage: 'married', marriedDay: 1, weddingDay: null },
  } as GameState
}

describe('배우자가 아이방 이야기를 꺼낸다', () => {
  const due = 1 + CHILD_AFTER_WEDDING
  it('아이 올 날이 지났는데 아이방이 없으면 꺼내고, 사흘 뒤에 다시', () => {
    const s = married(1, due)
    const once = babyRoomTalk(s, 'wendell')!
    expect(once.flags.babyRoomTalkDay).toBe(due)
    expect(babyRoomTalk({ ...once, clock: { ...once.clock, day: due + 2 } }, 'wendell')).toBeNull()
    expect(babyRoomTalk({ ...once, clock: { ...once.clock, day: due + 3 } }, 'wendell')).not.toBeNull()
  })
  it('아직 이르거나, 아이방이 있거나, 목수에게 부탁했거나, 배우자가 아니면 꺼내지 않는다', () => {
    expect(babyRoomTalk(married(1, due - 1), 'wendell')).toBeNull()
    expect(babyRoomTalk(married(2, due), 'wendell')).toBeNull()
    const ordered = married(1, due)
    expect(babyRoomTalk({ ...ordered, flags: { ...ordered.flags, homeOrder: 2 } }, 'wendell')).toBeNull()
    expect(babyRoomTalk(married(1, due), 'someoneElse')).toBeNull()
  })
})

describe('기분: 배우자방 가구는 꾸민 방으로 세지 않는다', () => {
  it('spouse: 가구만 있으면 붙박이만 있을 때와 같다', () => {
    const s = newGame(CONTENT)
    const base = moodOf(s)
    const withSpouse = { ...s, room: [...s.room, { item: 'spouse:wendell:0' as const, x: 20, y: 106 }, { item: 'spouse:wendell:1' as const, x: 22, y: 106 }] }
    expect(moodOf(withSpouse)).toBe(base)
    expect(moodOf({ ...s, room: [...s.room, { item: 'chair' as const, x: 21, y: 113 }] })).toBe(base + 3)
  })
})

describe('넓힌 집에서 카메라가 기록자를 따라간다', () => {
  it('3단계: 생활방 왼쪽 끝과 아이방 오른쪽 끝에서 카메라가 다르고, 집 밖으로 나가지 않는다', () => {
    syncHome({ homeLevel: 3 })
    const r = homeRect()
    const left = cameraFor(LIVING_ROOM.x0 + 1, 112)
    const right = cameraFor(BABY_ROOM.x1 - 1, 112)
    expect(right.x).toBeGreaterThan(left.x)
    expect(left.x).toBeGreaterThanOrEqual(r.x0)
    expect(right.x + VIEW_W).toBeLessThanOrEqual(r.x1 + 1)
    setHomeLevel(0)
  })
  it('확대해서 화면이 집보다 낮아지면 위아래로도 따라간다', () => {
    syncHome({ homeLevel: 3 })
    const zoom = 2
    expect(homeRect().y1 - homeRect().y0 + 1).toBeGreaterThan(VIEW_H / zoom)
    expect(cameraFor(20, 115, zoom).y).toBeGreaterThan(cameraFor(20, 105, zoom).y)
    setHomeLevel(0)
  })
})
