import { fill, itemName, T } from '../../content/text'
import type { GameState } from '../../engine/game'
import { canDonate, donate, villageOf } from '../../engine/projects'
import { saveGame } from '../../engine/save'
import { SITES, type FacilityId } from '../../engine/village-sites'
import { useGame } from '../../store/game-store'

const V = T.village
type DefText = { name: string; short: string; where: string; effect: string; work: string; decor: string; balance: string }
export const defText = (id: FacilityId) => (V.defs as Record<string, DefText>)[id]

export function commitVillage(next: GameState) {
  saveGame(next)
  useGame.setState({ game: next })
}

/** 진행 정도(0~1)와 단계 문구 */
export function progressOf(game: GameState, id: FacilityId): { pct: number; stage: string } {
  const p = villageOf(game).projects[id]
  const r = p && p.need ? p.units / p.need : 0
  return { pct: Math.round(r * 100), stage: V.stage[r < 1 / 3 ? 0 : r < 2 / 3 ? 1 : 2] }
}

/** 선택 장식에 재료를 보태는 칸 (보태지 않아도 같은 모습으로 완성된다) */
export function DecorBox({ id }: { id: FacilityId }) {
  const game = useGame((s) => s.game)
  const block = canDonate(game, id)
  const d = SITES[id].decor
  if (block === 'none') return null
  const mats = fill(V.materials, { item: itemName(d.item), n: d.n })
  return (
    <div className="village-decor">
      <p>{defText(id).decor}</p>
      {block === 'already' ? (
        <p className="hint" role="status">{V.site.donated}</p>
      ) : (
        <>
          <div className="actions">
            <button disabled={block !== null} onClick={() => commitVillage(donate(useGame.getState().game, id))}>{V.site.donate} · {mats}</button>
          </div>
        </>
      )}
    </div>
  )
}

