// 화덕·작업대·기름틀·언덕 벤치에서 할 수 있는 일
import { fill, T } from '../../content/text'
import { canCraft, hasFood, starsOut } from '../../engine/game'
import { useGame } from '../../store/game-store'

export function PlaceMenu({ place }: { place: 'hearth' | 'workbench' | 'press' | 'hill' | 'bench' }) {
  const game = useGame((s) => s.game)
  const { startCraft, warm, eat, closeModal, open, sitHill } = useGame.getState()
  const title = { hearth: T.ui.hearthTitle, workbench: T.ui.workbenchTitle, press: T.ui.pressTitle, hill: T.ui.hillTitle, bench: T.ui.benchTitle }[place]
  return (
    <div className="dialog" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <div className="actions menu column">
        {place === 'hearth' && (
          <>
            <button disabled={canCraft(game, 'bread') !== null} onClick={() => startCraft('bread')}>
              {T.ui.hearthBake}
            </button>
            <button onClick={warm}>{T.ui.hearthWarm}</button>
            <button disabled={!hasFood(game.inv)} onClick={eat}>
              {T.ui.hearthEat}
            </button>
          </>
        )}
        {place === 'workbench' && (
          <>
            <button disabled={canCraft(game, 'papyrus') !== null} onClick={() => startCraft('papyrus')}>
              {T.ui.workPapyrus}
            </button>
            <button disabled={canCraft(game, 'ink') !== null} onClick={() => startCraft('ink')}>
              {fill(T.ui.workInk, { n: (game.inv.goodPen ?? 0) > 0 ? 2 : 1 })}
            </button>
            <button disabled={canCraft(game, 'blanket') !== null} onClick={() => startCraft('blanket')}>
              {T.ui.workBlanket}
            </button>
            <button disabled={canCraft(game, 'cover') !== null} onClick={() => startCraft('cover')}>
              {T.ui.workCover}
            </button>
          </>
        )}
        {place === 'press' && (
          <button disabled={canCraft(game, 'oil') !== null} onClick={() => startCraft('oil')}>
            {T.ui.pressMake}
          </button>
        )}
        {/* 별 보기는 언덕에만 (stargaze는 자리와 무관 — 다른 별 보는 자리도 이 버튼을 붙이면 된다) */}
        {place === 'hill' && (
          <button disabled={!starsOut(game.clock.minute)} onClick={sitHill}>
            {T.ui.hillStars}
          </button>
        )}
        {(place === 'hill' || place === 'bench') && (
          <button className="primary" disabled={game.collected.length === 0} onClick={() => open({ kind: 'readPick' })}>
            {T.ui.readScripture}
          </button>
        )}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
      {place === 'hill' && !starsOut(game.clock.minute) && <p className="hint">{T.ui.starsNotYet}</p>}
      {(place === 'hill' || place === 'bench') && <p className="hint">{T.ui.readHint}</p>}
      {game.needs.fatigue >= 100 && place !== 'hill' && place !== 'bench' && <p className="hint">{T.ui.tooTired}</p>}
      {(['bread', 'papyrus', 'ink', 'oil', 'blanket', 'cover'] as const).some((r) => canCraft(game, r) === 'full') && <p className="hint">{T.ui.bagFull}</p>}
    </div>
  )
}
