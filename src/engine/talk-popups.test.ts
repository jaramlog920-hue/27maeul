import { rememberTalkPopup, unseenTalkPopups } from './talk-popups'

describe('특별 대사 읽음 기록', () => {
  it('같은 이웃의 같은 말만 거르고 기존 상태를 바꾸지 않는다', () => {
    const original = { flags: { movedIn: 1 }, coins: 5 }
    const next = rememberTalkPopup(original, 'baker', '특별 대사')
    expect(unseenTalkPopups(next, 'baker', ['특별 대사', '다른 대사'])).toEqual(['다른 대사'])
    expect(unseenTalkPopups(next, 'weaver', ['특별 대사'])).toEqual(['특별 대사'])
    expect(original).toEqual({ flags: { movedIn: 1 }, coins: 5 })
    expect(next.flags.movedIn).toBe(1)
    expect(next.coins).toBe(5)
    expect(rememberTalkPopup(next, 'baker', '특별 대사')).toBe(next)
  })
  it('구분 문자가 들어 있는 이름·대사도 서로 섞이지 않는다', () => {
    const next = rememberTalkPopup({ flags: {} }, 'a:b', 'c')
    expect(unseenTalkPopups(next, 'a', ['b:c'])).toEqual(['b:c'])
  })
  it('빈 대사는 기록하지 않고 같은 큐의 중복 대사는 한 번만 남긴다', () => {
    const state = { flags: {} }
    expect(rememberTalkPopup(state, 'baker', '')).toBe(state)
    expect(unseenTalkPopups(state, 'baker', ['', '하나', '하나', '둘'])).toEqual(['하나', '둘'])
  })
  it('새 저장 슬롯은 다른 슬롯의 읽음 기록을 물려받지 않는다', () => {
    const a = rememberTalkPopup({ flags: {} }, 'baker', '특별 대사')
    const b = { flags: {} }
    expect(unseenTalkPopups(a, 'baker', ['특별 대사'])).toEqual([])
    expect(unseenTalkPopups(b, 'baker', ['특별 대사'])).toEqual(['특별 대사'])
  })
})
