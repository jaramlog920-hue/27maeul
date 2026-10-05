// 계획 16 작업 2: 경험 기억(고유 ID·횟수·최근 날짜)과 조건별 대화(이야기·관계·최근 경험)
import { CONTENT, PEOPLE } from '../content/catalog'
import { chooseInEvent, giveGift, newGame, personLine, type GameState } from './game'
import {
  hasMemory,
  NO_LIFE,
  pickLine,
  recordExperience,
  relOf,
  reqMet,
  sanitizeLife,
  setPeopleData,
  type Life,
  type Moment,
  type Person,
  type ReqCtx,
} from './people'
import { deserialize, serialize } from './save'

const M = (day: number): Moment => ({ day, minute: 600, weather: 'sunny', season: 'spring' })
const ctx = (life: Life, extra: Partial<ReqCtx> = {}): ReqCtx => ({ life, npc: 'tilly', day: 10, lover: false, suitor: true, threads: [], ...extra })

afterAll(() => setPeopleData(PEOPLE))

describe('경험 기록 (recordExperience)', () => {
  it('같은 경험 두 번 → 한 항목, 횟수 2·최근 날짜만 바뀐다 (처음 날짜는 그대로)', () => {
    let life = recordExperience(NO_LIFE, { id: 'story:carpenterChair', kind: 'story', with: ['carpenter', 'rudy'] }, M(5))
    life = recordExperience(life, { id: 'story:carpenterChair', kind: 'story', with: ['carpenter', 'rudy'] }, M(9))
    expect(Object.keys(life.experiences)).toEqual(['story:carpenterChair'])
    expect(life.experiences['story:carpenterChair']).toMatchObject({ count: 2, first: 5, last: 9 })
  })

  it('참여한 주민마다 기억 표식 exp:<id>는 한 번만, 참여하지 않은 주민은 기억 없음', () => {
    let life = recordExperience(NO_LIFE, { id: 'story:carpenterChair', kind: 'story', with: ['carpenter', 'rudy'] }, M(5))
    life = recordExperience(life, { id: 'story:carpenterChair', kind: 'story', with: ['carpenter', 'rudy'] }, M(9))
    expect(life.memories.carpenter.filter((m) => m.tag === 'exp:story:carpenterChair')).toHaveLength(1)
    expect(life.memories.carpenter[0]).toMatchObject({ day: 5, weather: 'sunny', season: 'spring' })
    expect(hasMemory(life, 'rudy', 'exp:story:carpenterChair')).toBe(true)
    expect(hasMemory(life, 'smith', 'exp:story:carpenterChair')).toBe(false)
  })

  it('다음에 새로 함께한 주민은 참여자에 더해지고 그 사람만 새 기억', () => {
    let life = recordExperience(NO_LIFE, { id: 'work:roof', kind: 'work', with: ['carpenter'] }, M(5))
    life = recordExperience(life, { id: 'work:roof', kind: 'work', with: ['carpenter', 'smith'] }, M(7))
    expect(life.experiences['work:roof'].with).toEqual(['carpenter', 'smith'])
    expect(life.memories.smith.map((m) => m.tag)).toEqual(['exp:work:roof'])
    expect(life.memories.carpenter).toHaveLength(1)
  })

  it('기존 기억(memories)은 지우거나 옮기지 않는다', () => {
    const old: Life = { ...NO_LIFE, memories: { tilly: [{ tag: 'rain', day: 2, weather: 'rain', season: 'spring' }] } }
    const life = recordExperience(old, { id: 'choice:first', kind: 'choice', with: ['tilly'], choice: 0 }, M(4))
    expect(life.memories.tilly.map((m) => m.tag)).toEqual(['rain', 'exp:choice:first'])
  })

  it('날짜 미상(null)으로 남은 경험은 다시 겪어도 처음 날짜를 지어내지 않는다', () => {
    const old = sanitizeLife({ ...NO_LIFE, experiences: { 'gift:tilly': { id: 'gift:tilly', kind: 'gift', with: ['tilly'], first: null, last: null, count: 1 } } })
    expect(old.experiences['gift:tilly'].first).toBeNull()
    const life = recordExperience(old, { id: 'gift:tilly', kind: 'gift', with: ['tilly'] }, M(12))
    expect(life.experiences['gift:tilly']).toMatchObject({ first: null, last: 12, count: 2 })
  })
})

