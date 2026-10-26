// 구약 책 꾸미기 (2026-10-22 사용자: 신약처럼 책 꾸미기) — 다 옮겨 적은 구약 책의 표지 색·무늬·책등 장식·덧장식을 고른다.
// 재료·고르기·그림은 신약 특별 제본(BindView)과 같다. 구약은 제본·꽂기가 없으니 꾸민 모습만 남고, 언제든 다시 꾸밀 수 있다
import { useState, type CSSProperties } from 'react'
import { fill, itemList, itemName, T } from '../../content/text'
import { BOOK_DETAIL_CHOICES, COVER_COLORS, COVER_HEX, COVER_PATTERNS, DECO_HEX, DEFAULT_CHOICE, SPECIAL_COST, SPINE_DECOS, spineLook, type Binding, type SpecialChoice } from '../../engine/binding'
import { canDecorateOtBook, decorateOtBook, sameOtLook, stockOf } from '../../engine/game'
import { otRow, type OtBook } from '../../engine/ot-books'
import type { ItemId } from '../../engine/types'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import { sfx } from '../../audio/sound'
import { bookCoverArt, bookSpineArt } from '../library/BookArt'
import { PixelArt } from '../library/LibraryWork'
import { BlockedButton } from '../../shared/BlockedButton'

const B = T.binding
const COST = Object.entries(SPECIAL_COST) as [ItemId, number][]
const costLine = COST.map(([id, n]) => fill(B.costItem, { name: itemName(id), n })).join(' · ')
const DETAIL_NAMES = Object.fromEntries(BOOK_DETAIL_CHOICES.map((k) => [k, t(`bindDetail.${k}`)]))

/** 그림은 꾸민 모습만으로 정해진다 — 신약 책 그림 틀('mt')을 빌려 고른 색·무늬·장식으로 그린다 */
const ART_BOOK = 'mt' as const

/** 꾸민 구약 책의 책등 (구약 책장) */
export function OtSpine({ book, binding }: { book: OtBook; binding: Binding }) {
  const look = spineLook(ART_BOOK, binding)
  const style = { '--spine': look.color, '--accent': look.accent } as CSSProperties
  return <span className={`spine-art pixel-spine mark-${look.mark} spine-grade-none`} style={style} role="img" aria-label={fill(T.ot.shelfSpine, { book: otRow(book).name })} data-book={book}><PixelArt {...bookSpineArt(ART_BOOK, binding)} /></span>
}

/** 꾸민 구약 책의 표지 */
export function OtCover({ book, choice }: { book: OtBook; choice: SpecialChoice }) {
  const style = { '--cover': COVER_HEX[choice.color], '--deco': DECO_HEX[choice.deco] } as CSSProperties
  return (
    <div className={`book-cover pixel-cover pattern-${choice.pattern}`} style={style} role="img" aria-label={fill(B.cover, { book: otRow(book).name })}>
      <PixelArt {...bookCoverArt(ART_BOOK, { day: 0, special: choice })} />
      <span className="book-cover-plate">{otRow(book).name}</span>
    </div>
  )
}

function Choices<K extends string>({ title, options, names, value, onPick }: { title: string; options: readonly K[]; names: Record<string, string>; value: K; onPick: (k: K) => void }) {
  return (
    <fieldset className="bind-choices">
      <legend>{title}</legend>
      {options.map((k) => (
        <button key={k} className={value === k ? 'on' : ''} aria-pressed={value === k} onClick={() => onPick(k)}>
          {names[k]}
        </button>
      ))}
    </fieldset>
  )
}

export function OtDecorate({ book }: { book: OtBook }) {
  const game = useGame((s) => s.game)
  const { closeModal, open, commitGame } = useGame.getState()
  const before = game.otBound?.[book]?.special
  const [choice, setChoice] = useState<SpecialChoice>(before ?? DEFAULT_CHOICE)
  const [done, setDone] = useState(false)
  const name = otRow(book).name
  const block = canDecorateOtBook(game, book)
  const have = itemList(Object.fromEntries(COST.map(([id]) => [id, stockOf(game, id)])))
  const back = () => open({ kind: 'otShelf' })
  const confirm = () => {
    const next = decorateOtBook(useGame.getState().game, book, choice)
    if (next === useGame.getState().game) return
    sfx('bind')
    commitGame(next)
    setDone(true)
  }
  if (done) return (
    <div className="dialog bind" role="dialog" aria-label={t('otShelf.decorate')}>
      <h2>{t('otShelf.decorate')}</h2>
      <div className="bind-made">
        <OtCover book={book} choice={choice} />
        <OtSpine book={book} binding={{ day: 0, special: choice }} />
      </div>
      <p className="bind-made-line" role="status">{fill(B.redone, { book: name })}</p>
      <div className="actions">
        <button onClick={back}>{T.ot.shelfTitle}</button>
        <button data-close className="primary" onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
  return (
    <div className="dialog bind" role="dialog" aria-label={fill(B.decorateTitle, { book: name })}>
      <h2>{fill(B.decorateTitle, { book: name })}</h2>
      <div className="bind-made">
        <OtCover book={book} choice={choice} />
        <OtSpine book={book} binding={{ day: 0, special: choice }} />
      </div>
      <Choices title={B.color} options={COVER_COLORS} names={B.colors} value={choice.color} onPick={(color) => setChoice((c) => ({ ...c, color }))} />
      <Choices title={B.pattern} options={COVER_PATTERNS} names={B.patterns} value={choice.pattern} onPick={(pattern) => setChoice((c) => ({ ...c, pattern }))} />
      <Choices title={B.deco} options={SPINE_DECOS} names={B.decos} value={choice.deco} onPick={(deco) => setChoice((c) => ({ ...c, deco }))} />
      <Choices title={t('bindDetail.title')} options={BOOK_DETAIL_CHOICES} names={DETAIL_NAMES} value={choice.detail ?? 'none'} onPick={(detail) => setChoice((c) => ({ ...c, detail }))} />
      <p className="bind-cost">{costLine}</p>
      <p className="hint">{fill(B.have, { items: have })}</p>
      {block === 'stock' && <p className="hint">{B.shortRedo}</p>}
      <div className="actions">
        <button onClick={back}>{B.back}</button>
        <BlockedButton className="primary" why={sameOtLook(game, book, choice) ? t('why.sameLook') : block === 'stock' ? B.shortRedo : block !== null ? '' : null} onClick={confirm}>{B.confirmRedo}</BlockedButton>
      </div>
    </div>
  )
}
