// 계획 11 작업 1: 아침에 저절로 생기는 재료 — 빗물 항아리·갈대 말리는 틀·그을음 받이·잉크 항아리, 재료 궤짝
import { CONTENT, copySourceFor, piecesOf } from '../content/catalog'
import { ITEM_TEXT, JOURNAL_NOTES, SCENES, T } from '../content/text'
import { weatherOf } from './calendar'
import { blanksFor } from './copy'
import { CARPENTER_WORKS, CHEST_STACK, INK_JAR_HOLD, RAIN_WATER, SOOT_CATCH } from './easier'
import {
  canCraft,
  canOrderWork,
  catchSoot,
  chestOf,
  chooseBook,
  eatBread,
  finishCraft,
  finishGather,
  finishHelp,
  gatherInfo,
  goToSleep,
  letterReady,
  listen,
  newGame,
  orderWork,
  ownsTradeTool,
  recordLetter,
  restAt,
  stockOf,
  takeFromChest,
  trade,
  TRADES,
  tradesFor,
  warmByHearth,
  type GameState,
} from './game'
import { MAX_STACK } from './items'
import { exhausted } from './needs'
import { currentChapter } from './offers'
import { POSTMAN } from './post'
import { deserialize, serialize } from './save'
import { FURNITURE } from './room'
import { HOME_ENTRY, HOME_FRONT, HOUSE_GROW } from './world'
import { RAIN_JAR_AT, REED_RACK_AT } from '../render/decor'
import { FURNITURE_ART } from '../render/furniture-art'
import type { Book } from './types'

const MARKET = 7
const at = (s: GameState, day: number, minute = 10 * 60): GameState => ({ ...s, clock: { day, minute } })
const own = (s: GameState, ...ids: string[]): GameState => ({
  ...s,
  flags: { ...s.flags, ...Object.fromEntries(ids.map((id) => [`unlock:${id}`, 1])) },
})
/** 목수가 이사 오고 닢이 넉넉한 상태 */
const ready = (): GameState => {
  const s = newGame(CONTENT)
  return { ...s, coins: 1000, scenes: [], flags: { ...s.flags, 'movedIn:carpenter': 1, 'movedIn:fisher': 1, 'movedIn:innkeeper': 1 } }
}
const sleep = (s: GameState) => goToSleep(at(s, s.clock.day, 21 * 60), CONTENT)
const byId = (id: string) => TRADES.find((t) => t.id === id)!

describe('장날에 사는 것: 빗물 항아리 닢 40, 잉크 항아리 닢 100 (그을음 받이 뒤)', () => {
  it('빗물 항아리는 장날에 닢 40으로 한 번만', () => {
    const t = byId('rainJar')
    expect(t.coins).toBe(40)
    expect(trade(at(ready(), MARKET - 1), t)).toBeNull()
    expect(trade({ ...at(ready(), MARKET), coins: 39 }, t)).toBeNull()
    const s = trade(at(ready(), MARKET), t)!
    expect(s.coins).toBe(960)
    expect(s.flags['unlock:rainJar']).toBe(1)
    // 가방 칸을 차지하지 않는다 (집 앞에 놓인다)
    expect(s.inv).toEqual(ready().inv)
    expect(ownsTradeTool(s.inv, t, s.flags)).toBe(true)
    expect(trade(s, t)).toBeNull()
  })
  it('잉크 항아리는 그을음 받이를 단 뒤에만 보이고, 사면 집 안에 놓을 가구로 들어온다', () => {
    const t = byId('inkJar')
    expect(t.coins).toBe(100)
    expect(tradesFor(ready().flags)).not.toContain(t)
    expect(trade(at(ready(), MARKET), t)).toBeNull()
    const withCatcher = own(at(ready(), MARKET), 'sootCatcher')
    expect(tradesFor(withCatcher.flags)).toContain(t)
    const s = trade(withCatcher, t)!
    expect(s.coins).toBe(900)
    expect(s.flags['unlock:inkJar']).toBe(1)
    expect(s.inv.inkJar).toBe(1)
    expect(FURNITURE).toContain('inkJar')
    // 가구를 놓아 가방에서 없어져도 다시 사지 않는다
    expect(trade({ ...s, inv: {} }, t)).toBeNull()
  })
})