describe('옛 저장과 정리 (sanitizeLife)', () => {
  it('experiences가 없으면 빈 값, 모양이 틀린 항목은 버린다', () => {
    const { experiences: _drop, ...old } = NO_LIFE
    expect(sanitizeLife(old).experiences).toEqual({})
    const life = sanitizeLife({
      ...old,
      experiences: {
        ok: { id: 'ok', kind: 'visit', with: ['tilly'], first: 3, last: 4, count: 2, place: 'tea' },
        badKind: { id: 'badKind', kind: 'dance', with: [], first: 1, last: 1, count: 1 },
        badCount: { id: 'badCount', kind: 'visit', with: [], first: 1, last: 1, count: 0 },
        badWith: { id: 'badWith', kind: 'visit', with: 'tilly', first: 1, last: 1, count: 1 },
        wrongKey: { id: 'other', kind: 'visit', with: [], first: 1, last: 1, count: 1 },
        badDay: { id: 'badDay', kind: 'visit', with: [], first: 'yesterday', last: 1, count: 1 },
        nope: 3,
      },
    })
    expect(Object.keys(life.experiences)).toEqual(['ok'])
    expect(life.experiences.ok.place).toBe('tea')
  })

  it('옛 저장(life에 experiences 없음)을 불러와도 이미 본 것·기억은 그대로, 경험은 빈 값', () => {
    const s = newGame(CONTENT)
    const raw = JSON.parse(serialize({ ...s, life: { ...NO_LIFE, seen: ['first'], memories: { tilly: [{ tag: 'rain', day: 1, weather: 'rain', season: 'spring' }] } } }))
    delete raw.life.experiences
    const back = deserialize(JSON.stringify(raw), CONTENT)!
    expect(back.life.experiences).toEqual({})
    expect(back.life.seen).toEqual(['first'])
    expect(hasMemory(back.life, 'tilly', 'rain')).toBe(true)
  })

  it('저장·불러오기 뒤에도 같은 경험은 한 항목 (다시 기록하면 횟수만)', () => {
    const s = newGame(CONTENT)
    const life = recordExperience(s.life, { id: 'trip:dock', kind: 'trip', with: ['fisher'] }, M(3))
    const back = deserialize(serialize({ ...s, life }), CONTENT)!
    const again = recordExperience(back.life, { id: 'trip:dock', kind: 'trip', with: ['fisher'] }, M(4))
    expect(Object.keys(again.experiences)).toEqual(['trip:dock'])
    expect(again.experiences['trip:dock'].count).toBe(2)
    expect(again.memories.fisher).toHaveLength(1)
  })
})

