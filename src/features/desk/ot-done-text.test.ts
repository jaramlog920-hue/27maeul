// 2026-10-11 구약 점검 3·4: 구약 책을 마치면 "제본하면 완성본이 됩니다", 시편이 "150장"으로 나왔다
import { expect, it } from 'vitest'
import { t } from '../../shared/i18n'
import { chapterUnit } from '../../engine/ot-books'
import { bookDoneLine } from './copy-text'

it('구약 책은 제본 안내 대신 작은 책장에 꽂혔다고 한다, 신약은 그대로', () => {
  expect(bookDoneLine('oba', '오바댜')).toBe('오바댜 필사를 마쳤습니다. 작은 책장에 꽂혔어요.')
  expect(bookDoneLine('mk', '마가복음')).toBe('마가복음 필사를 마쳤습니다. 제본하면 완성본이 됩니다.')
})
it('구약 기록대의 장 수·남긴 줄은 시편이면 "편"', () => {
  expect(t('otShelf.chapters', { n: 150, unit: chapterUnit('psa') })).toBe('150편')
  expect(t('otShelf.chapterLine', { n: 23, unit: chapterUnit('psa') })).toBe('23편')
  expect(t('otShelf.chapters', { n: 4, unit: chapterUnit('rut') })).toBe('4장')
})