describe('목수 부탁: 재료 궤짝 닢 50, 그을음 받이 닢 60, 갈대 말리는 틀 닢 80', () => {
  it('값', () => {
    expect(Object.fromEntries(CARPENTER_WORKS.map((w) => [w.id, w.coins]))).toEqual({ supplyChest: 50, sootCatcher: 60, reedRack: 80 })
  })
  it('목수가 이사 오기 전에는 부탁할 수 없고, 닢이 모자라면 못 한다', () => {
    const s = newGame(CONTENT)
    expect(canOrderWork({ ...s, coins: 999 }, 'reedRack')).toBe('notMoved')
    expect(canOrderWork({ ...ready(), coins: 79 }, 'reedRack')).toBe('coins')
    expect(orderWork({ ...ready(), coins: 79 }, 'reedRack')).toBeNull()
  })
  it('부탁한 다음 날 아침 지어진다 (장면 하나), 두 번 부탁하지 않는다', () => {
    for (const w of CARPENTER_WORKS) {
      const s = orderWork(ready(), w.id)!
      expect(s.coins).toBe(1000 - w.coins)
      expect(canOrderWork(s, w.id)).toBe('ordered')
      expect(orderWork(s, w.id)).toBeNull()
      expect(s.flags[`unlock:${w.id}`]).toBeUndefined()
      const next = sleep(s)
      expect(next.flags[`unlock:${w.id}`]).toBe(1)
      expect(next.flags[`order:${w.id}`]).toBeUndefined()
      expect(next.scenes).toContain(`built:${w.id}`)
      expect(SCENES[`built:${w.id}`]).toBeDefined()
      expect(canOrderWork(next, w.id)).toBe('owned')
    }
  })
  it('재료 궤짝은 가방에 가구로 들어와 집 안 자리를 고른다', () => {
    const s = sleep(orderWork(ready(), 'supplyChest')!)
    expect(s.inv.supplyChest).toBe(1)
    expect(FURNITURE).toContain('supplyChest')
    expect(FURNITURE_ART.supplyChest).toBeDefined()
    expect(FURNITURE_ART.inkJar).toBeDefined()
  })
})

describe('빗물 항아리: 아침마다 물 1, 비 온 다음 날 물 3', () => {
  const rainy = Array.from({ length: 200 }, (_, i) => i + 3).find((d) => weatherOf(d) === 'rain')!
  const dry = Array.from({ length: 200 }, (_, i) => i + 3).find((d) => weatherOf(d) === 'sunny')!
  it('맑은 날 다음 아침 물 1', () => {
    const s = own({ ...at(ready(), dry), inv: {} }, 'rainJar')
    expect(sleep(s).inv.water).toBe(RAIN_WATER.usual)
    expect(RAIN_WATER.usual).toBe(1)
  })
  it('비 온 날 다음 아침 물 3', () => {
    const s = own({ ...at(ready(), rainy), inv: {} }, 'rainJar')
    expect(sleep(s).inv.water).toBe(RAIN_WATER.afterRain)
    expect(RAIN_WATER.afterRain).toBe(3)
  })
  it('항아리가 없으면 물이 생기지 않는다', () => {
    expect(sleep({ ...at(ready(), rainy), inv: {} }).inv.water).toBeUndefined()
  })
  it('집 앞 자리에 놓이고, 집 넓히기 땅(집 왼쪽)은 비워 둔다', () => {
    for (const t of [RAIN_JAR_AT, REED_RACK_AT]) {
      expect(t.x >= HOUSE_GROW.x0 && t.x <= HOUSE_GROW.x1 && t.y >= HOUSE_GROW.y0 && t.y <= HOUSE_GROW.y1).toBe(false)
      expect(t.x).toBeGreaterThan(HOUSE_GROW.x1)
      expect(Math.abs(t.x - HOME_FRONT.x) + Math.abs(t.y - HOME_FRONT.y)).toBeLessThanOrEqual(5)
    }
  })
})

