// 처음부터 끝까지: 성실한 플레이어가 막히지 않고 24장을 다 쓰고 "다 쓴 날"에 닿는가
import { CONTENT } from '../content/catalog'
import { canonicalOrder } from './scroll'
import { currentChapter } from './offers'
import {
  eatBread,
  finishCraft,
  finishGather,
  finishHelp,
  goToSleep,
  greetNeighbor,
  listen,
  newGame,
  sceneSeen,
  setArrangement,
  submitChapter,
  type GameState,
} from './game'
import type { NeighborDef } from './types'

const def = (id: string) => CONTENT.neighbors.find((n) => n.id === id) as NeighborDef

function oneDay(s: GameState): GameState {
  // 아침에 쌓인 장면은 본 것으로
  for (const id of [...s.scenes]) s = sceneSeen(s, id, [])
  // 이웃에게 인사하고 이야기를 듣는다
  for (const id of Object.keys(s.offers)) {
    s = greetNeighbor(s, id)
    s = listen(s, id, CONTENT).state
  }
  // 먹을 것: 물을 길어 빵집을 돕는다
  s = finishGather(s, 'well')
  s = finishHelp(s, def('baker'))
  if (s.needs.hunger >= 50) s = eatBread(s) ?? s
  // 글쓰기 재료: 갈대 → 파피루스, 대장간 그을음 + 물 → 잉크
  s = finishGather(s, 'reeds')
  s = finishHelp(s, def('smith'))
  s = finishGather(s, 'well')
  s = finishCraft(s, 'papyrus')
  s = finishCraft(s, 'ink')
  // 모은 장을 차례대로 잇는다 (낮에 쓰므로 등잔은 필요 없다)
  const ch = currentChapter(CONTENT.pieces, s.completed)
  if (ch !== null) {
    s = setArrangement(s, ch, canonicalOrder(CONTENT.pieces, ch))
    s = submitChapter({ ...s, clock: { ...s.clock, minute: 12 * 60 } }, ch, CONTENT).state
  }
  if (s.needs.hunger >= 50) s = eatBread(s) ?? s
  return goToSleep({ ...s, clock: { ...s.clock, minute: 21 * 60 } }, CONTENT)
}

describe('처음부터 끝까지', () => {
  it('성실하게 살면 두 달 안에 24장을 다 쓰고, 앓아눕지 않는다', () => {
    let s = newGame(CONTENT)
    let sickDays = 0
    let days = 0
    while (!s.scenes.includes('ending') && days < 60) {
      s = oneDay(s)
      if (s.scenes.includes('sick')) sickDays++
      days++
    }
    expect(s.completed).toHaveLength(24)
    expect(s.collected).toHaveLength(CONTENT.pieces.length)
    expect(s.scenes).toContain('ending')
    expect(sickDays).toBe(0)
    expect(days).toBeLessThanOrEqual(45)
    // 일지는 하루도 빠짐없이
    expect(s.journal).toHaveLength(days)
  })

  it('하루에 모을 수 있는 이야기는 이웃 수만큼 — 한 장이 며칠 걸리기도 한다', () => {
    const biggest = Math.max(...Array.from({ length: 24 }, (_, i) => CONTENT.pieces.filter((p) => p.chapter === i + 1).length))
    expect(biggest).toBeGreaterThan(6)
    expect(biggest).toBeLessThanOrEqual(14)
  })
})
