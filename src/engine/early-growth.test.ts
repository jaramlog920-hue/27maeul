import { CONTENT } from '../content/catalog'
import { SCENES } from '../content/text'
import { libraryGrowth, NT_CHAPTER_COUNTS } from './progression'
import { featureAccess, EARLY_MILESTONES } from './feature-rules'
import { newGame, applyEarlyGrowth, openMailbox, goToSleep, copyRequestsToday, writePresetRequest, canWriteRequest, askRequest, fulfillRequest, receiveVisit, writeVerse, recordLetter, placeFurniture, furnishSpouse } from './game'
import { deserialize, serialize } from './save'
import { REQUEST_PRESETS } from './request-presets'
import { copyVerses } from './copying'
import { blanksFor } from './copy'
import { HOME_ENTRY } from './world'
import { newChild } from './child'

function chapters(n: number) {
  const game = newGame(CONTENT)
  return { ...game, progress: { ...game.progress, mt: { completed: Array.from({ length: n }, (_, i) => i + 1), arrangement: {} } } }
}

describe('서고 성장과 초반 생활 해금', () => {
  it('본문 없이 27권 260장을 세고 중복·잘못된 장·구약은 성장에 넣지 않는다', () => {
    expect(Object.values(NT_CHAPTER_COUNTS).reduce((a, b) => a + b, 0)).toBe(260)
    const game = chapters(3)
    game.progress.mt.completed.push(1, 0, 29, 1.5)
    game.otProgress = { gen: { completed: [1, 2], arrangement: {} } }
    expect(libraryGrowth(game).completedChapters).toBe(3)
    expect(libraryGrowth(game).completedBooks).toEqual([])
  })

  it('정식 해금은 어느 책이든 마친 장 수로 열리고, 짧은 책을 골라도 앞서지 않는다 (2026-10-13)', () => {
    const game = newGame(CONTENT)
    for (const b of ['phm', '2jn', '3jn', 'jud'] as const) game.progress[b].completed = [1]
    expect(featureAccess(game, 'decorate')).toBe('preview')
    game.progress.mt.completed = [1]
    expect(featureAccess(game, 'decorate')).toBe('full')
    expect(libraryGrowth(game).shelvedBooks).toEqual([])
    game.progress.mt.completed = [1, 2, 3, 4]
    expect(featureAccess(game, 'mailbox')).toBe('full')
    expect(featureAccess(game, 'board')).toBe('locked')
    game.progress.mt.completed = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(featureAccess(game, 'board')).toBe('full')
    // 정식 부탁의 수는 그날 입주한 주민에 따라 달라진다. 체험 부탁 대신 날짜별 부탁인지 검사한다.
    const requests = copyRequestsToday(game, CONTENT)
    expect(requests.length).toBeGreaterThan(0)
    expect(requests.every(r => r.id !== 'growth:board:intro')).toBe(true)
  })

  it('어느 책에서 마쳤든 합산하고 각 성장 안내에는 실제 장면이 있다', () => {
    const game = chapters(1)
    game.progress.jn.completed = [1]
    expect(featureAccess(game, 'mailbox')).toBe('preview')
    for (const milestone of EARLY_MILESTONES) expect(SCENES[`growth:${milestone.id}`]).toBeDefined()
  })

  it('첫 의자는 장 완료 때 지급하고 재적용·저장 복원으로 중복 지급하지 않는다', () => {
    const before = chapters(0)
    const after = applyEarlyGrowth(before, chapters(1), CONTENT)
    expect(after.inv.stool).toBe(1)
    expect(after.scenes).toContain('growth:decorate')
    const restored = deserialize(serialize(after), CONTENT)!
    expect(restored.flags.growthLegacy).toBeUndefined()
    expect(applyEarlyGrowth(before, restored, CONTENT).inv.stool).toBe(1)
    expect(applyEarlyGrowth(restored, restored, CONTENT).scenes).toEqual(restored.scenes)
  })

  it('직접 필사의 마지막 절과 편지 빈칸 완료 모두 성장 보상을 연결한다', () => {
    const game = newGame(CONTENT)
    const verses = copyVerses('phm', 1, CONTENT)
    game.copy.at.phm = { chapter: 1, verse: verses.at(-1)!.verse }
    const result = writeVerse(game, 'phm', verses.at(-1)!.text, CONTENT)
    expect(result.result.kind).toBe('chapter')
    expect(result.state.inv.stool).toBe(1)
    expect(result.state.scenes).toContain('growth:decorate')
    expect(writeVerse(result.state, 'phm', verses.at(-1)!.text, CONTENT).state.inv.stool).toBe(1)
    const picks = blanksFor('phm', 1, CONTENT.copy!('phm')).map(b => b.answer)
    expect(recordLetter(game, 'phm', 1, picks, CONTENT).inv.stool).toBe(1)
    // 4장을 마친 뒤 빌레몬서 1장을 마치면 5장 — 꾸미기 정식 해금 안내 (2026-10-13 장 수 기준)
    const four = chapters(4)
    four.copy.at.phm = { chapter: 1, verse: verses.at(-1)!.verse }
    expect(writeVerse(four, 'phm', verses.at(-1)!.text, CONTENT).state.scenes).toContain('growth:decorate:full')
    expect(recordLetter(four, 'phm', 1, picks, CONTENT).scenes).toContain('growth:decorate:full')
  })

  it('첫 편지는 잠들어도 남고 한 통만 체험하며 8장을 마친 뒤 다시 받을 수 있다', () => {
    const game = applyEarlyGrowth(chapters(1), chapters(2), CONTENT)
    expect(game.post).toHaveLength(1)
    const morning = goToSleep(game, CONTENT)
    expect(morning.post).toContain(game.post[0])
    const got = openMailbox(morning, CONTENT)
    expect(got.pieceIds).toHaveLength(1)
    const extra = CONTENT.pieces.find(p => !got.state.collected.includes(p.id))!.id
    const waiting = { ...got.state, post: [extra] }
    expect(openMailbox(waiting, CONTENT).pieceIds).toEqual([])
    waiting.progress.mt.completed = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(openMailbox(waiting, CONTENT).pieceIds).toEqual([extra])
  })

  it('3장 뒤 첫 방문은 호감도 없이 예약하고 인사하기 전에는 사라지지 않는다', () => {
    const game = applyEarlyGrowth(chapters(2), chapters(3), CONTENT)
    let morning = game
    for (let i = 0; i < 10 && morning.today.visitor !== 'baker'; i++) morning = goToSleep(morning, CONTENT)
    expect(morning.today.visitor).toBe('baker')
    expect(morning.flags['growth:visitorDone']).toBeUndefined()
    const got = receiveVisit({ ...morning, clock: { ...morning.clock, minute: 480 } }, 'baker')!
    expect(got.state.flags['growth:visitorDone']).toBe(1)
    expect(receiveVisit(got.state, 'baker')).toBeNull()
  })

  it('5장 뒤 보리를 받고 호감도가 낮아도 빵 굽는 이웃의 첫 부탁을 완료한다', () => {
    expect(askRequest(chapters(0), 'baker').flags['req:baker:1']).toBeUndefined()
    const game = applyEarlyGrowth(chapters(4), chapters(5), CONTENT)
    expect(game.inv.barley).toBe(3)
    const done = fulfillRequest(askRequest(game, 'baker'), 'baker')!
    expect(done.flags['req:baker:1']).toBe(2)
    expect(done.inv.bowl).toBe(1)
  })

  it('게시판 체험은 기한 없는 한 부탁만 허용하고 다른 경로·재전달을 막는다', () => {
    expect(copyRequestsToday(chapters(0), CONTENT)).toEqual([])
    const game = applyEarlyGrowth(chapters(9), chapters(10), CONTENT)
    const [request] = copyRequestsToday(game, CONTENT)
    const preset = REQUEST_PRESETS[request.kind][0]
    expect(canWriteRequest(game, { ...request, npc: 'smith' })).toBe('notYet')
    const later = { ...game, clock: { ...game.clock, day: 100 } }
    expect(canWriteRequest(later, request)).toBeNull()
    const done = writePresetRequest(later, request, preset.id, preset.text, CONTENT)!
    expect(copyRequestsToday(done.state, CONTENT)).toEqual([])
    expect(writePresetRequest(done.state, request, preset.id, preset.text, CONTENT)).toBeNull()
    expect(canWriteRequest(chapters(0), request)).toBe('notYet')
  })

  it('새 저장은 의자만 체험할 수 있고 5장을 마친 뒤 다른 가구를 놓을 수 있다', () => {
    const game = applyEarlyGrowth(chapters(0), chapters(1), CONTENT)
    const home = { ...game, player: { ...game.player, ...HOME_ENTRY }, inv: { ...game.inv, vase: 1 } }
    expect(placeFurniture(chapters(0), 'stool', { x: 20, y: 112 })).toBeNull()
    expect(placeFurniture(home, 'vase', { x: 20, y: 112 })).toBeNull()
    expect(placeFurniture(home, 'stool', { x: 20, y: 112 })).not.toBeNull()
    home.progress.mt.completed = [1, 2, 3, 4, 5]
    expect(placeFurniture(home, 'vase', { x: 20, y: 112 })).not.toBeNull()
  })

  it('기존 저장은 권한·가구·가족·관계를 유지하며 지난 성장 선물을 받지 않는다', () => {
    const game = chapters(10)
    game.hearts.baker = 60
    game.homeLevel = 2
    game.clock.day = 30
    game.romance = { partner: 'marigold', stage: 'married', since: 1, weddingDay: null, marriedDay: 2 }
    game.child = newChild(3, game.stats, CONTENT.neighbors.find(n => n.id === 'marigold')?.stat)
    Object.assign(game, furnishSpouse(game))
    const raw = JSON.parse(serialize(game))
    delete raw.flags.growthVersion
    const restored = deserialize(JSON.stringify(raw), CONTENT)!
    expect(restored.flags.growthLegacy).toBe(1)
    expect(restored.room).toEqual(game.room)
    expect(restored.romance).toEqual(game.romance)
    expect(restored.child).toEqual(game.child)
    expect(restored.hearts.baker).toBe(60)
    expect(featureAccess(restored, 'board')).toBe('full')
    expect(restored.inv.stool).toBeUndefined()
    expect(applyEarlyGrowth(restored, restored, CONTENT).inv.stool).toBeUndefined()
  })
})
