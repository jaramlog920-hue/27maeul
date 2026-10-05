import { clubHere } from '../../engine/clubs'
// 텃밭 한 칸: 비었으면 심기, 자라는 중이면 물 주기, 다 자랐으면 거두기
import { fill, itemName, T } from '../../content/text'
import { canPlant, CROPS, isRipe } from '../../engine/garden'
import { seasonOf } from '../../engine/clock'
import type { Tile } from '../../engine/types'
import { useGame } from '../../store/game-store'

export function GardenMenu({ at }: { at: Tile }) {
  const game = useGame((s) => s.game)
  const { plantAt, waterAt, harvestAt, closeModal } = useGame.getState()
  const p = game.garden[`${at.x},${at.y}`]
  const winter = canPlant(game, at, 'herb') === 'winter'
  return (
    <div className="dialog" role="dialog" aria-label={T.ui.gardenTitle}>
      <h2>{T.ui.gardenTitle}</h2>
      {!p ? (
        winter ? (
          <p>{T.ui.gardenWinter}</p>
        ) : (
          <div className="actions menu column">
            <button disabled={canPlant(game, at, 'herb') !== null} onClick={() => plantAt(at, 'herb')}>
              {T.ui.gardenPlantHerb} ({itemName('seedHerb')} {game.inv.seedHerb ?? 0})
            </button>
            <button disabled={canPlant(game, at, 'bean') !== null} onClick={() => plantAt(at, 'bean')}>
              {T.ui.gardenPlantBean} ({itemName('seedBean')} {game.inv.seedBean ?? 0})
            </button>
            {(game.inv.seedHerb ?? 0) + (game.inv.seedBean ?? 0) === 0 && <p className="hint">{T.ui.gardenNoSeed}</p>}
          </div>
        )
      ) : isRipe(p) ? (
        <div className="actions menu column">
          <button className="primary" onClick={() => harvestAt(at)}>
            {T.ui.gardenHarvest} · {itemName(p.crop)}
          </button>
        </div>
      ) : (
        <>
          <p>{fill(T.ui.gardenGrowing, { crop: itemName(p.crop), n: p.grown, all: CROPS[p.crop].days })}</p>
          <div className="actions menu column">
            {seasonOf(game.clock.day) === 'winter' ? (
              <p className="hint">{T.ui.gardenWinter}</p>
            ) : p.wateredDay === game.clock.day ? (
              <p className="hint">{T.ui.gardenWatered}</p>
            ) : (
              <button onClick={() => waterAt(at)}>{T.ui.gardenWater}</button>
            )}
          </div>
        </>
      )}
      <div className="actions">
        {clubHere(game,'garden') && <button onClick={() => useGame.getState().open({kind:'clubSession',id:clubHere(game,'garden')!.id})}>{T.clubs.join}</button>}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
