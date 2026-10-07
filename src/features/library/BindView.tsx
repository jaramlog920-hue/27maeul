// 제본 창 (계획 14 작업 4, 2026-10-04 사용자 예시대로):
//   📖 마태복음 필사를 마쳤습니다.
//   [그대로 제본하기]  ← 무료, 늘 가능
//   [특별하게 제본하기]  재료 → [표지 꾸미기]
// 재료가 없어 말씀을 못 남기는 일은 없고, 생활을 열심히 한 사람은 자기가 필사한 책을 더 예쁘게 남긴다.
import { useState } from 'react'
import { fill, itemList, itemName, T } from '../../content/text'
import { BOOK_DETAIL_CHOICES, COVER_COLORS, COVER_PATTERNS, DEFAULT_CHOICE, SPECIAL_COST, SPINE_DECOS, type SpecialChoice } from '../../engine/binding'
import { t } from '../../shared/i18n'
import { haveStock, stockOf } from '../../engine/game'
import type { ItemId } from '../../engine/types'
import { useGame, type Modal } from '../../store/game-store'
import { BookCover, Spine } from './BookArt'
import { LibraryWork } from './LibraryWork'
import type { LibraryAction } from '../../render/library-art'

const BOOK_NAME = T.quiz.books as Record<string, string>
const B = T.binding
const COST = Object.entries(SPECIAL_COST) as [ItemId, number][]
/** 크림색 종이 ×3 · … 처럼 (사용자 예시의 모양) */
const DETAIL_NAMES = Object.fromEntries(BOOK_DETAIL_CHOICES.map((k) => [k, t(`bindDetail.${k}`)]))
const costLine = COST.map(([id, n]) => fill(B.costItem, { name: itemName(id), n })).join(' · ')

/** 고르기 한 줄 (표지 색·무늬·책등 장식) */
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

export function BindView({ modal }: { modal: Extract<Modal, { kind: 'bind' }> }) {
  const game = useGame((s) => s.game)
  const { bindPlain, bindSpecial, closeBind, open } = useGame.getState()
  const [choice, setChoice] = useState<SpecialChoice>(modal.choice ?? DEFAULT_CHOICE)
  const [work, setWork] = useState<{ action: LibraryAction; revision: number; detail?: boolean }>({ action: 'wrap', revision: 0 })
  const name = BOOK_NAME[modal.book]
  const enough = haveStock(game, SPECIAL_COST)
  const have = itemList(Object.fromEntries(COST.map(([id]) => [id, stockOf(game, id)])))

  if (modal.step === 'made') {
    const binding = game.bound[modal.book]
    return (
      <div className="dialog bind" role="dialog" aria-label={B.title}>
        <h2>{B.title}</h2>
        <LibraryWork book={modal.book} action={modal.redo ? work.action : 'bind'} binding={binding} />
        <div className="bind-made">
          <BookCover book={modal.book} binding={binding} />
          <Spine book={modal.book} binding={binding} grade={game.shelved[modal.book]} />
        </div>
        <p className="bind-made-line" role="status">
          {modal.redo ? fill(B.redone, { book: name }) : fill(B.made, { book: name })}
        </p>
        {!modal.redo && <p className="hint">{B.madeBag}</p>}
        <div className="actions">
          <button data-close className="primary" onClick={closeBind}>
            {T.ui.close}
          </button>
        </div>
      </div>
    )
  }

  if (modal.step === 'decorate') {
    const set = (part: Partial<SpecialChoice>) => {
      setChoice(current => ({ ...current, ...part }))
      const action: LibraryAction = part.color ? 'paint' : part.pattern ? 'stamp' : 'wrap'
      setWork(current => ({ action, revision: current.revision + 1, detail: !!part.detail && part.detail !== 'none' }))
    }
    return (
      <div className="dialog bind" role="dialog" aria-label={fill(B.decorateTitle, { book: name })}>
        <h2>{fill(B.decorateTitle, { book: name })}</h2>
        <LibraryWork key={work.revision} book={modal.book} action={work.action} binding={{ day: 0, special: choice }} grade={game.shelved[modal.book]} detail={work.detail && choice.detail && choice.detail !== 'none' ? choice.detail : undefined} />
        <div className="bind-made">
          <BookCover book={modal.book} choice={choice} />
          <Spine book={modal.book} binding={{ day: 0, special: choice }} grade={game.shelved[modal.book]} />
        </div>
        <Choices title={B.color} options={COVER_COLORS} names={B.colors} value={choice.color} onPick={(color) => set({ color })} />
        <Choices title={B.pattern} options={COVER_PATTERNS} names={B.patterns} value={choice.pattern} onPick={(pattern) => set({ pattern })} />
        <Choices title={B.deco} options={SPINE_DECOS} names={B.decos} value={choice.deco} onPick={(deco) => set({ deco })} />
        <Choices title={t('bindDetail.title')} options={BOOK_DETAIL_CHOICES} names={DETAIL_NAMES} value={choice.detail ?? 'none'} onPick={(detail) => set({ detail })} />
        <p className="bind-cost">{costLine}</p>
        <p className="hint">{fill(B.have, { items: have })}</p>
        {!enough && <p className="hint">{modal.redo ? B.shortRedo : B.short}</p>}
        <div className="actions">
          <button onClick={() => (modal.redo ? closeBind() : open({ ...modal, step: 'choose', choice }))}>{modal.redo ? T.ui.close : B.back}</button>
          <button className="primary" disabled={!enough} onClick={() => bindSpecial(choice)}>
            {modal.redo ? B.confirmRedo : B.confirm}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dialog bind" role="dialog" aria-label={B.title}>
      <h2>{B.title}</h2>
      <p className="bind-lead">{fill(B.doneLead, { book: name })}</p>
      <div className="bind-options">
        <div className="bind-option">
          <button className="primary" onClick={bindPlain}>
            {B.plain}
          </button>
          <span className="hint">{B.plainNote}</span>
        </div>
        <div className="bind-option">
          <button onClick={() => open({ ...modal, step: 'decorate', choice })}>{B.special}</button>
          <span className="hint">{fill(B.cost, { items: costLine })}</span>
        </div>
      </div>
      <p className="hint">{fill(B.have, { items: have })}</p>
      <div className="actions">
        <button data-close onClick={closeBind}>{T.ui.close}</button>
      </div>
    </div>
  )
}
