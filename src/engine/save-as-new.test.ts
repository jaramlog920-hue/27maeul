import { CONTENT } from '../content/catalog'
import { legacyGame } from './growth-test-support'
import { activeSlot, listSaves, saveAsNew, saveGame, setActiveSlot } from './save'

/** 시험용 저장소 */
function memStore(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    key: (i: number) => [...m.keys()][i] ?? null,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
  }
}

describe('설정의 저장하기는 새 칸에 (2026-10-13)', () => {
  it('덮어쓰지 않고 불러오기 목록에 한 칸이 늘고, 앨범 그림도 따라가며, 지금 칸은 그대로', () => {
    const store = memStore()
    setActiveSlot('1', store)
    const s = legacyGame(CONTENT)
    saveGame(s, store)
    store.setItem('twenty-seven/album/stars', 'data:pic')
    expect(listSaves(store)).toHaveLength(1)
    const slot = saveAsNew({ ...s, coins: 777 }, store)!
    expect(slot).not.toBe('1')
    const saves = listSaves(store)
    expect(saves).toHaveLength(2)
    expect(saves.find((x) => x.slot === slot)!.coins).toBe(777)
    expect(store.getItem(`twenty-seven/album/${slot}/stars`)).toBe('data:pic')
    expect(activeSlot(store)).toBe('1')
    // 한 번 더 누르면 또 새 칸
    saveAsNew(s, store)
    expect(listSaves(store)).toHaveLength(3)
  })
})
