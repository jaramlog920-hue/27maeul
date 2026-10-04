// 화면 아래 오늘의 상태 판 — 몸, 글쓰기 재료, 이야기를 들려줄 이웃
import { fill, T } from '../../content/text'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'

const SUPPLIES: ItemId[] = ['papyrus', 'ink', 'oil', 'bread', 'water']

export function StatusPanel() {
  const inv = useGame((s) => s.game.inv)
  const offers = useGame((s) => Object.keys(s.game.offers).length)
  const level = useGame((s) => s.game.flags.villageLevel ?? 0)
  // 지금 필사 자리는 위 줄(Hud)이 늘 보여 준다 (계획 14 작업 6) — 여기선 되풀이하지 않는다
  return (
    <section className="status-panel" aria-label={T.ui.statusTitle}>
      <div className="status-row">
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
