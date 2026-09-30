import { applyTheme, loadTheme, setTheme } from './theme'

describe('색 조합', () => {
  beforeEach(() => localStorage.clear())
  it('처음엔 올리브, 고르면 저장되고 html에 입힌다', () => {
    expect(loadTheme()).toBe('olive')
    setTheme('sea')
    expect(loadTheme()).toBe('sea')
    expect(document.documentElement.dataset.theme).toBe('sea')
    applyTheme('olive')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
  it('모르는 값은 올리브로', () => {
    localStorage.setItem('twenty-seven/theme', 'neon')
    expect(loadTheme()).toBe('olive')
  })
})
