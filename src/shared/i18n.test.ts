import { t, allEntries, getLang } from './i18n'
import { forbiddenIn } from '../content/forbidden'

describe('화면 글 입구', () => {
  it('처음 말은 한국어', () => {
    expect(getLang()).toBe('ko')
  })
  it('열쇠로 글을 꺼낸다', () => {
    expect(t('common.close')).toBe('닫기')
  })
  it('없는 열쇠는 열쇠 그대로 보여 준다', () => {
    expect(t('nope.nothing')).toBe('nope.nothing')
  })
  it('{이름} 자리를 채운다 — 안 준 자리는 그대로', () => {
    expect(t('x {n}닢 {m}', { n: 3 })).toBe('x 3닢 {m}')
  })
  it('화면 글에도 금지어가 없다', () => {
    for (const [key, text] of allEntries()) expect(forbiddenIn(text), key).toBeNull()
  })
})
