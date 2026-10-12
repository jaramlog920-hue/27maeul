import { fill, T } from '../../content/text'
import { isOtBook, type CopyBook } from '../../engine/ot-books'
import { t } from '../../shared/i18n'

/** 한 권을 다 적었을 때 한 줄 — 구약은 제본이 없고 작은 책장에 저절로 꽂힌다 (2026-10-11 사용자 결정) */
export function bookDoneLine(book: CopyBook, name: string): string {
  return isOtBook(book) ? t('ot.bookDone', { book: name }) : fill(T.copyFocus.bookDone, { book: name })
}