describe('갈대 말리는 틀: 이웃(어부)이 몰래 갈대를 채운다 — 설치 다음 날 아침 한 번만 장면', () => {
  it('설치한 아침에는 아직, 다음 날 아침 파피루스 1과 장면, 그 뒤로는 말없이 밤마다 1', () => {
    const built = sleep(orderWork(ready(), 'reedRack')!)
    expect(built.flags['unlock:reedRack']).toBe(1)
    expect(built.inv.papyrus).toBeUndefined()
    expect(built.scenes).not.toContain('reedRack')
    const day2 = sleep({ ...built, scenes: [] })
    expect(day2.inv.papyrus).toBe(1)
    expect(day2.scenes).toEqual(['reedRack'])
    const day3 = sleep({ ...day2, scenes: [] })
    expect(day3.inv.papyrus).toBe(2)
    expect(day3.scenes).not.toContain('reedRack')
    const day4 = sleep({ ...day3, scenes: [] })
    expect(day4.inv.papyrus).toBe(3)
    expect(day4.scenes).not.toContain('reedRack')
  })
  it('장면은 어부가 말한다 (플레이어가 갈대를 넣는 일은 없다)', () => {
    const scene = SCENES.reedRack
    expect(scene.lines.some((l) => l.speaker === 'fisher')).toBe(true)
    expect(scene.album).toBeTruthy()
    expect(JOURNAL_NOTES.reedRack).toBeTruthy()
    // 틀에 갈대를 넣는 버튼·부탁 문구가 없다
    expect(JSON.stringify(T.easy)).not.toMatch(/갈대를? 넣/)
  })
  it('파피루스가 가방에 가득하면 쉬어 간다', () => {
    const s = own({ ...ready(), inv: { papyrus: MAX_STACK }, flags: { ...ready().flags, rackSeen: 1 } }, 'reedRack')
    expect(sleep(s).inv.papyrus).toBe(MAX_STACK)
  })
})

describe('그을음 받이: 화덕을 쓸 때마다 그을음 1 (하루 두 번까지, 가진 그을음 다섯까지)', () => {
  it('빵을 구우면·불을 쬐면 그을음이 모인다', () => {
    const s = own({ ...ready(), inv: { barley: 2, water: 2 } }, 'sootCatcher')
    const baked = finishCraft(s, 'bread')
    expect(baked.inv.soot).toBe(1)
    const warm = warmByHearth(baked)
    expect(warm.inv.soot).toBe(2)
    // 하루 두 번까지
    expect(warmByHearth(warm).inv.soot).toBe(2)
    expect(SOOT_CATCH.perDay).toBe(2)
    // 다음 날 다시
    const tomorrow = sleep(warm)
    expect(warmByHearth(tomorrow).inv.soot).toBe(3)
  })
  it('받이가 없으면 모이지 않는다', () => {
    expect(warmByHearth(ready()).inv.soot).toBeUndefined()
    expect(finishCraft({ ...ready(), inv: { barley: 1, water: 1 } }, 'bread').inv.soot).toBeUndefined()
  })
  it('가진 그을음이 다섯이면 더 모이지 않는다', () => {
    const s = own({ ...ready(), inv: { soot: SOOT_CATCH.hold } }, 'sootCatcher')
    expect(SOOT_CATCH.hold).toBe(5)
    expect(catchSoot(s).inv.soot).toBe(5)
  })
})

describe('잉크 항아리: 그을음·물이 있으면 아침마다 잉크 1', () => {
  it('그을음 1 + 물 1 → 잉크 1, 하루 한 병', () => {
    const s = own({ ...ready(), inv: { soot: 3, water: 3 } }, 'inkJar')
    const next = sleep(s)
    expect(next.inv).toMatchObject({ soot: 2, water: 2, ink: 1 })
  })
  it('그을음이나 물이 없으면 그대로', () => {
    expect(sleep(own({ ...ready(), inv: { water: 3 } }, 'inkJar')).inv.ink).toBeUndefined()
    expect(sleep(own({ ...ready(), inv: { soot: 3 } }, 'inkJar')).inv.ink).toBeUndefined()
  })
  it('빗물 항아리의 아침 물로도 우러난다', () => {
    expect(sleep(own({ ...ready(), inv: { soot: 1 } }, 'inkJar', 'rainJar')).inv).toMatchObject({ ink: 1 })
  })
  it('잉크가 셋 있으면 쉬어 간다 (과하게 쌓이지 않게)', () => {
    const s = own({ ...ready(), inv: { soot: 3, water: 3, ink: INK_JAR_HOLD } }, 'inkJar')
    expect(sleep(s).inv).toMatchObject({ soot: 3, water: 3, ink: INK_JAR_HOLD })
  })
})

