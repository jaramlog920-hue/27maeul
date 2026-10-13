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
    const r = importSave('\uFEFF' + exportSave(s) + '\n', CONTENT, store)
    expect(r).toEqual({ slot: '2' })
    expect(activeSlot(store)).toBe('2')
    expect(loadGame(CONTENT, store)?.coins).toBe(321)
  })
  it('다른 파일은 받지 않는다', () => {
    const store = memStore()
    expect(importSave('{"app":"other","save":"{}"}', CONTENT, store)).toEqual({ error: 'format' })
    expect(importSave('아무 글', CONTENT, store)).toEqual({ error: 'format' })
    expect(store.length).toBe(0)
  })
  it('기기 공간이 모자라면 형식 오류가 아니라 공간 부족으로 알린다', () => {
    const store = memStore()
    const full = { ...store, setItem: () => { throw new Error('QuotaExceededError') } } as Storage
    expect(importSave(exportSave(newGame(CONTENT)), CONTENT, full)).toEqual({ error: 'space' })
  })
})
