import { CONTENT } from '../content/catalog'
import { ACCS, BOTTOMS, HAIRS, SKINS, TOPS, cleanAvatarName, cycle, hsvToHex, nameProblem, randomAvatar, withLookDefaults } from './avatar'
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
  it('◀ ▶는 끝에서 처음으로 돈다', () => {
    expect(cycle(0, -1, 6)).toBe(5)
    expect(cycle(5, 1, 6)).toBe(0)
  })
  it('색 막대 값을 색으로 바꾼다', () => {
    expect(hsvToHex([0, 100, 100])).toBe('#ff0000')
    expect(hsvToHex([120, 100, 100])).toBe('#00ff00')
    expect(hsvToHex([0, 0, 0])).toBe('#000000')
  })
  it('옛 저장 {look, name}도 모든 항목이 채워진다', () => {
    const f = withLookDefaults({ look: 'f', name: '하늘' })
    expect(f.hair).toBe(1)
    expect(withLookDefaults({ look: 'm', name: '바다' }).hair).toBe(0)
    expect(withLookDefaults({ look: 'f', name: '하늘', hair: 4 }).hair).toBe(4)
  })
  it('무작위 모습은 모든 목록 안에 있다', () => {
    let seed = 1
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < 50; i++) {
      const a = randomAvatar('m', '바다', rand)
      expect(a.skin).toBeLessThan(SKINS.length)
      expect(a.hair).toBeLessThan(HAIRS.length)
      expect(a.top).toBeLessThan(TOPS.length)
      expect(a.bottom).toBeLessThan(BOTTOMS.length)
      expect(a.acc).toBeLessThan(ACCS.length)
      expect(a.name).toBe('바다')
    }
  })
})