describe('조건 (reqMet 확장)', () => {
  it('관계 rel: 친구·가까운 친구·연인·배우자', () => {
    expect(relOf(2, null)).toBeNull()
    expect(relOf(3, null)).toBe('friend')
    expect(relOf(4, null)).toBe('close')
    expect(relOf(1, 'dating')).toBe('lover')
    expect(relOf(5, 'engaged')).toBe('lover')
    expect(relOf(5, 'married')).toBe('spouse')
    const r = { rel: ['friend', 'close'] as ('friend' | 'close')[] }
    expect(reqMet(r, ctx(NO_LIFE, { stage: 3 }))).toBe(true)
    expect(reqMet(r, ctx(NO_LIFE, { stage: 2 }))).toBe(false)
    expect(reqMet(r, ctx(NO_LIFE, { stage: 5, romance: 'married', lover: true }))).toBe(false)
    expect(reqMet({ rel: ['spouse'] }, ctx(NO_LIFE, { stage: 5, romance: 'married', lover: true }))).toBe(true)
    expect(reqMet({ rel: ['spouse'] }, ctx(NO_LIFE, { stage: 5, romance: 'dating', lover: true }))).toBe(false)
  })

  it('minStage: 사이 단계 이상', () => {
    expect(reqMet({ minStage: 3 }, ctx(NO_LIFE, { stage: 3 }))).toBe(true)
    expect(reqMet({ minStage: 3 }, ctx(NO_LIFE, { stage: 2 }))).toBe(false)
    expect(reqMet({ minStage: 1 }, ctx(NO_LIFE))).toBe(false)
  })

  it('story: 완료 표식, 갈래(outcome)는 그 갈래만 / notStory', () => {
    const done = { flags: { 'story:carpenterChair': 1, 'story:wendellPath': 2 } }
    expect(reqMet({ story: [{ id: 'carpenterChair' }] }, ctx(NO_LIFE, done))).toBe(true)
    expect(reqMet({ story: [{ id: 'carpenterChair' }] }, ctx(NO_LIFE))).toBe(false)
    expect(reqMet({ story: [{ id: 'wendellPath', outcome: 1 }] }, ctx(NO_LIFE, done))).toBe(true)
    expect(reqMet({ story: [{ id: 'wendellPath', outcome: 0 }] }, ctx(NO_LIFE, done))).toBe(false)
    expect(reqMet({ notStory: ['carpenterChair'] }, ctx(NO_LIFE, done))).toBe(false)
    expect(reqMet({ notStory: ['smithHook'] }, ctx(NO_LIFE, done))).toBe(true)
  })

  it('exp·notExp·recent: 그 주민이 실제로 함께한 경험만, 최근 n일 안', () => {
    const life = recordExperience(NO_LIFE, { id: 'story:carpenterChair', kind: 'story', with: ['tilly'] }, M(5))
    expect(reqMet({ exp: ['story:carpenterChair'] }, ctx(life))).toBe(true)
    expect(reqMet({ exp: ['story:carpenterChair'] }, ctx(life, { npc: 'smith' }))).toBe(false)
    expect(reqMet({ notExp: ['story:carpenterChair'] }, ctx(life))).toBe(false)
    expect(reqMet({ notExp: ['story:carpenterChair'] }, ctx(NO_LIFE))).toBe(true)
    expect(reqMet({ recent: { exp: 'story:carpenterChair', days: 3 } }, ctx(life, { day: 8 }))).toBe(true)
    expect(reqMet({ recent: { exp: 'story:carpenterChair', days: 3 } }, ctx(life, { day: 9 }))).toBe(false)
    expect(reqMet({ recent: { exp: 'story:carpenterChair', days: 3 } }, ctx(life, { npc: 'smith', day: 6 }))).toBe(false)
    // 날짜 미상 경험은 "최근"이 아니다
    const unknown = sanitizeLife({ ...NO_LIFE, experiences: { x: { id: 'x', kind: 'visit', with: ['tilly'], first: null, last: null, count: 1 } } })
    expect(reqMet({ recent: { exp: 'x', days: 99 } }, ctx(unknown))).toBe(false)
    expect(reqMet({ exp: ['x'] }, ctx(unknown))).toBe(true)
  })

  it('seenAny: 둘 중 하나라도 봤으면 / placed: 그 소품이 놓였을 때', () => {
    const life = { ...NO_LIFE, seen: ['rudy:shelf'] }
    expect(reqMet({ seenAny: ['rudy:library', 'rudy:shelf'] }, ctx(life))).toBe(true)
    expect(reqMet({ seenAny: ['rudy:library'] }, ctx(life))).toBe(false)
    expect(reqMet({ placed: 'carpenterChair' }, ctx(NO_LIFE))).toBe(false)
    expect(reqMet({ placed: 'carpenterChair' }, ctx(NO_LIFE, { placed: ['carpenterChair'] }))).toBe(true)
  })

  it('기존 필드 뜻은 그대로 (새 칸이 없는 옛 문맥에서도)', () => {
    const life = { ...NO_LIFE, seen: ['a'] }
    expect(reqMet({ seen: ['a'], lover: false }, ctx(life))).toBe(true)
    expect(reqMet({ notSeen: ['a'] }, ctx(life))).toBe(false)
  })
})

describe('말 고르기 (pickLine) — 최근 경험 말 먼저, 연속 반복 없음', () => {
  const P: Person = {
    id: 'tilly',
    pace: 1,
    routines: [],
    lines: [
      { id: 'plain', text: '평소 말', depth: 0 },
      { id: 'deep', text: '깊은 말', depth: 2 },
      { id: 'after', text: '그 일 뒤의 말', depth: 1, req: { story: [{ id: 'carpenterChair' }] } },
      { id: 'fresh', text: '엊그제 그 일', depth: 0, req: { recent: { exp: 'story:carpenterChair', days: 3 } } },
    ],
  }
  const m = M(10)
  const base = { ...ctx(NO_LIFE), m, depth: 2, cool: false, here: { x: 0, y: 0 }, stage: 4 as const }

  it('아직 없는 경험·이야기를 거는 말은 나오지 않는다', () => {
    for (const r of [0, 0.5, 0.99]) expect(['plain', 'deep']).toContain(pickLine(P, base, r)?.id)
  })

  it('최근 경험 말이 일반 말보다 먼저, 한 번 하면 다음엔 다른 말 (이야기 뒤 말이 그다음)', () => {
    const life = recordExperience(NO_LIFE, { id: 'story:carpenterChair', kind: 'story', with: ['tilly'] }, M(9))
    const c = { ...base, life, flags: { 'story:carpenterChair': 1 } }
    for (const r of [0, 0.5, 0.99]) expect(pickLine(P, c, r)?.id).toBe('fresh')
    const said = { ...c, life: { ...life, recent: { tilly: ['fresh'] } } }
    expect(pickLine(P, said, 0)?.id).toBe('after')
    // 날이 지나 최근이 아니면 그 말은 빠진다
    expect(pickLine(P, { ...c, day: 20, m: M(20) }, 0)?.id).toBe('after')
  })
})

