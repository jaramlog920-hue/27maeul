// 2026-10-21 중후반 손질 (플레이 점검 → 사용자 "알아서 판단하고 싹 다 고쳐줘")
import DREAMS from '../content/dream-lines.json'
import { forbiddenIn } from '../content/forbidden'
import { CONTENT } from '../content/catalog'
import { withCatch } from './persona'
import { markTogether } from './family'
import { nextUnlock } from './feature-rules'
import { gameAtChapters } from './growth-test-support'
import { visitNpcDream, DREAM_JOB_NPCS, NPC_DREAM_GIFT_GAP } from './kid-work'
import { drawOtPiece } from './ot-pieces'
import type { GameState } from './game'

describe('이웃 꿈터마다 다른 이야기', () => {
  it('꿈 이야기를 들려줄 수 있는 이웃 모두에게 꿈·문 연 날·말 넷이 있고 금지어가 없다', () => {
    const d = DREAMS as Record<string, { heard: string; open: string; lines: string[] }>
    for (const id of DREAM_JOB_NPCS) {
      expect(d[id], id).toBeDefined()
      expect(d[id].lines).toHaveLength(4)
      for (const s of [d[id].heard, d[id].open, ...d[id].lines]) { expect(forbiddenIn(s), s).toBeNull(); expect(s.includes('당신')).toBe(false) }
    }
  })
  it('처음 들르면 문 연 날, 그 뒤 이레마다 그 이웃이 늘 건네던 것을 챙겨 준다', () => {
    const s = { ...gameAtChapters(CONTENT, 260), clock: { day: 300, minute: 600 } } as GameState
    const first = visitNpcDream(s, 'baker')
    expect(first.first).toBe(true)
    expect(visitNpcDream(first.state, 'baker').gift).toBeUndefined()
    const later = visitNpcDream({ ...first.state, clock: { day: 300 + NPC_DREAM_GIFT_GAP, minute: 600 } }, 'baker')
    expect(later.gift).toEqual({ bread: 2 })
  })
})

describe('말버릇 붙이기', () => {
  it('물음 뒤에는 안 붙고, 앞에 오는 말은 앞에', () => {
    expect(withCatch('들어 보실래요?', '좋아')).toBe('들어 보실래요?')
    expect(withCatch('오늘 비가 와요.', '있잖아')).toBe('있잖아, 오늘 비가 와요.')
    expect(withCatch('배고파!', '냠냠')).toBe('배고파, 냠냠!')
  })
})

describe('결혼 뒤 함께한 날', () => {
  it('부부가 함께한 날은 하루에 한 번만 센다', () => {
    const s = { flags: {}, clock: { day: 10, minute: 0 }, romance: { stage: 'married' } } as never
    const once = markTogether(s) as { flags: Record<string, number> }
    expect(once.flags.togetherDays).toBe(1)
    expect((markTogether(once as never) as { flags: Record<string, number> }).flags.togetherDays).toBe(1)
    expect((markTogether({ flags: {}, clock: { day: 10, minute: 0 }, romance: { stage: 'dating' } } as never) as { flags: Record<string, number> }).flags.togetherDays).toBeUndefined()
  })
})

describe('다음에 열리는 것 · 구약 조각', () => {
  it('마친 장 수에서 가장 가까운 다음 기능', () => {
    expect(nextUnlock(gameAtChapters(CONTENT, 41))).toMatchObject({ id: 'deepRelation', left: 4 })
    expect(nextUnlock(gameAtChapters(CONTENT, 260))).toBeNull()
  })
  it('오늘의 구약 조각은 옮겨 적은 장의 것부터', () => {
    expect(drawOtPiece([], 5, ['ot:gen:1', 'ot:gen:2'])).toMatch(/^ot:gen:[12]$/)
    expect(drawOtPiece(['ot:gen:1', 'ot:gen:2'], 5, ['ot:gen:1', 'ot:gen:2'])).not.toBeNull()
  })
})

describe('옛 저장은 막바지 알림을 받지 않는다 (2026-10-21 검토)', () => {
  it('growthLegacy 저장을 재워도 구약 미리 보기·마지막 열 장 편지가 오지 않는다', async () => {
    const { legacyGame } = await import('./growth-test-support')
    const { goToSleep } = await import('./game')
    const { TIP_WHEN } = await import('./tip-letters') as unknown as { TIP_WHEN?: Record<string, (s: GameState) => boolean> }
    const s = legacyGame(CONTENT)
    const next = goToSleep({ ...s, clock: { ...s.clock, minute: 22 * 60 } }, CONTENT)
    expect(next.scenes).not.toContain('growth:otPreview:full')
    if (TIP_WHEN?.finale) expect(TIP_WHEN.finale(next)).toBe(false)
  })
})

describe('다 지은 건물 옮기기 (2026-10-21)', () => {
  it('처음 낸 닢의 10%로 옮기고, 같은 자리·모자란 닢은 거절, 사는 사람(id)은 그대로', async () => {
    const { moveBuild, canMoveBuild, moveCost } = await import('./newland-build')
    const home = { id: 'b1', kind: 'home', x: 5, y: 12, facing: 'down', state: 'done', orderedDay: 1, paid: { coins: 1500, items: {} }, refunded: false, slot: 0 }
    const base = { ...gameAtChapters(CONTENT, 260), coins: 1000, flags: { newlandRevealed: 1, newlandGift: 1, 'familyHome:1': 1 }, player: { x: 30, y: 25, facing: 'down', path: [], walkTime: 0 }, newland: { builds: [home], tiles: {}, nextId: 2, settledDay: 0 } } as unknown as GameState
    expect(moveCost(home)).toBe(150)
    expect(canMoveBuild(base, 'b1', 5, 12, 'down')).toBe('same')
    let spot: { x: number; y: number } | null = null
    for (let y = 14; y <= 24 && !spot; y++) for (let x = 2; x <= 34 && !spot; x++) if (canMoveBuild(base, 'b1', x, y, 'down') === null) spot = { x, y }
    expect(spot).not.toBeNull()
    const moved = moveBuild(base, 'b1', spot!.x, spot!.y, 'down')!
    expect(moved.coins).toBe(850)
    expect(moved.newland!.builds[0]).toMatchObject({ id: 'b1', x: spot!.x, y: spot!.y, slot: 0 })
    expect(moved.flags['familyHome:1']).toBe(1)
    expect(canMoveBuild({ ...base, coins: 10 } as GameState, 'b1', spot!.x, spot!.y, 'down')).toBe('coins')
  })
})
