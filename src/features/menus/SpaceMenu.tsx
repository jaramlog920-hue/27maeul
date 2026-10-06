// 정해 둔 집 안 자리를 쓰는 창 (계획 16 작업 23): 의자·탁자 곁에서 앉아 쉬기·차 마시기·손일·읽기
import { T } from '../../content/text'
import { canUseSpace, spaceById } from '../../engine/space-life'
import { useGame } from '../../store/game-store'

export function SpaceMenu({ id }: { id: string }) {
  const game = useGame((s) => s.game)
  const { useSpaceAt, closeModal } = useGame.getState()
  const sp = spaceById(game, id)
  if (!sp || sp.use === 'pet') return null
  const block = canUseSpace(game, id)
  const use = sp.use as 'tea' | 'craft' | 'family' | 'read'
  return (
    <div className="dialog follow" role="dialog" aria-label={T.space.use[sp.use]}>
      <h2>{sp.name ?? T.space.use[sp.use]}</h2>
      {block === 'full' && <p className="hint">{T.space.busy}</p>}
      <div className="actions column">
        <button className="primary" disabled={!!block} onClick={() => useSpaceAt(id)}>
          {T.space.doIt[use]}
        </button>
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
