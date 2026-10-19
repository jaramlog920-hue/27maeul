import { useState } from 'react'
import { fill, ITEM_TEXT, itemName, T } from '../../content/text'
import { canBind, chestOf, clockTargets, PANTRY_FOODS, pantryOf, playerTile, timeSpeed } from '../../engine/game'
import { formatTime } from '../../engine/clock'
import { CONTENT } from '../../content/catalog'
import { finishedCopies } from '../../engine/binding'
import { RECIPES, type RecipeId } from '../../engine/items'
import { BOOKS } from '../../engine/types'
import { BookCover } from '../library/BookArt'
import { MAX_LEVEL, levelOf, STAT_IDS, statScore, type StatId, type Stats } from '../../engine/stats'
import { isHome } from '../../engine/world'
import type { ItemId } from '../../engine/types'
import { ItemIcon } from '../../shared/ItemIcon'
import { isGear, wearing } from '../../engine/gear'
import { YARD_ITEMS, type YardItem } from '../../engine/yard'
import { useGame, type BagTab } from '../../store/game-store'
import { NeedsView } from '../menus/CareMenu'
import { CollectionDex } from './CollectionDex'
import { t } from '../../shared/i18n'

const STAT_NAME = T.stats.names as Record<StatId, string>
const STAT_DESC = T.stats.desc as Record<StatId, string>

