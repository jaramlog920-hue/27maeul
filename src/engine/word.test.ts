// 계획 14 작업 5: 말씀 조각은 드물게 (편지·특별한 대화, 일주일에 몇 번), 평소 대화엔 직업 선물, 받은 기록
import { CONTENT } from '../content/catalog'
import { fragmentWayOf, FRAGMENTS_PER_WEEK, talkGiftOf, WEEK_DAYS } from './fragments'
import { VISIT_GIFTS } from './bonds'
import {
  chooseBook,
  giveGift,
  goToSleep,
  listen,
  newGame,
  openMailbox,
  receiveTalkGift,
  writeVerse,
  type GameState,
} from './game'
import { copyVerses } from './copying'
import { deserialize, sanitize, serialize } from './save'
import { POSTMAN } from './post'
import type { NeighborDef } from './types'

/** 하루를 지낸다 (낮 열 시에 잠들어 다음 날 아침) */
const sleep = (s: GameState) => goToSleep({ ...s, clock: { ...s.clock, minute: 20 * 60 } }, CONTENT)
const fresh = (): GameState => ({ ...newGame(CONTENT), scenes: [] })

describe('조각은 드물게', () => {
  it('날마다 이웃 여섯이 건네던 조각이 사라지고, 한 주에 몇 번만 — 편지 또는 특별한 대화 한 명', () => {
    let s = chooseBook(fresh(), 'lk', CONTENT)
    let days = 0
    for (let i = 0; i < WEEK_DAYS * 4; i++) {
      s = sleep(s)
      const n = Object.keys(s.offers).length + s.post.length
      expect(n, `day ${s.clock.day}`).toBeLessThanOrEqual(1)
      if (n) days++
      if (fragmentWayOf(s.clock.day) === null) expect(n).toBe(0)
    }
    // 궂은 날·다 받은 날이 아니면 조각 오는 날마다 하나
    expect(days).toBeGreaterThanOrEqual(FRAGMENTS_PER_WEEK * 4 - 2)
    expect(days).toBeLessThanOrEqual(FRAGMENTS_PER_WEEK * 4)
  })
  it('책을 고르지 않은 새 게임에도 조각이 온다 (필사하는 책과 묶지 않는다)', () => {
    let s = fresh()
    let got = 0
    for (let i = 0; i < 14; i++) {
      s = sleep(s)
      got += Object.keys(s.offers).length + s.post.length
    }
    expect(got).toBeGreaterThan(0)
  })
  it('책을 골라도(옛 흐름) 오늘의 조각이 다시 정해지지 않는다', () => {
    const s = { ...fresh(), offers: { baker: 'mk-001-001' }, post: [] }
    expect(chooseBook(s, 'lk', CONTENT).offers).toEqual({ baker: 'mk-001-001' })
  })
})

