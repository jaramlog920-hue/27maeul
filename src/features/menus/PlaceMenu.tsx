// 화덕·작업대·기름틀·언덕 벤치, 그리고 모이는 곳(사랑방·찻집·정자 — 계획 10)에서 할 수 있는 일
import { CONTENT } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { canCraft, canDrinkTea, canPlayHall, canWatchSunset, hasFood, starsOut } from '../../engine/game'
import { TEA_PRICE } from '../../engine/places'
import { useGame, type MenuPlace } from '../../store/game-store'

export function PlaceMenu({ place }: { place: MenuPlace }) {
  const game = useGame((s) => s.game)
  const { startCraft, warm, eat, closeModal, open, sitHill, playHall, drinkTea, watchSunset, rest } = useGame.getState()
  const title = {
    hearth: T.ui.hearthTitle,
    workbench: T.ui.workbenchTitle,
    press: T.ui.pressTitle,
    hill: T.ui.hillTitle,
    bench: T.ui.benchTitle,
    homeBench: T.ui.homeBenchTitle,
    hallTable: T.places.hallTitle,
    teaTable: T.places.teaTitle,
    pavilion: T.places.pavilionTitle,
  }[place]
  const hall = place === 'hallTable' ? canPlayHall(game, CONTENT) : null
  const tea = place === 'teaTable' ? canDrinkTea(game) : null
  const sunset = place === 'pavilion' ? canWatchSunset(game) : null
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
            <button disabled={canCraft(game, 'scentCandle') !== null} onClick={() => startCraft('scentCandle')}>
              {T.ui.workCandle}
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
        {place === 'hallTable' && (
          <button className="primary" disabled={hall !== null} onClick={playHall}>
            {T.places.hallPlay}
          </button>
        )}
        {place === 'teaTable' && (
          <button className="primary" disabled={tea !== null} onClick={drinkTea}>
            {fill(T.places.teaDrink, { n: TEA_PRICE })}
          </button>
        )}
        {place === 'pavilion' && (
          <>
            <button className="primary" disabled={sunset !== null} onClick={watchSunset}>
              {T.places.sunsetWatch}
            </button>
            <button onClick={rest}>{T.places.sit}</button>
          </>
        )}
        {(place === 'hill' || place === 'bench' || place === 'homeBench' || place === 'pavilion') && (
          <button className={place === 'pavilion' ? '' : 'primary'} disabled={game.collected.length === 0} onClick={() => open({ kind: 'readPick' })}>
            {T.ui.readScripture}
          </button>
        )}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
      {place === 'hill' && !starsOut(game.clock.minute) && <p className="hint">{T.ui.starsNotYet}</p>}
      {(place === 'hill' || place === 'bench' || place === 'homeBench') && <p className="hint">{T.ui.readHint}</p>}
      {hall === 'closed' && <p className="hint">{T.places.hallClosed}</p>}
      {hall === 'empty' && <p className="hint">{T.places.hallEmpty}</p>}
      {hall === 'played' && <p className="hint">{T.places.hallPlayed}</p>}
      {place === 'hallTable' && <p className="hint">{T.places.hallHint}</p>}
      {tea === 'closed' && <p className="hint">{T.places.teaClosed}</p>}
      {tea === 'coins' && <p className="hint">{T.places.teaCoins}</p>}
      {sunset === 'notYet' && <p className="hint">{T.places.sunsetNotYet}</p>}
      {sunset === 'cloudy' && <p className="hint">{T.places.sunsetCloudy}</p>}
      {game.needs.fatigue >= 100 && !['hill', 'bench', 'homeBench', 'teaTable', 'pavilion'].includes(place) && <p className="hint">{T.ui.tooTired}</p>}
      {(['bread', 'papyrus', 'ink', 'oil', 'blanket', 'cover', 'scentCandle'] as const).some((r) => canCraft(game, r) === 'full') && <p className="hint">{T.ui.bagFull}</p>}
    </div>
  )
}
