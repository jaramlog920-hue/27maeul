// 화면 아래 오늘의 상태 판 — 몸, 지금 쓰는 장, 글쓰기 재료, 이야기를 들려줄 이웃
import { piecesOf } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { currentChapter } from '../../engine/offers'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'

const SUPPLIES: ItemId[] = ['papyrus', 'ink', 'oil', 'bread', 'water']

export function StatusPanel() {
  const collected = useGame((s) => s.game.collected)
  const inv = useGame((s) => s.game.inv)
  const offers = useGame((s) => Object.keys(s.game.offers).length)
  const level = useGame((s) => s.game.flags.villageLevel ?? 0)
  const book = useGame((s) => s.game.activeBook)
  const progress = useGame((s) => s.game.progress)
  const pieces = book ? piecesOf(book) : []
  const chapter = book ? currentChapter(pieces, progress[book].completed) : null
  const inChapter = chapter === null ? [] : pieces.filter((p) => p.chapter === chapter)
  const got = inChapter.filter((p) => collected.includes(p.id)).length
  return (
    <section className="status-panel" aria-label={T.ui.statusTitle}>
      <div className="status-row">
        <span className="status-chapter">
          {!book ? T.ui.noBook : chapter === null ? T.ui.allDone : `${fill(T.ui.chapterLabel, { chapter })} · ${fill(T.ui.dexCount, { got, all: inChapter.length })}`}
        </span>
        {level > 0 && <span className="status-village">{fill(T.ui.villageLevel, { n: level })}</span>}
        <span className="status-offers">{offers > 0 ? fill(T.ui.statusOffers, { n: offers }) : T.ui.statusNoOffers}</span>
      </div>
      <div className="status-supplies">
        {SUPPLIES.map((id) => (
          <span key={id} className={(inv[id] ?? 0) === 0 ? 'empty' : ''}>
            <ItemIcon id={id} size={20} /> {inv[id] ?? 0}
          </span>
        ))}
      </div>
      <NeedsView />
    </section>
  )
}
