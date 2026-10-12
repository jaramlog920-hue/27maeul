import { T } from '../../content/text'
import { canOpenStall } from '../../engine/stall'
import { useGame } from '../../store/game-store'
const S = T.stall

/** 장날 상인과 일정 창에서 여는 단추 — 장날이거나 오늘 열어 둔 좌판이 있을 때만 보인다 */
export function StallEntry({ label }: { label?: string }) {
  const game = useGame((s) => s.game)
  const block = canOpenStall(game)
  const live = !!game.stall && game.stall.day === game.clock.day
  if (block === 'notMarket' && !live) return null
  return <button onClick={() => useGame.getState().open({ kind: 'stall' })}>{label ?? (live && block === 'open' ? S.resume : S.entry)}</button>
}

