import { featureHint } from '../../engine/feature-rules'
import { sayTime } from '../../engine/clock'
import { SUNSET_FROM, SUNSET_TO, TEA_FROM, TEA_TO } from '../../engine/places'
import { clubHere } from '../../engine/clubs'
import { festHere } from '../../engine/fest'
import { SkillCraftOptions } from '../skills/SkillLesson'
// 화덕·작업대·기름틀·언덕 벤치, 그리고 모이는 곳(사랑방·찻집·정자 — 계획 10)에서 할 수 있는 일
// 연인·약혼·부부면 찻집·정자·언덕에서 "○○와 함께" 가기 (계획 10 작업 4)
import { CONTENT } from '../../content/catalog'
import { fill, T, withAnd, withSubject } from '../../content/text'
import { canCraft, canDate, canDrinkTea, canPlayHall, canWatchSunset, hasFood, starsOut, stockOf, type CraftBlock } from '../../engine/game'
import { BlockedButton } from '../../shared/BlockedButton'
import { TEA_PRICE } from '../../engine/places'
import { canRead, nextReadingDay } from '../../engine/meetings'
import { RowLabel } from '../../shared/RowLabel'
import { t } from '../../shared/i18n'
import { DATE_TEA_PRICE, type DatePlace } from '../../engine/romance'
import { partnerName, useGame, type MenuPlace } from '../../store/game-store'
import { isFacilityPlace, facilityOfPlace } from '../../engine/village-sites'
import { FacilityHint, FacilityMenu } from '../village/FacilityMenu'
import { copiedChapters } from '../../engine/copied-reading'
import { RECIPES, recipeGives, type RecipeId } from '../../engine/items'
import { IconGrid, NeedList } from '../../shared/IconGrid'
import { ItemIcon } from '../../shared/ItemIcon'
import type { ItemId } from '../../engine/types'

/** 제작대에서 만드는 것 (줄 이름은 예전 단추 글 그대로) */
const WORKBENCH: { id: RecipeId; text: string }[] = [
  { id: 'homeCradle', text: T.recipes.homeCradle },
  { id: 'papyrus', text: T.ui.workPapyrus },
  { id: 'ink', text: fill(T.ui.workInk, { n: 1 }) },
  { id: 'blanket', text: T.ui.workBlanket },
  { id: 'cover', text: T.ui.workCover },
  { id: 'scentCandle', text: T.ui.workCandle },
  { id: 'creamPaper', text: T.ui.workCream },
  { id: 'fineThread', text: T.ui.workThread },
]

const DATE_AT: Partial<Record<MenuPlace, DatePlace>> = { teaTable: 'tea', pavilion: 'sunset', hill: 'walk' }
/** 줄 안내가 없는 데이트 막힘의 까닭 (누르면 한 줄) */
const DATE_WHY: Record<string, string> = {
  closed: `찻집은 ${sayTime(TEA_FROM)}부터 ${sayTime(TEA_TO)}까지 열어요.`,
  coins: '찻값 닢이 모자라요.',
  notYet: `노을은 ${sayTime(SUNSET_FROM)}부터 ${sayTime(SUNSET_TO)} 사이에 볼 수 있어요.`,
  cloudy: '오늘은 구름이 껴서 노을이 보이지 않아요.',
  wet: '비가 와서 오늘은 어려워요.',
}
const DATE_LABEL: Record<DatePlace, string> = { tea: T.romance.dateTea, sunset: T.romance.dateSunset, walk: T.romance.dateWalk }
/** 누르면 한 줄로 알리는 막힘 까닭 (2026-10-26 감사 A02: 그냥 회색이라 왜 안 되는지 몰랐다) */
const HALL_WHY: Record<string, string> = { closed: T.places.hallClosed, played: T.places.hallPlayed, tired: T.ui.tooTired, empty: T.places.hallEmpty }
const TEA_WHY: Record<string, string> = { closed: T.places.teaClosed, coins: T.places.teaCoins }
const SUNSET_WHY: Record<string, string> = { notYet: T.places.sunsetNotYet, cloudy: T.places.sunsetCloudy }
function craftWhy(block: CraftBlock): string | null {
  if (block === null) return null
  return { needs: t('why.craftNeeds'), tired: T.ui.tooTired, full: T.ui.bagFull, job: t('why.craftJob'), recipe: t('why.craftRecipe') }[block]
}

