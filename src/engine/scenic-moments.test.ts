import { CONTENT } from '../content/catalog'
import { copyVerses } from './copying'
import { legacyGame } from './growth-test-support'
import { careBaby, startCopy, writeVerse, type GameState } from './game'
import { festivalOf, isMarketDay, isWet, weatherOf } from './calendar'
import { momentNow, onceKey } from './stories'
import { newChild } from './child'
import { serialize, deserialize } from './save'

function lastVerse(s: GameState, chapter: number) {
  const last = copyVerses('mt', chapter, CONTENT).at(-1)!
  const game = { ...s, copy: { ...s.copy, at: { ...s.copy.at, mt: { chapter, verse: last.verse } } } }
  return writeVerse(game, 'mt', last.text, CONTENT)
}

it('비 오는 밤 필사는 장 완료 후 하루 한 번만 예약하고 저장에도 남는다', () => {
  const day = Array.from({ length: 100 }, (_, i) => i + 1).find(d => weatherOf(d) === 'rain')!
  const s = startCopy({ ...legacyGame(CONTENT), scenes: [], clock: { day, minute: 22 * 60 } }, 'mt', CONTENT)
  const first = lastVerse(s, 1)
  expect(first.result.kind).toBe('chapter')
  expect(first.state.scenes).toContain('rainCopy')
  const loaded = deserialize(serialize(first.state), CONTENT)!
  expect(loaded.scenes).toContain('rainCopy')
  expect(loaded.flags.rainCopyScene).toBe(day)
  const second = lastVerse({ ...first.state, scenes: [] }, 2)
  expect(second.state.scenes).not.toContain('rainCopy')
})

it('맑은 밤이나 비 오는 낮에는 필사 풍경을 예약하지 않는다', () => {
  for (const rainy of [true, false]) {
    const day = Array.from({ length: 100 }, (_, i) => i + 1).find(d => (weatherOf(d) === 'rain') === rainy)!
    const s = startCopy({ ...legacyGame(CONTENT), scenes: [], clock: { day, minute: (rainy ? 12 : 22) * 60 } }, 'mt', CONTENT)
    expect(lastVerse(s, 1).state.scenes).not.toContain('rainCopy')
  }
})

it('밤에 아기 이불을 덮으면 하루 한 번 장면을 예약하고 추가 호감도는 주지 않는다', () => {
  const s = legacyGame(CONTENT)
  const game = { ...s, scenes: [], clock: { day: 1, minute: 22 * 60 }, child: newChild(1, s.stats, undefined),
    room: [{ item: 'homeCradle' as const, x: 4, y: 4 }], player: { ...s.player, x: 5, y: 4, path: [] } }
  const first = careBaby(game, 'tuck')!
  expect(first).not.toBeNull()
  expect(first.scenes).toContain('babySleep')
  const again = careBaby({ ...first, scenes: [], act: undefined }, 'tuck')!
  expect(again.scenes).not.toContain('babySleep')
  expect(again.child!.close).toBe(first.child!.close)
  expect(deserialize(serialize(first), CONTENT)!.scenes).toContain('babySleep')
})

it('장날 저녁 풍경은 광장 야외에서만 열리고 이미 본 해에는 다시 예약하지 않는다', () => {
  const day = Array.from({ length: 100 }, (_, i) => i + 1).find(d => isMarketDay(d) && !isWet(weatherOf(d)) && !festivalOf(d))!
  const ctx = { day, minute: 18 * 60 + 15, outdoors: true, player: { x: 24, y: 17 }, flags: {} }
  expect(momentNow(ctx)).toBe('marketEvening')
  expect(momentNow({ ...ctx, outdoors: false })).toBeNull()
  expect(momentNow({ ...ctx, minute: 16 * 60 })).toBeNull()
  expect(momentNow({ ...ctx, player: { x: 1, y: 1 } })).toBeNull()
  expect(momentNow({ ...ctx, flags: { [onceKey('marketEvening', day)]: 1 } })).toBeNull()
})

it('맑은 늦은 밤에는 장 완료 뒤 쉼 장면을 한 해에 한 번 예약한다', () => {
  const day = Array.from({ length: 100 }, (_, i) => i + 1).find(d => weatherOf(d) === 'sunny')!
  const s = startCopy({ ...legacyGame(CONTENT), scenes: [], clock: { day, minute: 22 * 60 } }, 'mt', CONTENT)
  const first = lastVerse(s, 1).state
  expect(first.scenes).toContain('afterCopy')
  expect(first.scenes).not.toContain('rainCopy')
  expect(lastVerse({ ...first, scenes: [] }, 2).state.scenes).not.toContain('afterCopy')
})