describe('재료 궤짝: 가방이 차면 궤짝으로, 책상·작업대는 궤짝 것도 쓴다', () => {
  const full = (s: GameState): GameState => ({ ...s, inv: { reed: MAX_STACK, papyrus: MAX_STACK, soot: MAX_STACK, water: MAX_STACK } })
  it('궤짝이 없으면 가방이 찼을 때 막힌다 (예전 그대로)', () => {
    expect(gatherInfo(full(ready()), 'reeds')).toEqual({ blocked: 'full' })
    expect(chestOf(ready())).toBeNull()
  })
  it('궤짝이 있으면 넘치는 갈대가 궤짝으로', () => {
    const s = own(full(ready()), 'supplyChest')
    expect(gatherInfo(s, 'reeds')).not.toHaveProperty('blocked')
    const got = finishGather(s, 'reeds')
    expect(got.inv.reed).toBe(MAX_STACK)
    expect(got.chest.reed).toBe(2)
    expect(stockOf(got, 'reed')).toBe(MAX_STACK + 2)
  })
  it('아침에 저절로 생긴 것도 가방이 차면 궤짝으로', () => {
    const s = own(full(ready()), 'supplyChest', 'rainJar')
    expect(sleep(s).chest.water).toBe(1)
  })
  it('궤짝이 차면 막힌다', () => {
    const s = { ...own(full(ready()), 'supplyChest'), chest: { reed: CHEST_STACK } }
    expect(gatherInfo(s, 'reeds')).toEqual({ blocked: 'full' })
  })
  it('작업대는 궤짝의 재료로 만든다', () => {
    const s = { ...own({ ...ready(), inv: {} }, 'supplyChest'), chest: { reed: 1, soot: 1, water: 1 } }
    expect(canCraft(s, 'papyrus')).toBeNull()
    const p = finishCraft(s, 'papyrus')
    expect(p.inv.papyrus).toBe(1)
    expect(p.chest.reed).toBeUndefined()
    const i = finishCraft(p, 'ink')
    expect(i.inv.ink).toBe(1)
    expect(i.chest).toEqual({})
    // 궤짝이 없으면(표식이 없으면) 궤짝 칸의 것은 쓰지 않는다
    expect(canCraft({ ...s, flags: ready().flags }, 'papyrus')).toBe('needs')
  })
  it('책상은 궤짝의 파피루스·잉크로 옮겨 적는다', () => {
    const s0 = newGame(CONTENT)
    const open = own(
      {
        ...s0,
        flags: { ...s0.flags, gospelFeast: 2, 'room:romPhm': 1 },
        shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 },
        inv: {},
        chest: { papyrus: 2, ink: 2 },
      },
      'supplyChest',
    )
    const s = listen(chooseBook(open, 'rom', CONTENT), POSTMAN, CONTENT).state
    expect(letterReady(s, 'rom', 1, CONTENT)).toEqual({ kind: 'ready' })
    const r = recordLetter(s, 'rom', 1, answers('rom', 1), CONTENT)
    expect(r.progress.rom.completed).toEqual([1])
    expect(r.chest).toEqual({ papyrus: 1, ink: 1 })
  })
  it('궤짝의 것은 집 안에서만 가방으로 꺼낸다', () => {
    const s = { ...own({ ...ready(), inv: { reed: 8 } }, 'supplyChest'), chest: { reed: 5, fig: 2 } }
    expect(takeFromChest({ ...s, player: { ...s.player, x: HOME_FRONT.x, y: HOME_FRONT.y } }, 'fig')).toBeNull()
    const home = { ...s, player: { ...s.player, x: HOME_ENTRY.x, y: HOME_ENTRY.y } }
    const r = takeFromChest(home, 'reed')!
    // 가방에 들어가는 만큼만
    expect(r.inv.reed).toBe(MAX_STACK)
    expect(r.chest.reed).toBe(4)
    expect(takeFromChest(r, 'reed')).toBeNull()
  })
})

