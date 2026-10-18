// 다시 쓰기 (2026-10-18 사용자): 마친 장을 횟수 제한 없이 다시 옮겨 적는다 — 장마다 20%로 아직 없는 조각, 신약·구약을 다 적은 뒤에도 이어진다
import { CONTENT } from '../content/catalog'
import { againKey, copySpot, isCopyingAgain, sanitizeCopy } from './copying'
import { COPY_AGAIN_PIECE_CHANCE, newGame, saveCopyDraft, startCopy, startCopyAgain, stopCopyAgain, writeVerse, type GameState } from './game'
import { deserialize, serialize } from './save'
import type { Book } from './types'

const fresh = (patch: Partial<GameState> = {}): GameState => ({ ...newGame(CONTENT), scenes: [], ...patch })

function writeCurrent(s: GameState, book: Book) {
  const spot = copySpot(s, book, CONTENT)!
  return writeVerse(s, book, spot.verse.text, CONTENT)
}
function writeChapter(s: GameState, book: Book) {
  let r = writeCurrent(s, book)
  while (r.result.kind === 'verse') r = writeCurrent(r.state, book)
  return r
}
/** 빌레몬서(1장) 한 권을 처음 필사로 마친 상태 */
function phmDone(): GameState {
  return writeChapter(startCopy(fresh(), 'phm', CONTENT), 'phm').state
}

