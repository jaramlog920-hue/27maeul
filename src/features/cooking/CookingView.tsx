import { useCallback, useEffect, useRef, useState } from 'react'
import { neighborById } from '../../content/catalog'
import { fill, itemName, T, withObject } from '../../content/text'
import {
  canCook, canServe, canSit, chooseLook, clearTable, cookHand, cookOf, DISHES, deliverCook, dinersNear, eatDish, kidCanChoose, knownDish,
  missingFor, NEW_DISHES, nextCookStep, readyBlock, serveMax, serveTable, setBreadShape, sitTable, startCook, type DishId, type MealReaction,
} from '../../engine/cooking'
import { canCraft } from '../../engine/game'
import { COOKED_ITEMS, count } from '../../engine/items'
import type { ItemId } from '../../engine/types'
import { COOKING_PROPS } from '../../render/cooking-art'
import { FURNI_PALETTE } from '../../render/furniture-art'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'
import { HandPractice } from '../work/HandPractice'

const C = T.cooking
type DishText = { name: string; note: string; hands?: string[]; looks?: string[]; art?: string[] }
const dishText = (id: DishId) => (C.dishes as Record<string, DishText>)[id]

/** assets/cooking 도트 하나를 그대로 키워 보인다 (16×16 원본, 확대는 nearest-neighbor) */
export function DishArt({ id, size = 48 }: { id: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const g = ref.current?.getContext?.('2d')
    const a = COOKING_PROPS[id]
    if (!g || !a) return
    g.clearRect(0, 0, 16, 16)
    a.rows.forEach((row, y) => [...row].forEach((ch, x) => {
      const c = FURNI_PALETTE[ch]
      if (ch === '.' || !c) return
      g.fillStyle = c
      g.fillRect(x, y, 1, 1)
    }))
  }, [id])
  return <canvas ref={ref} className="dish-art" width={16} height={16} aria-hidden="true" style={{ width: size, height: size, imageRendering: 'pixelated', verticalAlign: 'middle' }} />
}

const itemLine = (items: Partial<Record<ItemId, number>>, have?: (id: ItemId) => number) =>
  (Object.entries(items) as [ItemId, number][]).map(([id, n]) => `${itemName(id)} ${n}${have ? ` (${have(id)})` : ''}`).join(' · ')
const whoName = (id: string) => (id === 'family:child' ? C.child : neighborById(id)?.role ?? id)

