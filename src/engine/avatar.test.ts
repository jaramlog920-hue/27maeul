import { CONTENT } from '../content/catalog'
import { cleanAvatarName, nameProblem } from './avatar'
import { newGame } from './game'

describe('주인공', () => {
  it('이름 검사: 비었거나 길거나 금지어면 안 된다', () => {
    expect(nameProblem('  ')).toBe('empty')
    expect(nameProblem('가나다라마바사아자')).toBe('long')
    expect(nameProblem('베드로')).toBe('forbidden')
    expect(nameProblem('하늘')).toBeNull()
    expect(cleanAvatarName('  하  늘 ')).toBe('하 늘')
  })
  it('새 게임에 주인공이 담긴다', () => {
    expect(newGame(CONTENT).avatar).toBeNull()
    expect(newGame(CONTENT, { look: 'f', name: '하늘' }).avatar).toEqual({ look: 'f', name: '하늘' })
  })
})
