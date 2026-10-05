import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { JOURNAL_NOTES, SCENES } from '../content/text'
import { CHILD_AFTER_WEDDING, CHILD_NAMES, childStage, helperSpot, HELPER_AT, helpStat, HELPER_SPOTS, CRADLE_SPOT, inheritBorn, newChild, nextName, sanitizeChild, TODDLER_AT } from './child'
import { goToSleep, nameChild, newGame, type GameState } from './game'
import { deserialize, serialize } from './save'
import { freshStats } from './stats'
import { isWalkable } from './world'
import { NO_ROMANCE } from './romance'

const married = (day = 10): GameState => {
  const s = newGame(CONTENT)
  return { ...s, homeLevel: 1, clock: { ...s.clock, day, minute: 22 * 60 }, romance: { ...NO_ROMANCE, partner: 'tilly', stage: 'married', marriedDay: day } }
}
const sleepUntil = (s: GameState, day: number): GameState => {
  let g = s
  while (g.clock.day < day) g = goToSleep({ ...g, clock: { ...g.clock, minute: 22 * 60 } }, CONTENT)
  return g
}

describe('아이 (계획 12)', () => {
  it('물려받기: 플레이어 단계 4 이상 +1, 배우자 집안 능력치 +1, 최대 2', () => {
    const player = freshStats()
    player.wit = { level: 4, xp: 0, born: 0 }
    player.strength = { level: 5, xp: 0, born: 0 }
    expect(inheritBorn(player, 'strength')).toEqual({ wit: 1, strength: 2 })
    expect(inheritBorn(freshStats(), 'luck')).toEqual({ luck: 1 })
  })

  it('가장 높은 타고난 값의 일을 하고, 같으면 배우자 쪽을 먼저', () => {
    const c = newChild(3, freshStats(), 'hand')
    expect(helpStat(c)).toBe('hand')
    const player = freshStats()
    player.wit = { level: 4, xp: 0, born: 0 }
    expect(helpStat(newChild(3, player, 'luck'))).toBe('luck')
  })

  it('이름은 목록 안에서, 다른 이름으로 돌아가며 뽑는다', () => {
    const c = newChild(5, freshStats(), 'charm')
    expect(CHILD_NAMES[c.look]).toContain(c.name)
    const seen = new Set([c.name])
    let n = c.name
    for (let i = 0; i < 3; i++) seen.add((n = nextName({ name: n, look: c.look })))
    expect(seen.size).toBe(4)
  })

  it('결혼하고 두 이레 뒤 아침에 태어나고, 이름을 정한다', () => {
    const s = married(10)
    const before = sleepUntil(s, 10 + CHILD_AFTER_WEDDING - 1)
    expect(before.child).toBeNull()
    const born = sleepUntil(before, 10 + CHILD_AFTER_WEDDING)
    expect(born.child?.born).toBe(10 + CHILD_AFTER_WEDDING)
    expect(born.scenes).toContain('childBorn')
    expect(born.flags.childNaming).toBe(1)
    const named = nameChild(born, '핀')
    expect(named.child?.name).toBe('핀')
    expect(named.flags.childNaming).toBeUndefined()
    expect(born.child?.stats.strength.born).toBe(1)
  })

  it('결혼하지 않았으면 아이는 없다', () => {
    const s = sleepUntil({ ...newGame(CONTENT), clock: { ...newGame(CONTENT).clock, minute: 22 * 60 } }, 40)
    expect(s.child).toBeNull()
  })

  it('아기 → 걷는 아이 → 돕는 아이, 돕는 아이는 하루 한 번 (틸리네 아이는 근력: 물·갈대)', () => {
    const born = nameChild(sleepUntil(married(10), 24), '루시')
    expect(childStage(born.child!, born.clock.day)).toBe('baby')
    const walks = sleepUntil(born, 24 + TODDLER_AT)
    expect(childStage(walks.child!, walks.clock.day)).toBe('toddler')
    expect(walks.scenes).toContain('childWalks')
    const helps = sleepUntil(walks, 24 + HELPER_AT)
    expect(helps.scenes).toContain('childHelps')
    expect(helps.flags.childHelpDay).toBe(helps.clock.day)
    expect(helps.todayNotes).toContain('childHelp:strength')
    expect(helps.child!.stats.strength.xp + (helps.child!.stats.strength.level - 1) * 1000).toBeGreaterThan(0)
  })

  it('장면·일지 문구가 모두 있다', () => {
    for (const id of ['childBorn', 'childWalks', 'childHelps']) {
      expect(SCENES[id], id).toBeDefined()
      expect(JOURNAL_NOTES[id], id).toBeDefined()
    }
    for (const k of ['wit', 'hand', 'charm', 'strength', 'luck']) expect(JOURNAL_NOTES[`childHelp:${k}`]).toBeDefined()
  })

  it('돕는 아이가 서는 자리는 걸을 수 있는 칸', () => {
    for (const h of HELPER_SPOTS) expect(isWalkable(h.at), `${h.at.x},${h.at.y}`).toBe(true)
    expect(helperSpot(3 * 60)).toEqual(CRADLE_SPOT)
  })

  it('저장했다 불러와도 아이가 이어진다', () => {
    const born = nameChild(sleepUntil(married(10), 24), '오티스')
    const back = deserialize(serialize(born), CONTENT)!
    expect(back.child?.name).toBe('오티스')
    expect(sanitizeChild({ name: 3 })).toBeNull()
  })
})