export function PlaceMenu({ place }: { place: MenuPlace }) {
  const game = useGame((s) => s.game)
  const { startCraft, warm, eat, closeModal, open, sitHill, playHall, drinkTea, watchSunset, goDate } = useGame.getState()
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
  const read = place === 'hallTable' ? canRead(game) : null
  const readWhy = read === 'done' ? '오늘은 이웃들과 함께 읽었어요.' : read === 'feast' ? t('reading.feast') : read === 'notToday' ? `다음 모임은 ${nextReadingDay(game)}일째 저녁 7~9시예요. 사랑방 탁자를 눌러 참여하세요.` : read === 'time' ? '오늘 저녁 7~9시에 사랑방 탁자를 눌러 참여하세요.' : null
  // 함께 가기: 연인이 있을 때만 버튼이 보인다
  const datePlace = DATE_AT[place]
  const partner = partnerName(game)
  const date = datePlace && game.romance?.stage ? canDate(game, datePlace, CONTENT) : 'noPartner'
  const dateHint =
    date === 'locked' ? featureHint('dating') : date === 'done'
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
            <button className="primary" onClick={() => open({ kind: 'cooking' })}>
              {game.cooking?.run ? fill(T.cooking.resume, { dish: T.cooking.dishes[game.cooking.run.dish].name }) : T.cooking.open}
            </button>
            <button onClick={warm}>{T.ui.hearthWarm}</button>
            <BlockedButton why={hasFood(game.inv) ? null : t('why.noFood')} onClick={eat}>
              {T.ui.hearthEat}
            </BlockedButton>
          </>
        )}
        {place === 'workbench' && (
          <>
            <SkillCraftOptions />
            {/* 2026-10-12 사용자: 줄줄이 늘어놓지 않고 가방처럼 아이콘 칸 — 누르면 재료(가진 수/필요한 수)·설명, 단추로 만들기 */}
            <IconGrid title={T.ui.workbenchTitle} entries={WORKBENCH.filter((w) => w.id !== 'homeCradle' || game.recipesKnown.includes('homeCradle')).map((w) => {
              const r = RECIPES[w.id]
              const out = Object.keys(r.gives)[0] as ItemId
              const block = canCraft(game, w.id)
              return {
                key: w.id,
                icon: <ItemIcon id={out} size={28} />,
                label: w.text.split(' (')[0].split(' — ')[0],
                dim: block !== null,
                detail: <><NeedList needs={r.needs as Record<string, number>} have={(id) => stockOf(game, id as ItemId)} icon={(id) => <ItemIcon id={id as ItemId} size={16} />} /><p>{w.text}</p></>,
                action: { label: '만들기', why: craftWhy(block), onClick: () => startCraft(w.id) },
              }
            })} />
          </>
        )}
        {place === 'press' && (
          <BlockedButton why={craftWhy(canCraft(game, 'oil'))} onClick={() => startCraft('oil')}>
            <RowLabel text={fill(T.ui.pressMake, { n: recipeGives(RECIPES.oil, game.inv, game.flags).oil ?? 0 })} />
          </BlockedButton>
        )}
        {/* 별 보기는 언덕에만 (stargaze는 자리와 무관 — 다른 별 보는 자리도 이 버튼을 붙이면 된다) */}
        {place === 'hill' && (
          <BlockedButton why={starsOut(game.clock.minute) ? null : T.ui.starsNotYet} onClick={sitHill}>
            {T.ui.hillStars}
          </BlockedButton>
        )}
        {place === 'hallTable' && (
          <BlockedButton className="primary" why={hall === null ? null : HALL_WHY[hall] ?? t('why.notNow')} onClick={playHall}>
            {T.places.hallPlay}
          </BlockedButton>
        )}
        {place === 'hallTable' && (
          <>
            <BlockedButton why={canRead(game) === null ? null : readWhy} onClick={() => useGame.getState().startReading()}>
              {T.meetings.reading} · 본문 펼치기
            </BlockedButton>
            <p className="hint">{readWhy ?? '모임 중이에요. 본문 펼치기를 누르면 이웃들과 함께 읽을 수 있어요.'}</p>
          </>
        )}
        {place === 'teaTable' && (
          <BlockedButton className="primary" why={tea === null ? null : TEA_WHY[tea] ?? t('why.notNow')} onClick={drinkTea}>
            {fill(T.places.teaDrink, { n: TEA_PRICE })}
          </BlockedButton>
        )}
        {place === 'pavilion' && (
          <>
            <BlockedButton className="primary" why={sunset === null ? null : SUNSET_WHY[sunset] ?? t('why.notNow')} onClick={watchSunset}>
              {T.places.sunsetWatch}
            </BlockedButton>
          </>
        )}
        {datePlace && date !== 'noPartner' && (
          // 막혔으면 흐린 채로, 누르면 까닭 한 줄 — 찻집 시간·닢·노을 때처럼 줄 안내가 없는 경우도 (2026-10-21 사용자)
          <button className="primary" aria-disabled={date !== null} onClick={() => (date ? useGame.getState().say(dateHint ?? DATE_WHY[date] ?? '', 2800) : goDate(datePlace))}>
            {fill(DATE_LABEL[datePlace], { with: withAnd(partner), n: DATE_TEA_PRICE })}
          </button>
        )}
        {(place === 'hill' || place === 'bench' || place === 'homeBench' || place === 'pavilion') && (
          <BlockedButton className={place === 'pavilion' ? '' : 'primary'} why={place === 'pavilion' ? (copiedChapters(game, CONTENT).length === 0 ? t('why.noCopied') : null) : game.collected.length === 0 ? t('why.noPieces') : null} onClick={() => open(place === 'pavilion' ? { kind: 'readPick', source: 'copied' } : { kind: 'readPick' })}>
            {T.ui.readScripture}
          </BlockedButton>
        )}
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
      {dateHint && <p className="hint">{dateHint}</p>}
      {isFacilityPlace(place) && facilityOfPlace(place) && <FacilityHint place={place} />}
      {place === 'hill' && !starsOut(game.clock.minute) && <p className="hint">{T.ui.starsNotYet}</p>}
      {hall === 'closed' && <p className="hint">{T.places.hallClosed}</p>}
      {hall === 'empty' && canRead(game) !== null && <p className="hint">{T.places.hallEmpty}</p>}
      {hall === 'played' && <p className="hint">{T.places.hallPlayed}</p>}
      {tea === 'closed' && <p className="hint">{T.places.teaClosed}</p>}
      {tea === 'coins' && <p className="hint">{T.places.teaCoins}</p>}
      {sunset === 'notYet' && <p className="hint">{T.places.sunsetNotYet}</p>}
      {sunset === 'cloudy' && <p className="hint">{T.places.sunsetCloudy}</p>}
      {game.needs.fatigue >= 100 && !['hill', 'bench', 'homeBench', 'teaTable', 'pavilion', 'commonBench', 'shadeSpot'].includes(place) && <p className="hint">{T.ui.tooTired}</p>}
      {(['bread', 'papyrus', 'ink', 'oil', 'blanket', 'cover', 'scentCandle', 'creamPaper', 'fineThread', 'homeCradle'] as const).some((r) => canCraft(game, r) === 'full') && <p className="hint">{T.ui.bagFull}</p>}
    </div>
  )
}
