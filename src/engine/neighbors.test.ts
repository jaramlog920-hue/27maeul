import { CONTENT } from '../content/catalog'
import { goToSleep, neighborsPresent, newGame, settle, type GameState } from './game'
import type { Grade } from './library'
import { findPath } from './movement'
import { route } from './neighbors'
import type { Book } from './types'
import { HOME_DOOR, HOME_FRONT, HOME_RECT, isHome } from './world'

it('집 안과 밖의 일반 이웃 동선은 문을 통해 이어진다',()=>{
 const child=CONTENT.neighbors.find(n=>n.id==='child')!
 const inside={x:HOME_RECT.x0+5,y:HOME_RECT.y0+2}
 expect(findPath(child.door,inside)).toBeNull()
 expect(route(child.door,inside)!.at(-1)).toEqual(HOME_DOOR)
 expect(isHome(route(inside,child.door)!.at(-1)!)).toBe(true)
 expect(route(child.door,HOME_FRONT)).toEqual(findPath(child.door,HOME_FRONT))
})

describe('서고 권수로 이사 오는 이웃', () => {
  const TWO = { mk: 1, mt: 1 } as const
  const nextMorning = (shelved: Partial<Record<Book, Grade>>): GameState => settle(goToSleep({ ...newGame(CONTENT), shelved }, CONTENT), CONTENT)
  it('편지 나르는 이웃은 처음부터, 목수는 1권, 약방 주인은 2권, 어부는 3권부터 마을에 보인다', () => {
    const none = nextMorning({})
    expect(Object.keys(none.npcs)).toContain('postman')
    expect(neighborsPresent(none, CONTENT)).not.toContain('apothecary')
    expect(neighborsPresent(nextMorning({ mk: 1 }), CONTENT)).not.toContain('apothecary')
    expect(neighborsPresent(nextMorning(TWO), CONTENT)).toContain('apothecary')
    expect(neighborsPresent(nextMorning(TWO), CONTENT)).not.toContain('fisher')
    expect(neighborsPresent(nextMorning({ ...TWO, lk: 0 }), CONTENT)).toContain('fisher')
    expect(neighborsPresent(none, CONTENT)).not.toContain('carpenter')
    expect(neighborsPresent(nextMorning({ mk: 1 }), CONTENT)).toContain('carpenter')
  })
  it('이사 온 날 아침에 소개 장면', () => {
    const s = { ...newGame(CONTENT), shelved: TWO }
    expect(goToSleep(s, CONTENT).scenes).toContain('movedIn:apothecary')
    const again = goToSleep(goToSleep(s, CONTENT), CONTENT)
    expect(again.scenes.filter((x) => x === 'movedIn:apothecary')).toHaveLength(1)
  })
  it('낮에 책을 꽂아도 그날은 아직 보이지 않고, 소개 장면이 나온 아침부터 보인다', () => {
    // 책을 아직 꽂지 않은 채로 하루를 시작 — 서고 권수는 나중에 낮 동안 올라간다
    const before = newGame(CONTENT)
    expect(neighborsPresent(before, CONTENT)).not.toContain('apothecary')
    // 낮 동안 책을 꽂아 서고 권수가 올라가도, 잠들기 전까지는 아직 나타나지 않는다
    const midDay = { ...before, shelved: TWO }
    expect(neighborsPresent(midDay, CONTENT)).not.toContain('apothecary')
    // 잠들며 소개 장면이 걸린 다음 날 아침부터 보인다
    const next = settle(goToSleep(midDay, CONTENT), CONTENT)
    expect(next.scenes).toContain('movedIn:apothecary')
    expect(neighborsPresent(next, CONTENT)).toContain('apothecary')
  })
})