describe('어른이 된 아이', () => {
  it('능력치는 진로에 반영되지만 높은 점수로 자동 이주하지 않는다', async () => {
    const { adultJob } = await import('./child')
    const low = freshStats()
    low.hand = { level: 2, xp: 0, born: 0 }
    expect(adultJob({ stats: low, lean: null })).toMatchObject({ job: 'woodworker', left: false })
    const high = freshStats()
    high.wit = { level: 5, xp: 0, born: 0 }
    expect(adultJob({ stats: high, lean: 'hand' })).toMatchObject({ job: 'scholar', left: false })
  })

  it('기존 이주 선택을 유지하고 떠난 성인 자식은 지도에서 보이지 않는다', async () => {
    const { ADULT_AT } = await import('./child')
    const { childTile } = await import('./game')
    const s0 = nameChild(sleepUntil(married(10), 24), '재스퍼')
    const high = freshStats()
    high.strength = { level: 5, xp: 0, born: 0 }
    const grown = sleepUntil({ ...s0, child: { ...s0.child!, stats: high, left: true } }, 24 + ADULT_AT)
    expect(grown.child!.job).toBe('sailor')
    expect(grown.child!.left).toBe(true)
    expect(grown.scenes).toContain('childLeaves')
    expect(childTile(grown)).toBeNull()
    expect(grown.todayNotes.some((n) => n.startsWith('childHelp:'))).toBe(false)
  })

  it('남든 떠나든 가끔 편지·선물·닢이 온다 (한 달에 몇 번)', async () => {
    const { kidMailFor } = await import('./child')
    let away = 0
    let stay = 0
    for (let d = 100; d < 160; d++) {
      if (kidMailFor({ born: 20, left: true }, d)) away++
      if (kidMailFor({ born: 20, left: false }, d)) stay++
    }
    expect(away).toBeGreaterThan(stay)
    expect(stay).toBeGreaterThan(0)
  })

  it('편지·선물·닢 문구와 일 이름이 모두 있다', async () => {
    const { JOB_GIFTS } = await import('./child')
    const { JOB_NAME, KID_LETTERS } = await import('../content/text')
    for (const j of Object.keys(JOB_GIFTS)) expect(JOB_NAME[j], j).toBeDefined()
    expect(KID_LETTERS.length).toBeGreaterThan(3)
    for (const id of ['childStays', 'childLeaves']) expect(SCENES[id]).toBeDefined()
    for (const k of ['letter', 'gift', 'coins']) expect(JOURNAL_NOTES[`kidMail:${k}`]).toBeDefined()
  })
})


describe('확장된 자식 진로와 저장 호환',()=>{
 it('16종 모두 기존 가방에서 지원하는 선물을 갖는다',async()=>{
  const {ADULT_JOBS,JOB_GIFTS}=await import('./child')
  const {JOB_NAME}=await import('../content/text')
  expect(ADULT_JOBS).toHaveLength(16)
  for(const j of ADULT_JOBS){expect(JOB_NAME[j]).toBeTruthy();expect(Object.keys(JOB_GIFTS[j]).length).toBeGreaterThan(0)}
 })
 it('활동에서 얻은 관심으로 요리 진로를 제안하며 거주지를 바꾸지 않는다',async()=>{
  const {addCareerInterest,adultJob,newChild}=await import('./child')
  const c=addCareerInterest(newChild(1,freshStats(),undefined),['cook'])
  expect(adultJob(c)).toMatchObject({job:'cook',left:false})
  expect(adultJob({...c,left:true})).toMatchObject({job:'cook',left:true})
 })
 it('기존 확정 직업을 보존하고 새로운 미확정 진로와 관심도 저장한다',()=>{
  const base={name:'루시',look:'girl',born:1,stats:freshStats(),lean:null}
  expect(sanitizeChild({...base,job:'scholar',left:true})).toMatchObject({job:'scholar',left:true,jobConfirmed:true})
  expect(sanitizeChild({...base,job:'potter',left:false,jobConfirmed:false,interests:{potter:3,cook:Infinity,unknown:9}})).toMatchObject({job:'potter',jobConfirmed:false,interests:{potter:3}})
  expect(sanitizeChild({...base,job:'toString'})?.job).toBeUndefined()
 })
})
