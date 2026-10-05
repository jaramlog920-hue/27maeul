import { clubHere } from '../../engine/clubs'
import { festHere } from '../../engine/fest'
import { SkillCraftOptions } from '../skills/SkillLesson'
// 화덕·작업대·기름틀·언덕 벤치, 그리고 모이는 곳(사랑방·찻집·정자 — 계획 10)에서 할 수 있는 일
// 연인·약혼·부부면 찻집·정자·언덕에서 "○○와 함께" 가기 (계획 10 작업 4)
import { CONTENT } from '../../content/catalog'
import { fill, T, withAnd, withSubject } from '../../content/text'
import { canCraft, canDate, canDrinkTea, canPlayHall, canWatchSunset, hasFood, starsOut } from '../../engine/game'
import { TEA_PRICE } from '../../engine/places'
import { DATE_TEA_PRICE, type DatePlace } from '../../engine/romance'
import { partnerName, useGame, type MenuPlace } from '../../store/game-store'
import { isFacilityPlace, facilityOfPlace } from '../../engine/village-sites'
import { FacilityHint, FacilityMenu } from '../village/FacilityMenu'

const DATE_AT: Partial<Record<MenuPlace, DatePlace>> = { teaTable: 'tea', pavilion: 'sunset', hill: 'walk' }
const DATE_LABEL: Record<DatePlace, string> = { tea: T.romance.dateTea, sunset: T.romance.dateSunset, walk: T.romance.dateWalk }

export function PlaceMenu({ place }: { place: MenuPlace }) {
  const game = useGame((s) => s.game)
  const { startCraft, warm, eat, closeModal, open, sitHill, playHall, drinkTea, watchSunset, rest, goDate } = useGame.getState()
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
    commonBench: T.village.defs.longBench.name,
    flowerBed: T.village.defs.flowerBed.name,
    shadeSpot: T.village.defs.shade.name,
    signPost: T.village.defs.signPost.name,
  }[place]
  const hall = place === 'hallTable' ? canPlayHall(game, CONTENT) : null
  const tea = place === 'teaTable' ? canDrinkTea(game) : null
  const sunset = place === 'pavilion' ? canWatchSunset(game) : null
  // 함께 가기: 연인이 있을 때만 버튼이 보인다
  const datePlace = DATE_AT[place]
  const partner = partnerName(game)
  const date = datePlace && game.romance?.stage ? canDate(game, datePlace, CONTENT) : 'noPartner'
  const dateHint =
    date === 'done'
      ? T.romance.dateAlready
      : date === 'away'
        ? fill(T.romance.dateAway, { who: withSubject(partner) })
        : date === 'busy'
          ? fill(T.romance.dateBusy, { who: withSubject(partner) })
          : datePlace === 'walk' && date === 'closed'
            ? T.romance.walkClosed
            : datePlace === 'walk' && date === 'wet'
              ? T.romance.walkWet
              : null
  return (
    <div className="dialog" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      <div className="actions menu column">
        {clubHere(game,place) && <button className="primary" onClick={() => open({ kind: 'clubSession', id: clubHere(game,place)!.id })}>{T.clubs.join}</button>}
        {festHere(game,place) && <button className="primary" onClick={() => open({ kind: 'festSession', id: festHere(game,place)!.id })}>{T.fest.join}</button>}
        {['hallTable','teaTable'].includes(place) && <button onClick={() => open({ kind: 'clubs' })}>{T.clubs.title}</button>}
        {isFacilityPlace(place) && <FacilityMenu place={place} />}
        {place === 'hearth' && (
          <>
            <SkillCraftOptions at="hearth" />
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
            <SkillCraftOptions />
            <button disabled={canCraft(game, 'papyrus') !== null} onClick={() => startCraft('papyrus')}>
              {T.ui.workPapyrus}
            </button>
            <button disabled={canCraft(game, 'ink') !== null} onClick={() => startCraft('ink')}>
              {fill(T.ui.workInk, { n: 1 })}
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
            <button disabled={canCraft(game, 'creamPaper') !== null} onClick={() => startCraft('creamPaper')}>
              {T.ui.workCream}
            </button>
            <button disabled={canCraft(game, 'fineThread') !== null} onClick={() => startCraft('fineThread')}>
              {T.ui.workThread}
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
        {datePlace && date !== 'noPartner' && (
          <button className="primary" disabled={date !== null} onClick={() => goDate(datePlace)}>
            {fill(DATE_LABEL[datePlace], { with: withAnd(partner), n: DATE_TEA_PRICE })}
          </button>
        )}
        {(place === 'hill' || place === 'bench' || place === 'homeBench' || place === 'pavilion') && (
          <button className={place === 'pavilion' ? '' : 'primary'} disabled={game.collected.length === 0} onClick={() => open({ kind: 'readPick' })}>
            {T.ui.readScripture}
          </button>
        )}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
      {dateHint && <p className="hint">{dateHint}</p>}
      {isFacilityPlace(place) && facilityOfPlace(place) && <FacilityHint place={place} />}
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
      {game.needs.fatigue >= 100 && !['hill', 'bench', 'homeBench', 'teaTable', 'pavilion', 'commonBench', 'shadeSpot'].includes(place) && <p className="hint">{T.ui.tooTired}</p>}
      {(['bread', 'papyrus', 'ink', 'oil', 'blanket', 'cover', 'scentCandle', 'creamPaper', 'fineThread'] as const).some((r) => canCraft(game, r) === 'full') && <p className="hint">{T.ui.bagFull}</p>}
    </div>
  )
}
