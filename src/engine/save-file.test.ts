import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { activeSlot, exportSave, importSave, loadGame, slotKey } from './save'

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

describe('내보내기·가져오기 (2026-10-14)', () => {
  it('내보낸 파일을 가져오면 새 칸에 들어가고 그 칸을 이어 한다', () => {
    const store = memStore()
    const s = { ...newGame(CONTENT), coins: 321 }
    store.setItem(slotKey('1'), 'x')
    const slot = importSave(exportSave(s), CONTENT, store)
    expect(slot).toBe('2')
    expect(activeSlot(store)).toBe('2')
    expect(loadGame(CONTENT, store)?.coins).toBe(321)
  })
  it('다른 파일은 받지 않는다', () => {
    const store = memStore()
    expect(importSave('{"app":"other","save":"{}"}', CONTENT, store)).toBeNull()
    expect(importSave('아무 글', CONTENT, store)).toBeNull()
    expect(store.length).toBe(0)
  })
})
