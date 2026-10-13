import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from './game'
import { activeSlot, exportSave, importSave, loadGame, setActiveSlot, slotKey } from './save'

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
    expect(r).toMatchObject({ slot: '2' })
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
  it('빠짐없이: 기기에 있는 이 게임의 칸은 모두 내보내지고 그대로 돌아온다 (새 기능이 칸을 늘려도)', () => {
    const from = memStore()
    const s = { ...newGame(CONTENT), coins: 77 }
    from.setItem(slotKey('1'), 'x')
    setActiveSlot('1', from)
    from.removeItem('twenty-seven/active-slot')
    // 그 칸의 앨범 사진, 다른 칸 사진(빠져야 함), 여러 기기 설정, 앞으로 생길 이름 모를 설정까지
    from.setItem('twenty-seven/album/stars', 'data:a')
    from.setItem('twenty-seven/album/fam:trip', 'data:b')
    from.setItem('twenty-seven/album/3/stars', 'data:other-slot')
    for (const k of ['music', 'theme', 'volume-music', 'joystick', 'copy-way', 'some-future-setting']) from.setItem(`twenty-seven/${k}`, k)
    const text = exportSave(s, from)
    const to = memStore()
    const r = importSave(text, CONTENT, to)
    expect(r).toEqual({ slot: '1', pics: 2, picsMissed: 0, settings: 6 })
    expect(loadGame(CONTENT, to)?.coins).toBe(77)
    expect(to.getItem('twenty-seven/album/stars')).toBe('data:a')
    expect(to.getItem('twenty-seven/album/fam:trip')).toBe('data:b')
    expect(to.getItem('twenty-seven/album/3/stars')).toBeNull()
    expect(to.getItem('twenty-seven/some-future-setting')).toBe('some-future-setting')
    // 내보낸 쪽의 이 게임 칸 가운데 저장·저장 시각·다른 칸 사진·이어 할 칸 표시 말고는 모두 건너왔다
    for (let i = 0; i < from.length; i++) {
      const k = from.key(i)!
      if (k === slotKey('1') || k.startsWith('twenty-seven/album/3/')) continue
      expect(to.getItem(k), k).toBe(from.getItem(k))
    }
  })
})