/** 능력치 다섯 (계획 11 작업 4): 단계만큼 찬 막대 다섯(다음 칸은 쌓인 경험치만큼), 타고난 값은 작은 별 */
export function StatsView({ stats }: { stats: Stats }) {
  // 줄을 누르면 그 능력치가 무엇에 쓰이는지 펼친다
  const [open, setOpen] = useState<StatId | null>(null)
  return (
    <section className="stats" aria-label={T.stats.title}>
      <h3>{T.stats.title}</h3>
      <ul className="stats-list">
        {STAT_IDS.map((id) => {
          const st = stats[id]
          // 칸 색칠은 1~100 수치 그대로 (칸 하나 = 100/MAX_LEVEL)
          const score = statScore(st)
          const level = levelOf(stats, id)
          const per = 100 / MAX_LEVEL
          return (
            <li key={id} data-stat={id} className={open === id ? 'on' : ''} onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id}>
              <span className="stat-name">
                {STAT_NAME[id]}
                {st.born > 0 && (
                  <span className="stat-born" aria-label={fill(T.stats.born, { n: st.born })}>
                    {'★'.repeat(st.born)}
                  </span>
                )}
              </span>
              <span className="stat-bars" aria-label={fill(T.stats.level, { n: level })}>
                {Array.from({ length: MAX_LEVEL }, (_, i) => {
                  const fillPct = Math.round(Math.max(0, Math.min(1, (score - i * per) / per)) * 100)
                  return (
                    <span key={i} className="stat-bar">
                      <span style={{ width: `${fillPct}%` }} />
                    </span>
                  )
                })}
              </span>
              <span className="stat-level" title={fill(T.stats.level, { n: level })}>
                {score}
                <small>/100</small>
              </span>
              {open === id && <div className="tap-explain">
                <p>{fill(T.stats.progress, { n: level, score })}</p>
                <p>{STAT_DESC[id]}</p>
                <p>{T.stats.thresholds}</p>
              </div>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** 한 줄에 여섯 칸 — 빈칸까지 채워 보여 준다 (적어도 두 줄) */
const COLS = 6
function slotsFor(n: number): number {
  return Math.max(COLS * 2, Math.ceil(n / COLS) * COLS)
}

export type Pick = { from: 'bag' | 'chest' | 'pantry'; id: ItemId }

/** 아이콘만 늘어놓은 칸들. 누르면 아래에 이름·설명 */
export function ItemGrid({ items, picked, from, onPick }: { items: [ItemId, number][]; picked: Pick | null; from: Pick['from']; onPick: (p: Pick) => void }) {
  return (
    <div className="bag-grid">
      {Array.from({ length: slotsFor(items.length) }, (_, i) => {
        const it = items[i]
        if (!it) return <span key={i} className="bag-slot empty" />
        const [id, n] = it
        const on = picked?.from === from && picked.id === id
        return (
          <button key={id} className={`bag-slot${on ? ' on' : ''}`} aria-label={`${itemName(id)} ${n}`} aria-pressed={on} onClick={() => onPick({ from, id })}>
            <ItemIcon id={id} size={28} />
            {n > 1 && <b className="bag-count">{n}</b>}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 가방 속 완성본 (계획 14 작업 4): 제본했지만 아직 서고에 꽂지 않은 책 — 마을 서고에 직접 가져가 꽂는다.
 * 다 필사했지만 아직 제본하지 않은 책은 여기서 제본 창을 연다
 */
function Copies() {
  const game = useGame((s) => s.game)
  const openBind = useGame((s) => s.openBind)
  const copies = finishedCopies(game)
  const waiting = BOOKS.filter((b) => canBind(game, b, CONTENT) === null)
  if (!copies.length && !waiting.length) return null
  return (
    <>
      {copies.length > 0 && (
        <section className="bag-copies" aria-label={T.library.copiesTitle}>
          <h3>{T.library.copiesTitle}</h3>
          <ul>
            {copies.map((b) => (
              <li key={b}>
                <BookCover book={b} binding={game.bound[b]} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {waiting.length > 0 && (
        <section className="bag-copies" aria-label={T.library.waitingTitle}>
          <h3>{T.library.waitingTitle}</h3>
          <ul>
            {waiting.map((b) => (
              <li key={b}>
                <span>{(T.quiz.books as Record<string, string>)[b]}</span>
                <button onClick={() => openBind(b, 'bag')}>{T.library.bind}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

/** 만들기: 만들 줄 아는 것 (예전 선반의 요리법) */
function Recipes() {
  const known = useGame((s) => s.game.recipesKnown)
  const [picked, setPicked] = useState<RecipeId | null>(null)
  const selected = picked && known.includes(picked) ? RECIPES[picked] : null
  if (!known.length) return <p>{T.ui.recipesEmpty}</p>
  return (
    <>
      <h3>{T.ui.recipes}</h3>
      <div className="bag-grid">
        {Array.from({ length: slotsFor(known.length) }, (_, i) => {
          const id = known[i]
          if (!id) return <span key={i} className="bag-slot empty" />
          const output = Object.keys(RECIPES[id].gives)[0] as ItemId
          return (
            <button key={id} className={`bag-slot${picked === id ? ' on' : ''}`} aria-label={T.recipes[id].split(' — ')[0]} aria-pressed={picked === id} onClick={() => setPicked(id)}>
              <ItemIcon id={output} size={28} />
            </button>
          )
        })}
      </div>
      {selected ? (
        <div className="bag-detail" role="status" aria-live="polite">
          <ItemIcon id={Object.keys(selected.gives)[0] as ItemId} size={32} />
          <div>
            <strong>{T.recipes[selected.id].split(' — ')[0]}</strong>
            <p>{T.ui.recipeNeeds}</p>
            <ul className="recipe-materials">
              {(Object.entries(selected.needs) as [ItemId, number][]).map(([id, n]) => (
                <li key={id}><ItemIcon id={id} size={20} /><span>{itemName(id)} {n}</span></li>
              ))}
            </ul>
            <p>{T.recipes[selected.id]}</p>
          </div>
        </div>
      ) : <p className="bag-detail hint">{T.ui.recipeTapHint}</p>}
    </>
  )
}

const BAG_TABS: [BagTab, string][] = [
  ['items', '물건'],
  ['make', '만들기'],
  ['dex', t('dex.title')],
]

/** 가방: 물건 · 만들기 · 도감 */
export function Bag({ tab: first = 'items' }: { tab?: BagTab }) {
  const [tab, setTab] = useState<BagTab>(first)
  const closeModal = useGame((s) => s.closeModal)
  return (
    <div className="dialog bag" role="dialog" aria-label={T.ui.bag}>
      <h2>{T.ui.bag}</h2>
      <div className="tabs" role="tablist">
        {BAG_TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'items' && <Things />}
      {tab === 'make' && <Recipes />}
      {tab === 'dex' && <CollectionDex />}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 물건 칸: 가진 것·재료 궤짝·완성본·몸 상태·능력치 */
function Things() {
  const game = useGame((s) => s.game)
  const takeChest = useGame((s) => s.takeChest)
  const { putPantry, takePantry } = useGame.getState()
  const inv = game.inv
  const items = (Object.entries(inv) as [ItemId, number][]).filter(([, n]) => n > 0)
  // 재료 궤짝 (계획 11): 가진 뒤에만 보인다. 꺼내기는 집 안에서만
  const chest = chestOf(game)
  const boxed = chest ? (Object.entries(chest) as [ItemId, number][]).filter(([, n]) => n > 0) : []
  const atHome = isHome(playerTile(game))
  // 서늘한 찬장 (2026-10-08): 음식만, 넣고 꺼내기는 집 안에서만
  const pantry = pantryOf(game)
  const stored = pantry ? (Object.entries(pantry) as [ItemId, number][]).filter(([, n]) => n > 0) : []
  const [picked, setPickedRaw] = useState<Pick | null>(null)
  // 버리기는 한 번 더 묻는다 (되돌릴 수 없다)
  const [asking, setAsking] = useState(false)
  const setPicked = (p: Pick | null) => {
    setAsking(false)
    setPickedRaw(p)
  }
  const { toggleGear, discard, yardMove } = useGame.getState()
  const list = picked?.from === 'chest' ? boxed : picked?.from === 'pantry' ? stored : items
  const pickedN = picked ? (list.find(([id]) => id === picked.id)?.[1] ?? 0) : 0
  const detail = (from: Pick['from']) =>
    picked?.from === from && pickedN > 0 ? (
      <div className="bag-detail">
        <ItemIcon id={picked.id} size={32} />
        <div>
          <strong>
            {itemName(picked.id)} <b>{pickedN}</b>
            {from === 'bag' && isGear(picked.id) && wearing(game, picked.id) && <small className="gear-worn"> · {T.gear.worn}</small>}
          </strong>
          <p>{ITEM_TEXT[picked.id]?.desc}</p>
        </div>
        {/* 단추는 설명 아래 한 줄에 같은 크기로 (2026-10-13 사용자: 끼기·버리기·그만두기가 어수선했다). 버리기를 누르면 그 줄이 확인 줄로 바뀐다 */}
        {asking && from === 'bag' ? (
          <div className="bag-actions" role="group" aria-label={T.gear.discard}>
            <p className="hint">{T.gear.discardAsk}</p>
            <button className="danger" onClick={() => { discard(picked.id, 1); setAsking(false) }}>{T.gear.discardOne}</button>
            {pickedN > 1 && <button className="danger" onClick={() => { discard(picked.id, pickedN); setAsking(false) }}>{fill(T.gear.discardAll, { n: pickedN })}</button>}
            <button onClick={() => setAsking(false)}>{T.gear.cancel}</button>
          </div>
        ) : (
          <div className="bag-actions">
            {from === 'bag' && isGear(picked.id) && (
              <button className={wearing(game, picked.id) ? 'on' : ''} aria-pressed={wearing(game, picked.id)} onClick={() => toggleGear(picked.id)}>
                {wearing(game, picked.id) ? T.gear.remove : T.gear.wear}
              </button>
            )}
            {from === 'bag' && YARD_ITEMS.includes(picked.id as YardItem) && (
              <button disabled={game.map !== undefined && game.map !== 'village'} onClick={() => yardMove(picked.id as YardItem)}>
                {T.yard.place}
              </button>
            )}
            {from === 'bag' && pantry && PANTRY_FOODS.includes(picked.id) && (
              <button disabled={!atHome} onClick={() => putPantry(picked.id)}>
                {T.easy.pantryPut}
              </button>
            )}
            {from === 'chest' && (
              <button disabled={!atHome} onClick={() => takeChest(picked.id)}>
                {T.easy.chestTake}
              </button>
            )}
            {from === 'pantry' && (
              <button disabled={!atHome} onClick={() => takePantry(picked.id)}>
                {T.easy.pantryTake}
              </button>
            )}
            {from === 'bag' && picked.id === 'speedClock' && (
              <button className="primary" onClick={() => useGame.getState().cycleTimeSpeed()}>빠르기 바꾸기 (지금 {timeSpeed(useGame.getState().game)}배)</button>
            )}
            {from === 'bag' && picked.id === 'setClock' && <ClockPicker />}
            {from === 'bag' && picked.id === 'homeKey' && <button className="primary" onClick={() => useGame.getState().useArchiveKey()}>{T.ui.goHome}</button>}
            {from === 'bag' && <button onClick={() => setAsking(true)}>{T.gear.discard}</button>}
          </div>
        )}
      </div>
    ) : (
      <p className="bag-detail hint">{T.ui.bagTapHint}</p>
    )
  return (
    <>
      {items.length === 0 ? <p>{T.ui.bagEmpty}</p> : <ItemGrid items={items} picked={picked} from="bag" onPick={setPicked} />}
      {items.length > 0 && detail('bag')}
      {chest && (
        <>
          <h3>{T.easy.chest}</h3>
          {boxed.length === 0 ? <p>{T.easy.chestEmpty}</p> : <ItemGrid items={boxed} picked={picked} from="chest" onPick={setPicked} />}
          {boxed.length > 0 && detail('chest')}
        </>
      )}
      {pantry && (
        <>
          <h3>{T.easy.pantry}</h3>
          {stored.length === 0 ? <p>{T.easy.pantryEmpty}</p> : <ItemGrid items={stored} picked={picked} from="pantry" onPick={setPicked} />}
          {stored.length > 0 && detail('pantry')}
        </>
      )}
      <Copies />
      <h3>{T.ui.statusTitle}</h3>
      <NeedsView explain />
      <StatsView stats={game.stats} />
    </>
  )
}

/** 시각 맞춤 시계: 다음 정시부터 새벽 2시까지 고른다 (2026-10-14) */
function ClockPicker() {
  const targets = useGame((s) => clockTargets(s.game))
  if (!targets.length) return <p className="hint">더 넘길 시각이 없어요.</p>
  return (
    <div className="clock-picker" role="group" aria-label="넘어갈 시각">
      {targets.map((m) => (
        <button key={m} onClick={() => useGame.getState().setClockTo(m)}>{formatTime(m)}</button>
      ))}
    </div>
  )
}
