// 화면 아래 오늘의 상태 판 — 몸, 살림 재료, 이야기를 들려줄 이웃
import { fill, T } from '../../content/text'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { useGame } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'

/** 늘 보이는 살림 재료 — 파피루스·잉크는 필사에 들지 않으니(계획 14) 빼고, 먹을 것·물·등잔 기름만 */
const SUPPLIES: ItemId[] = ['bread', 'water', 'oil']

export function StatusPanel() {
  const inv = useGame((s) => s.game.inv)
  const offers = useGame((s) => Object.keys(s.game.offers).length)
  const level = useGame((s) => s.game.flags.villageLevel ?? 0)
  // 지금 필사 자리는 위 줄(Hud)이 늘 보여 준다 (계획 14 작업 6) — 여기선 되풀이하지 않는다
  return (
    <section className="status-panel" aria-label={T.ui.statusTitle}>
      <div className="status-row">
        {level > 0 && <span className="status-village">{fill(T.ui.villageLevel, { n: level })}</span>}
        {/* 조각을 가진 이웃이 있는 날만 조용히 한 줄 (없는 날엔 아무 말도 하지 않는다 — 2026-10-04 사용자) */}
        {offers > 0 && <span className="status-offers">{fill(T.ui.statusOffers, { n: offers })}</span>}
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