describe('게임 안의 기록 입구 (game.ts)', () => {
  const TEST: Person = {
    id: 'tilly',
    pace: 1,
    routines: [],
    lines: [
      { id: 'plain', text: '평소 말', depth: 0 },
      { id: 'wife', text: '오늘 저녁은 내가 할게요.', depth: 3, req: { rel: ['spouse'] } },
      { id: 'dating', text: '이따 정자에서 봐요.', depth: 3, req: { rel: ['lover'] } },
      { id: 'friendOnly', text: '친구로서 하는 말', depth: 1, req: { rel: ['friend', 'close'] } },
    ],
    events: [
      {
        id: 'first',
        title: '풀무',
        stage: 1,
        at: { x: 32, y: 26 },
        lines: [{ speaker: 'tilly', text: '밟아 볼래요?' }],
        choices: [{ label: '밟는다', color: 'warm', memory: 'bellows', reply: [{ speaker: 'tilly', text: '잘하네요!' }] }],
      },
    ],
  }
  beforeEach(() => setPeopleData({ people: { tilly: TEST }, threads: [] }))
  const s0 = (): GameState => ({ ...newGame(CONTENT), clock: { ...newGame(CONTENT).clock, day: 4, minute: 600 } })

  it('이벤트 선택은 choice 경험 (그 사람만, 고른 갈래)', () => {
    const s = chooseInEvent({ ...s0(), life: { ...NO_LIFE, seen: ['first'] } }, 'first', 0)
    expect(s.life.experiences['choice:first']).toMatchObject({ kind: 'choice', with: ['tilly'], choice: 0, count: 1, first: 4 })
    expect(hasMemory(s.life, 'tilly', 'exp:choice:first')).toBe(true)
    expect(hasMemory(s.life, 'tilly', 'bellows')).toBe(true)
  })

  it('좋아한 선물은 그 사람에게 첫 번째만 경험으로 (다음 선물은 기록하지 않는다)', () => {
    const def = CONTENT.neighbors.find((n) => n.id === 'tilly')!
    const item = def.likes[0]
    const s = { ...s0(), inv: { ...s0().inv, [item]: 3 } }
    const once = giveGift(s, def, item)!.state
    expect(once.life.experiences['gift:tilly']).toMatchObject({ kind: 'gift', item, count: 1, first: 4 })
    const twice = giveGift({ ...once, gifted: [], clock: { ...once.clock, day: 5 } }, def, item)!.state
    expect(twice.life.experiences['gift:tilly']).toMatchObject({ count: 1, last: 4 })
  })

  it('말: 배우자·연인·친구에게 맞는 말만 (rel)', () => {
    const base = s0()
    const married: GameState = { ...base, hearts: { tilly: 90 }, romance: { partner: 'tilly', stage: 'married', since: 1, weddingDay: null, marriedDay: 2 } }
    const datingS: GameState = { ...base, hearts: { tilly: 90 }, romance: { partner: 'tilly', stage: 'dating', since: 1, weddingDay: null, marriedDay: null } }
    const friend: GameState = { ...base, hearts: { tilly: 40 } }
    const said = (s: GameState) => new Set([0, 0.3, 0.6, 0.99].map((r) => personLine(s, 'tilly', r)?.text))
    expect(said(married)).toContain('오늘 저녁은 내가 할게요.')
    expect(said(married)).not.toContain('이따 정자에서 봐요.')
    expect(said(married)).not.toContain('친구로서 하는 말')
    expect(said(datingS)).toContain('이따 정자에서 봐요.')
    expect(said(datingS)).not.toContain('오늘 저녁은 내가 할게요.')
    expect(said(friend)).toContain('친구로서 하는 말')
    expect(said(friend)).not.toContain('오늘 저녁은 내가 할게요.')
  })
})
