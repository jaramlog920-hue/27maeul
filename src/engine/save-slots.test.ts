// 저장 칸 여러 개 (2026-10-07 사용자): 새로 시작은 새 칸, 옛 저장은 칸 1, 자동 저장은 지금 칸에, 지우기는 그 칸만
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { activeSlot, albumPrefix, deleteSave, eraseSave, listSaves, loadGame, newSlot, SAVE_KEY, saveGame, setActiveSlot, slotKey } from './save'

function mem(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  }
}
const named = (name: string, day = 1) => {
  const g = newGame(CONTENT, { look: 'f', name })
  return { ...g, clock: { ...g.clock, day } }
}

describe('저장 칸', () => {
  afterEach(() => setActiveSlot('1'))

  it('옛 저장(SAVE_KEY)은 칸 1로 목록에 보이고 그대로 불러온다', () => {
    const s = mem()
    setActiveSlot('1', s)
    saveGame(named('라헬', 5), s)
    expect(s.getItem(SAVE_KEY)).toBeTruthy()
    expect(listSaves(s)).toMatchObject([{ slot: '1', name: '라헬', day: 5 }])
    expect(loadGame(CONTENT, s, '1')?.avatar?.name).toBe('라헬')
  })

  it('새 칸에 저장하면 다른 칸을 덮지 않고, 자동 저장은 지금 칸으로', () => {
    const s = mem()
    setActiveSlot('1', s)
    saveGame(named('하나', 3), s)
    const slot = newSlot(s)
    expect(slot).toBe('2')
    setActiveSlot(slot, s)
    expect(activeSlot(s)).toBe('2')
    saveGame(named('두리', 9), s)
    expect(s.getItem(slotKey('2'))).toBeTruthy()
    expect(listSaves(s).map((x) => x.name).sort()).toEqual(['두리', '하나'])
    expect(loadGame(CONTENT, s, '1')?.avatar?.name).toBe('하나')
    expect(loadGame(CONTENT, s)?.avatar?.name).toBe('두리')
  })

  it('지우기는 그 칸과 그 칸의 앨범만, 초기화도 지금 칸만', () => {
    const s = mem()
    setActiveSlot('1', s)
    saveGame(named('하나'), s)
    s.setItem(`${albumPrefix('1')}wedding`, 'a')
    setActiveSlot('2', s)
    saveGame(named('두리'), s)
    s.setItem(`${albumPrefix('2')}wedding`, 'b')
    deleteSave('1', s)
    expect(listSaves(s).map((x) => x.slot)).toEqual(['2'])
    expect(s.getItem(`${albumPrefix('2')}wedding`)).toBe('b')
    eraseSave(s)
    expect(listSaves(s)).toEqual([])
  })
})