describe('저장과 불러오기', () => {
  it('설치 표식·부탁·궤짝·어부 장면 표식이 남는다', () => {
    const s = {
      ...own(ready(), 'rainJar', 'reedRack', 'sootCatcher', 'inkJar', 'supplyChest'),
      chest: { reed: 12, water: 3 },
      flags: { ...own(ready(), 'rainJar', 'reedRack', 'sootCatcher', 'inkJar', 'supplyChest').flags, rackSeen: 1, sootDay: 1, sootCaught: 1, 'order:reedRack': 1 },
    }
    const back = deserialize(serialize(s), CONTENT)!
    expect(back.chest).toEqual({ reed: 12, water: 3 })
    for (const id of ['rainJar', 'reedRack', 'sootCatcher', 'inkJar', 'supplyChest']) expect(back.flags[`unlock:${id}`]).toBe(1)
    expect(back.flags).toMatchObject({ rackSeen: 1, sootDay: 1, sootCaught: 1, 'order:reedRack': 1 })
  })
  it('옛 저장(궤짝 칸이 없던 때)은 빈 궤짝', () => {
    const raw = JSON.parse(serialize(ready()))
    delete raw.chest
    expect(deserialize(JSON.stringify(raw), CONTENT)!.chest).toEqual({})
    raw.chest = { reed: 'x', fig: -1, water: 2 }
    expect(deserialize(JSON.stringify(raw), CONTENT)!.chest).toEqual({ water: 2 })
  })
  it('문구가 다 있다', () => {
    for (const id of ['inkJar', 'supplyChest'] as const) expect(ITEM_TEXT[id].name).toBeTruthy()
    for (const id of ['rainJar', 'inkJar']) expect((T.trades as Record<string, string>)[id]).toBeTruthy()
    for (const w of CARPENTER_WORKS) expect((T.easy.names as Record<string, string>)[w.id]).toBeTruthy()
  })
})

// ── 균형 시뮬레이션 (Global Constraints): 모든 것을 산 상태에서 한 권을 끝내는 속도가 예전의 1.5배를 넘지 않는다 ──

const answers = (book: Book, chapter: number) => blanksFor(book, chapter, copySourceFor(book)).map((b) => b.answer)
const smith = CONTENT.neighbors.find((n) => n.id === 'smith')!
const STOCK_AHEAD = 6

/**
 * 부지런한 기록자 한 사람의 하루들: 편지 나르는 이웃에게 받고, 재료를 만들고, 옮겨 적는다 (걷는 시간은 빼고 — 양쪽 같게).
 * 그을음은 대장장이 돕기(하루 한 번), 새 살림이 있으면 화덕을 일부러 써서 받이도 채운다 (가장 빨리 하려는 사람).
 * 편지 책을 차례로(로마서 → 고린도전서 …) 옮겨 적으며, 날마다 적은 장 수를 돌려준다
 */
