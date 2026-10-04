// 처음부터 끝까지: 성실한 플레이어가 막히지 않고 누가복음 24장을 다 필사하는가 (계획 14: 한 절씩 따라 적기, 재료·조각 없음)
import { CONTENT, piecesOf } from '../content/catalog'
import { bookDone } from './books'
import { copySpot } from './copying'
import {
  eatBread,
  finishGather,
  finishHelp,
  goToSleep,
  greetNeighbor,
  listen,
  newGame,
  sceneSeen,
  startCopy,
  writeVerse,
  type GameState,
} from './game'
import type { NeighborDef } from './types'

const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id) as NeighborDef

/** 한 장을 끝까지 따라 적는다 */
function copyChapter(s: GameState): GameState {
  for (let i = 0; i < 200; i++) {
    const spot = copySpot(s, 'lk', CONTENT)
    if (!spot) return s
    const r = writeVerse(s, 'lk', spot.verse.text, CONTENT)
    s = r.state
    if (r.result.kind === 'chapter' || r.result.kind === 'none') return s
  }
  return s
}

function oneDay(s: GameState): GameState {
  // 아침에 쌓인 장면은 본 것으로
  for (const id of [...s.scenes]) s = sceneSeen(s, id, [])
  // 오늘 특별한 대화로 말씀 조각을 건넬 이웃이 있으면 듣는다 (드물게)
  for (const id of Object.keys(s.offers)) {
    s = greetNeighbor(s, id)
    s = listen(s, id, CONTENT).state
  }
  // 먹을 것: 물을 길어 빵집을 돕는다
  s = finishGather(s, 'well')
  s = finishHelp(s, def('baker'))
  if (s.needs.hunger >= 50) s = eatBread(s) ?? s
  // 낮에 책상에서 두 장 필사 (재료는 들지 않는다)
  s = { ...s, clock: { ...s.clock, minute: 12 * 60 } }
  s = copyChapter(s)
  if (s.needs.hunger >= 50) s = eatBread(s) ?? s
  s = copyChapter(s)
  if (s.needs.hunger >= 50) s = eatBread(s) ?? s
  return goToSleep({ ...s, clock: { ...s.clock, minute: 21 * 60 } }, CONTENT)
}

describe('처음부터 끝까지', () => {
  it('성실하게 살면 두 달 안에 누가복음 24장을 다 필사하고, 앓아눕지 않는다', () => {
    let s = startCopy(newGame(CONTENT), 'lk', CONTENT)
    let sickDays = 0
    let days = 0
    let bound = false
    while (!bookDone(s, 'lk', CONTENT) && days < 60) {
      s = oneDay(s)
      if (s.scenes.includes('sick')) sickDays++
      if (s.scenes.includes('bookBound')) bound = true
      days++
    }
    expect(s.progress.lk.completed).toHaveLength(24)
    expect(bound).toBe(true)
    expect(sickDays).toBe(0)
    expect(days).toBeLessThanOrEqual(45)
    // 말씀 조각은 필사와 상관없이 드물게 — 다 모으지 않아도 책을 마친다
    expect(s.collected.length).toBeLessThan(piecesOf('lk').length)
    // 일지는 하루도 빠짐없이
    expect(s.journal).toHaveLength(days)
  })
})
