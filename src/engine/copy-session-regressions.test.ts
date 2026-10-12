import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { copySpot, copyVerses } from './copying'
import { deserialize, serialize } from './save'
import { BOOKS } from './types'
import { useGame } from '../store/game-store'

beforeEach(() => {
  // jsdom의 시험용 저장소만 사용하며 실제 브라우저의 저장에는 접근하지 않는다.
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), scenes: [] })
})

describe('신약 필사 완료·중단의 저장 경계', () => {
  it.each(BOOKS)('%s: 마지막 절의 한글 조합·중단·복원·완료 및 닫힌 창의 중복 입력', (book) => {
    const verse = copyVerses(book, 1, CONTENT).at(-1)!
    const fresh = useGame.getState().game
    const s = { ...fresh, copy: { ...fresh.copy, book, at: { [book]: { chapter: 1, verse: verse.verse } } } }
    useGame.getState().load(s)
    useGame.getState().open({ kind: 'copy', view: 'write' })
    // 완성된 음절이어도 IME 조합 중에는 장/보상 완료를 미룬다.
    expect(useGame.getState().copyType(verse.text, { composing: true })).toBe(true)
    const draft = useGame.getState().game
    expect(draft.progress[book].completed).not.toContain(1)
    expect(draft.copyStats).toEqual(s.copyStats)
    expect(copySpot(draft, book, CONTENT)?.draft).toBe(verse.text)
    useGame.getState().copyExit()
    const back = deserialize(serialize(useGame.getState().game), CONTENT)!
    expect(copySpot(back, book, CONTENT)?.draft).toBe(verse.text)
    useGame.getState().load(back)
    useGame.getState().open({ kind: 'copy', view: 'write' })
    expect(useGame.getState().copyType(verse.text, { composing: false })).toBe(true)
    expect(useGame.getState().modal).toMatchObject({ kind: 'copy', view: 'done' })
    const done = useGame.getState().game
    expect(done.progress[book].completed.filter(c => c === 1)).toHaveLength(1)
    expect(done.copyStats.verses).toBe(s.copyStats.verses + 1)
    expect(done.copyStats.chars).toBe(s.copyStats.chars + verse.chars)
    expect(useGame.getState().copyType(verse.text)).toBe(false)
    expect(useGame.getState().copyVoice(verse.text)).toBeNull()
    expect(useGame.getState().copyPuzzle()).toBe(false)
    expect(useGame.getState().game).toBe(done)
    useGame.getState().copyExit()
    const closed = useGame.getState().game
    expect(useGame.getState().copyType(verse.text)).toBe(false)
    useGame.getState().copyExit()
    expect(useGame.getState().game).toBe(closed)
    const restored = deserialize(serialize(closed), CONTENT)!
    expect(restored.progress[book]).toEqual(closed.progress[book])
    expect(restored.copyStats).toEqual(closed.copyStats)
    expect(restored.stats).toEqual(closed.stats)
    expect(restored.clock).toEqual(closed.clock)
  })
})