describe('다시 쓰기', () => {
  it('마친 장만 다시 쓸 수 있다 — 아직 마치지 않은 장·없는 장은 그대로', () => {
    const s = startCopy(fresh(), 'phm', CONTENT)
    expect(startCopyAgain(s, 'phm', 1, CONTENT)).toBe(s)
    const done = phmDone()
    expect(startCopyAgain(done, 'phm', 2, CONTENT)).toBe(done)
    const again = startCopyAgain(done, 'phm', 1, CONTENT)
    expect(isCopyingAgain(again.copy, 'phm')).toBe(true)
    expect(again.copy.book).toBe('phm')
    const spot = copySpot(again, 'phm', CONTENT)!
    expect(spot.chapter).toBe(1)
    expect(spot.index).toBe(0)
  })

  it('다시 쓴 장을 마치면 횟수와 경험치만 — 진행·필사 기록·닢·장면은 그대로, 다시 쓰기는 끝난다', () => {
    const done = phmDone()
    const r = writeChapter(startCopyAgain(done, 'phm', 1, CONTENT), 'phm')
    expect(r.result.kind).toBe('chapter')
    if (r.result.kind !== 'chapter') return
    expect(r.result.again).toBe(1)
    expect(r.result.bookDone).toBe(false)
    expect(r.result.next).toBeNull()
    expect(r.result.pay).toBeUndefined()
    expect(r.result.gift).toBeUndefined()
    expect(r.state.copy.againDone?.[againKey('phm', 1)]).toBe(1)
    expect(r.state.copy.again).toBeUndefined()
    expect(r.state.progress.phm).toEqual(done.progress.phm)
    expect(r.state.copyStats).toEqual(done.copyStats)
    expect(r.state.coins).toBe(done.coins)
    expect(r.state.scenes).toEqual(done.scenes)
    expect(r.state.inv).toEqual(done.inv)
    expect(r.state.stats.wit).not.toEqual(done.stats.wit)
    expect(r.state.clock.minute).toBeGreaterThan(done.clock.minute)
  })

  it('같은 장을 몇 번이든 다시 쓸 수 있고 횟수가 쌓인다', () => {
    let s = phmDone()
    for (let i = 1; i <= 3; i++) {
      const r = writeChapter(startCopyAgain(s, 'phm', 1, CONTENT), 'phm')
      s = r.state
      expect(r.result.kind === 'chapter' && r.result.again).toBe(i)
    }
    expect(s.copy.againDone?.['phm:1']).toBe(3)
  })

  it('장마다 약 20%로 아직 없는 조각 하나 (같은 장도 다시 쓸 때마다 새로 뽑는다)', () => {
    let got = 0
    const N = 300
    const base = phmDone()
    for (let day = 1; day <= N; day++) {
      const s = { ...base, clock: { ...base.clock, day, minute: 8 * 60 } }
      const r = writeChapter(startCopyAgain(s, 'phm', 1, CONTENT), 'phm')
      if (r.result.kind === 'chapter' && r.result.pieceId) {
        got++
        expect(s.collected).not.toContain(r.result.pieceId)
        expect(r.state.collected).toContain(r.result.pieceId)
        expect(r.state.pieceLog?.[r.result.pieceId]?.from).toBe('recopy')
      }
    }
    expect(COPY_AGAIN_PIECE_CHANCE).toBe(0.2)
    expect(got / N).toBeGreaterThan(0.12)
    expect(got / N).toBeLessThan(0.28)
  })

  it('오늘 편지·이웃이 줄 조각은 가져가지 않고, 조각을 다 모았으면 조각 없이 횟수만', () => {
    const base = phmDone()
    const all = CONTENT.pieces.map((p) => p.id)
    for (let day = 1; day <= 60; day++) {
      const s = { ...base, clock: { ...base.clock, day, minute: 8 * 60 }, post: all.slice(0, 200), offers: { baker: all[200] } }
      const r = writeChapter(startCopyAgain(s, 'phm', 1, CONTENT), 'phm')
      if (r.result.kind === 'chapter' && r.result.pieceId) expect(all.slice(0, 201)).not.toContain(r.result.pieceId)
    }
    const full = { ...base, collected: all }
    const r = writeChapter(startCopyAgain(full, 'phm', 1, CONTENT), 'phm')
    expect(r.result.kind === 'chapter' && r.result.pieceId).toBeFalsy()
    expect(r.state.copy.againDone?.['phm:1']).toBe(1)
  })

  it('쓰다 만 입력은 다시 쓰는 자리에 남고, 처음 쓰던 자리는 건드리지 않는다', () => {
    const s = startCopy(fresh(), 'mt', CONTENT)
    let st = writeChapter(s, 'mt').state
    const nextAt = st.copy.at.mt
    st = startCopyAgain(st, 'mt', 1, CONTENT)
    st = writeCurrent(st, 'mt').state
    st = saveCopyDraft(st, 'mt', '쓰다 만', CONTENT)
    expect(st.copy.again).toMatchObject({ book: 'mt', chapter: 1, draft: '쓰다 만' })
    expect(st.copy.at.mt).toEqual(nextAt)
    // 그만두면 처음 쓰던 자리(2장)로 돌아간다
    const stopped = stopCopyAgain(st)
    expect(stopped.copy.again).toBeUndefined()
    expect(copySpot(stopped, 'mt', CONTENT)!.chapter).toBe(2)
  })

  it('저장·불러오기: 다시 쓰는 자리와 횟수가 남고, 마치지 않은 장·이상한 값은 버린다', () => {
    let st = phmDone()
    st = writeChapter(startCopyAgain(st, 'phm', 1, CONTENT), 'phm').state
    st = writeCurrent(startCopyAgain(st, 'phm', 1, CONTENT), 'phm').state
    const loaded = deserialize(serialize(st), CONTENT)!
    expect(loaded.copy.again).toEqual(st.copy.again)
    expect(loaded.copy.againDone).toEqual({ 'phm:1': 1 })
    const dirty = sanitizeCopy(
      { book: 'phm', at: {}, legacy: {}, again: { book: 'mt', chapter: 1, verse: 1 }, againDone: { 'phm:1': 2, 'zz:1': 3, 'phm:x': 1, 'mt:2': -1 } },
      st.progress,
    )
    expect(dirty.again).toBeUndefined()
    expect(dirty.againDone).toEqual({ 'phm:1': 2 })
  })
})