/** 직접 요리: 화덕에서 요리 고르기 → 손질·조리 → 담기 → 먹기/식탁. 단계마다 한 화면, 실패·시간 경쟁 없음 */
export function CookingView() {
  const game = useGame((s) => s.game)
  const [view, setView] = useState<'home' | 'table' | DishId>('home')
  const [after, setAfter] = useState<{ item: ItemId; n: number; uneven: boolean } | null>(null)
  const [byKid, setByKid] = useState(false)
  const [note, setNote] = useState('')
  const [serving, setServing] = useState<{ item: ItemId; n: number } | null>(null)
  const [guests, setGuests] = useState<string[]>([])
  const [reactions, setReactions] = useState<MealReaction[]>([])
  const close = useGame.getState().closeModal
  const c = cookOf(game)
  const run = c.run
  const tick = useCallback((dt: number) => { const s = useGame.getState(); applyLifeState(cookHand(s.game, 'tick', dt, s.rng), false) }, [])
  const tap = useCallback((input: number) => { const s = useGame.getState(); applyLifeState(cookHand(s.game, 'tap', input, s.rng), false) }, [])
  const rng = () => useGame.getState().rng
  const got = (next: typeof game, from: NonNullable<typeof run>) => {
    const left = cookOf(next).run
    if (!left) setAfter({ item: DISHES[from.dish].item, n: DISHES[from.dish].qty, uneven: from.uneven })
  }

  // ── 하던 요리 ──
  if (run) {
    const def = DISHES[run.dish], text = dishText(run.dish)
    return <div className="dialog" role="dialog" aria-label={C.title}><h2>{text.name}</h2>
      {run.phase === 'hand' && run.mini && <>
        <p>{fill(C.handLead, { n: run.hand + 1, label: text.hands?.[run.hand] ?? '' })}</p>
        <HandPractice state={run.mini} tick={tick} tap={tap} finish={() => applyLifeState(nextCookStep(useGame.getState().game, rng()))} />
      </>}
      {run.phase === 'finish' && <>
        <p>{C.finishAsk}</p>
        {kidCanChoose(game) && <p><label><input type="checkbox" checked={byKid} onChange={(e) => setByKid(e.target.checked)} /> {C.kidChoose}</label></p>}
        <div className="actions menu column">
          {[0, 1].map((i) => <button key={i} className="primary" onClick={() => {
            const next = chooseLook(useGame.getState().game, i, byKid)
            applyLifeState(next)
            got(next, run)
          }}><DishArt id={def.art[i]} size={32} /> {text.looks?.[i]}</button>)}
        </div>
      </>}
      {run.phase === 'ready' && <>
        <p><DishArt id={def.art[run.look]} /> {fill(C.resultLine, { item: itemName(def.item), n: def.qty })}</p>
        {run.uneven && <p className="hint">{C.uneven}</p>}
        {readyBlock(game) !== null && <p className="hint">{C.waitFull}</p>}
        <button className="primary" disabled={readyBlock(game) !== null} onClick={() => { const next = deliverCook(useGame.getState().game); applyLifeState(next); got(next, run) }}>{C.receive}</button>
      </>}
      <div className="actions"><button onClick={close}>{C.later}</button></div>
    </div>
  }

  // ── 방금 만든 음식 ──
  if (after) {
    const tea = after.item === 'herbTea'
    const have = count(game.inv, after.item)
    return <div className="dialog" role="dialog" aria-label={C.title}><h2>{C.resultTitle}</h2>
      <p><DishArt id={DISHES[(NEW_DISHES.find((d) => DISHES[d].item === after.item) ?? 'beanDish')].art[c.looks[NEW_DISHES.find((d) => DISHES[d].item === after.item) ?? 'beanDish'] ?? 0]} /> {fill(C.resultLine, { item: itemName(after.item), n: after.n })}</p>
      {after.uneven && <p className="hint">{C.uneven}</p>}
      {note && <p role="status">{note}</p>}
      <p>{C.afterTitle}</p>
      <div className="actions menu column">
        <button disabled={have < 1} onClick={() => { applyLifeState(eatDish(useGame.getState().game, after.item)); setNote(fill(tea ? C.drank : C.ate, { item: withObject(itemName(after.item)) })) }}>{tea ? C.drink : C.eat}</button>
        <button disabled={canServe(game) !== null} onClick={() => { setServing({ item: after.item, n: 1 }); setAfter(null); setView('table') }}>{C.toTable}</button>
        <button onClick={() => { setAfter(null); setNote(''); setView('home') }}>{C.keep}</button>
      </div>
    </div>
  }

  // ── 식탁 ──
  if (view === 'table') {
    const t = c.table
    const block = canServe(game)
    const diners = t ? dinersNear(game) : []
    const sitBlock = canSit(game, guests)
    return <div className="dialog" role="dialog" aria-label={C.table}><h2>{C.table}</h2>
      {note && <p role="status">{note}</p>}
      {t ? <>
        <p><DishArt id={t.item === 'herbTea' ? 'herbTea' : t.item === 'honeyBread' ? 'honeyBread' : t.left > 1 ? (t.left >= 3 ? 'mealForFour' : 'mealForTwo') : 'plateEmpty'} /> {fill(C.onTable, { item: itemName(t.item), n: t.left })}</p>
        <h3>{C.guests}</h3>
        {diners.length === 0 && <p className="hint">{C.noGuests}</p>}
        <ul className="event-list">{diners.map((d) => <li key={d.id}>
          <label><input type="checkbox" disabled={d.block !== null} checked={guests.includes(d.id)} onChange={(e) => setGuests(e.target.checked ? [...guests, d.id] : guests.filter((g) => g !== d.id))} /> {whoName(d.id)}</label>
          {d.block && <span className="hint"> · {(C.guestBlock as Record<string, string>)[d.block]}</span>}
        </li>)}</ul>
        {sitBlock === 'few' && <p className="hint">{C.few}</p>}
        <div className="actions menu column">
          <button className="primary" disabled={sitBlock !== null} onClick={() => {
            const r = sitTable(useGame.getState().game, guests)
            if (!r) return
            applyLifeState(r.state)
            setReactions(r.reactions)
            setNote(C.sat)
            setGuests([])
          }}>{guests.length ? fill(C.sitWith, { n: guests.length }) : C.sitAlone}</button>
          <button onClick={() => { applyLifeState(clearTable(useGame.getState().game)); setReactions([]); setNote('') }}>{C.clear}</button>
        </div>
      </> : <>
        {block === 'away' && <p className="hint">{C.tableAway}</p>}
        {block === 'noSpace' && <p className="hint">{C.tableNoSpace}</p>}
        {block === 'noFood' && <p className="hint">{C.tableNoFood}</p>}
        {block === 'busy' && <p className="hint">{C.tableBusy}</p>}
        {block === null && <>
          <p>{C.serveHow}</p>
          <div className="actions menu column">{COOKED_ITEMS.filter((i) => count(game.inv, i) > 0).map((i) => {
            const max = serveMax(game, i)
            const n = Math.min(serving?.item === i ? serving.n : 1, Math.max(1, max))
            return <div key={i} className="skill-option">
              <b>{itemName(i)}</b> <span className="hint">({count(game.inv, i)})</span>
              <div className="actions">{Array.from({ length: max }, (_, k) => k + 1).map((k) => <button key={k} aria-pressed={n === k && serving?.item === i} onClick={() => setServing({ item: i, n: k })}>{k}</button>)}</div>
              <button className="primary" disabled={max < 1} onClick={() => { applyLifeState(serveTable(useGame.getState().game, i, n)); setServing(null); setNote('') }}>{fill(C.serve, { item: itemName(i), n })}</button>
            </div>
          })}</div>
        </>}
      </>}
      {reactions.length > 0 && <><h3>{C.reactTitle}</h3><ul className="event-list">{reactions.map((r) => <li key={r.npc}>{whoName(r.npc)} · {fill((C.react as Record<string, string>)[r.kind], { item: itemName(c.table?.item ?? 'honeyBread') })}</li>)}</ul></>}
      <div className="actions"><button onClick={() => { setView('home'); setNote(''); setReactions([]); setGuests([]) }}>{T.ui.close}</button></div>
    </div>
  }

  // ── 요리 하나 ──
  if (view !== 'home') {
    const dish = view, def = DISHES[dish], text = dishText(dish)
    const have = (id: ItemId) => count(game.inv, id) + count(game.chest ?? {}, id)
    const miss = missingFor(game, dish)
    const block = dish === 'bread' ? canCraft(game, 'bread') : canCook(game, dish)
    return <div className="dialog" role="dialog" aria-label={text.name}><h2>{text.name}</h2>
      <p><DishArt id={def.art[dish === 'bread' ? c.breadShape : c.looks[dish] ?? 0]} /> {text.note}</p>
      {/* 필요한 것·시간을 한 줄로 (2026-10-07 사용자 — 설명이 너무 많았다) */}
      <p className="hint">{fill(C.needLine, { items: itemLine(def.needs, have) })} · {fill(C.timeLine, { n: def.minutes })}</p>
      {miss.length > 0 && <p>{fill(C.missing, { items: itemLine(Object.fromEntries(miss.map((m) => [m.item, m.need - m.have]))) })}</p>}
      {block && block !== 'needs' && <p className="hint">{(C.blocks as Record<string, string>)[block === 'tired' || block === 'full' || block === 'busy' || block === 'unknown' ? block : 'needs']}</p>}
      {dish === 'bread' ? <>
        <p>{C.breadShape}</p>
        <div className="actions">{C.breadShapes.map((n, i) => <button key={n} aria-pressed={c.breadShape === i} onClick={() => applyLifeState(setBreadShape(useGame.getState().game, i))}><DishArt id={def.art[i]} size={32} /> {n}</button>)}</div>
        <button className="primary" disabled={block !== null} onClick={() => useGame.getState().startCraft('bread')}>{C.breadBake}</button>
      </> : <>
        <button className="primary" disabled={block !== null} onClick={() => { applyLifeState(startCook(useGame.getState().game, dish, rng())); setByKid(false) }}>{C.start}</button>
      </>}
      <div className="actions"><button onClick={() => setView('home')}>{T.ui.close}</button></div>
    </div>
  }

  // ── 처음 화면 ──
  const have = COOKED_ITEMS.filter((i) => count(game.inv, i) > 0)
  const known = (Object.keys(DISHES) as DishId[]).filter((d) => d === 'bread' || knownDish(game, d))
  const unknown = NEW_DISHES.filter((d) => !knownDish(game, d))
  return <div className="dialog" role="dialog" aria-label={C.title}><h2>{C.title}</h2>
    {note && <p role="status">{note}</p>}
    {/* 서고 목록처럼: 이름 · 필요한 것 · 시간 (2026-10-07 사용자) */}
    <h3 className="rows-title">{C.list}</h3>
    <ul className="rows">{known.map((d) => {
      const def = DISHES[d]
      const ok = (d === 'bread' ? canCraft(game, 'bread') : canCook(game, d)) === null
      return <li key={d}><button className="row" onClick={() => setView(d)}>
        <span className="row-icon"><DishArt id={def.art[0]} size={32} /></span>
        <span className="row-main"><b>{dishText(d).name}</b><small>{itemLine(def.needs, (id) => count(game.inv, id) + count(game.chest ?? {}, id))}</small></span>
        <span className="row-meta">{ok ? fill(C.timeLine, { n: def.minutes }) : C.blocks.needs}</span>
      </button></li>
    })}</ul>
    {unknown.length > 0 && <><h3 className="rows-title">{C.unknownTitle}</h3>
      <ul className="rows">{unknown.map((d) => <li key={d}><div className="row">
        <span className="row-icon"><DishArt id={DISHES[d].art[0]} size={32} /></span>
        <span className="row-main"><b>{dishText(d).name}</b><small>{fill(C.teachers, { who: DISHES[d].teachers.map(whoName).join(' · ') })}</small></span>
      </div></li>)}</ul></>}
    {have.length > 0 && <><h3 className="rows-title">{C.bagFoods}</h3>
      <ul className="rows">{have.map((i) => <li key={i}><button className="row" onClick={() => { applyLifeState(eatDish(useGame.getState().game, i)); setNote(fill(i === 'herbTea' ? C.drank : C.ate, { item: withObject(itemName(i)) })) }}>
        <span className="row-main"><b>{itemName(i)}</b><small>{i === 'herbTea' ? C.drink : C.alone}</small></span>
        <span className="row-meta">{count(game.inv, i)}</span>
      </button></li>)}</ul></>}
    <ul className="rows"><li><button className="row" onClick={() => setView('table')}>
      <span className="row-main"><b>{C.toTable}</b>{c.table && <small>{fill(C.onTable, { item: itemName(c.table.item), n: c.table.left })}</small>}</span>
    </button></li></ul>
    <div className="actions"><button data-close onClick={close}>{T.ui.close}</button></div>
  </div>
}