describe('조각 받기와 받은 기록', () => {
  it('특별한 대화: 그 이웃에게 받으면 도감에 들어가고 "그 이웃에게 받은 조각"·받은 날이 남는다', () => {
    const s = { ...fresh(), clock: { day: 330, minute: 600 }, offers: { baker: 'mk-002-001' } }
    const r = listen(s, 'baker', CONTENT)
    expect(r.pieceId).toBe('mk-002-001')
    expect(r.state.collected).toContain('mk-002-001')
    expect(r.state.pieceLog['mk-002-001']).toEqual({ day: 330, from: 'npc:baker' })
    expect(r.state.offers).toEqual({})
  })
  it('편지: 편지 나르는 이웃에게서든 문 앞 바구니에서든 한 번 — 고른 책과 상관없이, "편지로 받은 조각"', () => {
    const s = { ...fresh(), clock: { day: 9, minute: 600 }, post: ['jn-003-001'] }
    const a = listen(s, POSTMAN, CONTENT)
    expect(a.pieceIds).toEqual(['jn-003-001'])
    expect(a.state.pieceLog['jn-003-001']).toEqual({ day: 9, from: 'letter' })
    expect(openMailbox(a.state, CONTENT).pieceIds).toEqual([])
    const b = openMailbox(s, CONTENT)
    expect(b.pieceIds).toEqual(['jn-003-001'])
    expect(b.state.collected).toContain('jn-003-001')
    expect(listen(b.state, POSTMAN, CONTENT).pieceIds).toEqual([])
  })
  it('선물은 마음만 오른다 — 친한 이웃에게 선물해도 조각을 주지 않는다 (직업·선물과 조각을 묶지 않는다)', () => {
    const def = CONTENT.neighbors.find((n) => n.id === 'baker') as NeighborDef
    const r = giveGift({ ...chooseBook(fresh(), 'lk', CONTENT), inv: { grapes: 2 }, hearts: { baker: 100 } }, def, 'grapes', CONTENT)!
    expect(r.pieceId).toBeUndefined()
    expect(r.state.collected).toEqual([])
  })
  it('필사로 장을 마쳐도 조각은 받지 않는다 — 불러온 뒤에도 (예전에 엮은 장만 예전처럼)', () => {
    let s: GameState = { ...fresh(), copy: { book: 'phm', at: {}, legacy: {} } }
    for (const v of copyVerses('phm', 1, CONTENT)) s = writeVerse(s, 'phm', v.text, CONTENT).state
    expect(s.progress.phm.completed).toEqual([1])
    expect(s.collected).toEqual([])
    expect(deserialize(serialize(s), CONTENT)!.collected).toEqual([])
    // 필사 칸이 없던 옛 저장: 마친 장의 조각은 모은 것으로 (예전 그대로)
    const old = JSON.parse(serialize({ ...fresh(), progress: { ...fresh().progress, phm: { completed: [1], arrangement: {} } } }))
    delete old.copy
    expect(deserialize(JSON.stringify(old), CONTENT)!.collected).toContain('phm-001')
  })
  it('옛 저장(받은 기록 칸이 없던 때)도 불러오고, 기록은 비어 있다 — 받은 조각은 그대로', () => {
    const o = JSON.parse(serialize({ ...fresh(), collected: ['mk-001-001'] }))
    delete o.pieceLog
    const back = deserialize(JSON.stringify(o), CONTENT)!
    expect(back.collected).toContain('mk-001-001')
    expect(back.pieceLog).toEqual({})
    const kept = sanitize({ ...back, pieceLog: { 'mk-001-001': { day: 4, from: 'letter' }, nope: { day: 1, from: 'letter' } } }, CONTENT)
    expect(kept.pieceLog).toEqual({ 'mk-001-001': { day: 4, from: 'letter' } })
  })
})

describe('평소 대화의 직업 선물', () => {
  it('마음이 열린 이웃은 가끔 말을 걸 때 자기 일의 물건을 챙겨 준다 — 하루 한 번', () => {
    let s: GameState = { ...fresh(), hearts: { baker: 100 }, inv: {} }
    let day = 1
    let r = null
    for (; day < 60 && !r; day++) r = receiveTalkGift({ ...s, clock: { day, minute: 600 } }, 'baker')
    expect(r).not.toBeNull()
    expect(r!.gift).toEqual(VISIT_GIFTS.baker)
    s = r!.state
    expect(s.inv.bread).toBe(VISIT_GIFTS.baker.bread)
    expect(receiveTalkGift(s, 'baker')).toBeNull()
    // 특별한 대화가 있는 날엔 조각을 건넨다 (선물과 겹치지 않는다)
    expect(receiveTalkGift({ ...r!.state, flags: {}, offers: { baker: 'mk-001-001' } }, 'baker')).toBeNull()
  })
  it('조각을 건네받은 날엔 같은 이웃이 직업 선물을 또 주지 않고, 다음 날부터는 다시 줄 수 있다', () => {
    const base: GameState = { ...fresh(), hearts: { baker: 100 }, inv: {} }
    const gives = (d: number) => talkGiftOf('baker', d, base.hearts, {}) !== null
    const day = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => gives(d) && gives(d + 1))
    // 이틀 연속 선물이 걸리는 날이 없으면, 선물이 걸리는 날과 그다음 걸리는 날로 확인한다
    const d1 = day ?? Array.from({ length: 60 }, (_, i) => i + 1).find(gives)!
    const d2 = day ? day + 1 : Array.from({ length: 60 }, (_, i) => i + d1 + 1).find(gives)!
    const heard = listen({ ...base, clock: { day: d1, minute: 600 }, offers: { baker: 'mk-001-001' } }, 'baker', CONTENT)
    expect(heard.pieceId).toBe('mk-001-001')
    expect(heard.state.offers).toEqual({})
    expect(receiveTalkGift(heard.state, 'baker')).toBeNull()
    expect(receiveTalkGift({ ...heard.state, clock: { day: d2, minute: 600 } }, 'baker')).not.toBeNull()
  })
})