function simulate(withNew: boolean, days: number): { perDay: number[]; bookDays: Partial<Record<Book, number>> } {
  const books: Book[] = ['rom', '1co', '2co', 'gal', 'eph', 'php', 'col', '1th', '2th', '1ti', '2ti']
  const s0 = newGame(CONTENT)
  let s: GameState = {
    ...s0,
    clock: { day: 3, minute: 6 * 60 },
    scenes: [],
    flags: { ...s0.flags, gospelFeast: 2, 'room:romPhm': 1, 'movedIn:carpenter': 1, 'movedIn:fisher': 1, 'movedIn:innkeeper': 1 },
    shelved: { mt: 2, mk: 1, lk: 1, jn: 0, ac: 1 },
    // 예전에도 살 수 있던 것은 모두 산 상태 (좋은 펜·넓은 책상·밝은 등잔)
    inv: { goodPen: 1, wideDesk: 1, brightLamp: 1, bread: 6, water: 2 },
  }
  if (withNew) s = { ...own(s, 'rainJar', 'reedRack', 'sootCatcher', 'inkJar', 'supplyChest'), flags: { ...own(s, 'rainJar', 'reedRack', 'sootCatcher', 'inkJar', 'supplyChest').flags, rackSeen: 1 } }
  const bookOf = (g: GameState) => books.find((b) => currentChapter(piecesOf(b), g.progress[b].completed) !== null) ?? null
  s = chooseBook(s, bookOf(s)!, CONTENT)
  const perDay: number[] = []
  const bookDays: Partial<Record<Book, number>> = {}
  for (let d = 0; d < days; d++) {
    const book = bookOf(s)
    if (!book) break
    if (s.activeBook !== book) s = chooseBook(s, book, CONTENT)
    s = listen(s, POSTMAN, CONTENT).state
    let done = 0
    for (let step = 0; step < 300 && s.clock.minute < 22 * 60; step++) {
      const before = s
      if (s.needs.hunger >= 60) {
        const e = eatBread(s)
        if (e) s = e
        else if (canCraft(s, 'bread') === null) s = finishCraft(s, 'bread')
        else if (stockOf(s, 'water') < 1) s = finishGather(s, 'well')
        else s = finishGather(s, 'field')
      } else if (s.needs.fatigue >= 70 || exhausted(s.needs)) s = restAt(s)
      else {
        const b = s.activeBook!
        const ch = currentChapter(piecesOf(b), s.progress[b].completed)
        const r = ch === null ? null : letterReady(s, b, ch, CONTENT)
        if (r?.kind === 'ready') {
          s = recordLetter(s, b, ch!, answers(b, ch!), CONTENT)
          done++
          if (currentChapter(piecesOf(b), s.progress[b].completed) === null) {
            bookDays[b] = d + 1
            const nb = bookOf(s)
            if (nb) s = listen(chooseBook(s, nb, CONTENT), POSTMAN, CONTENT).state
          }
        } else {
          // 받은 장이 없어도 다음을 위해 재료를 미리 만든다 (넉넉히 STOCK_AHEAD까지)
          const needInk = r?.kind === 'supplies' ? stockOf(s, 'ink') < 1 : stockOf(s, 'ink') < STOCK_AHEAD
          const needPap = r?.kind === 'supplies' ? stockOf(s, 'papyrus') < 1 : stockOf(s, 'papyrus') < STOCK_AHEAD
          if (needInk && stockOf(s, 'soot') >= 1 && stockOf(s, 'water') >= 1) s = finishCraft(s, 'ink')
          else if (needInk && stockOf(s, 'soot') >= 1) s = finishGather(s, 'well')
          else if (needInk && !s.helped.includes('smith')) s = finishHelp(s, smith)
          else if (needInk && withNew && catchSoot(s) !== s) s = warmByHearth(s)
          else if (needPap && stockOf(s, 'reed') >= 1) s = finishCraft(s, 'papyrus')
          else if (needPap) s = finishGather(s, 'reeds')
          else break
        }
      }
      if (s === before) break
    }
    perDay.push(done)
    s = goToSleep({ ...s, scenes: [] }, CONTENT)
  }
  return { perDay, bookDays }
}

describe('균형: 새 살림을 모두 갖춰도 한 권을 끝내는 속도는 예전의 1.5배를 넘지 않는다', () => {
  const DAYS = 28
  const before = simulate(false, DAYS)
  const after = simulate(true, DAYS)
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
  it('같은 날 수에 옮겨 적은 장 수 (예전 ≤ 지금 ≤ 예전 × 1.5)', () => {
    expect(sum(before.perDay)).toBeGreaterThan(0)
    expect(sum(after.perDay)).toBeGreaterThanOrEqual(sum(before.perDay))
    expect(sum(after.perDay)).toBeLessThanOrEqual(sum(before.perDay) * 1.5)
  })
  it('한 권을 끝낸 날 수 (지금 ≥ 예전 ÷ 1.5)', () => {
    for (const b of ['rom', '1co'] as Book[]) {
      expect(before.bookDays[b], b).toBeDefined()
      expect(after.bookDays[b]!, b).toBeGreaterThanOrEqual(before.bookDays[b]! / 1.5)
    }
  })
  it('하루 최대 장 수도 예전의 1.5배를 넘지 않는다', () => {
    expect(Math.max(...after.perDay)).toBeLessThanOrEqual(Math.max(...before.perDay) * 1.5)
  })
})
