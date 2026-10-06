import { useEffect, useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import {
  answerGuest, buyerOf, canOpenStall, closeStall, DEFAULT_LOOK, expireStall, guestText, openStall, stallGoodsAvailable, stallPrice, stallStatus, stallSummary, waitAtStall, welcomeGuest,
  STALL_CLOTHS, STALL_COIN_CAP, STALL_DECOS, STALL_GOODS_MAX, STALL_PER_GOOD, STALL_PRICES, STALL_WAYS, STALL_SIGNS,
  type StallLook, type StallPrice, type StallWay,
} from '../../engine/stall'
import { saveGame } from '../../engine/save'
import type { GameState } from '../../engine/game'
import type { ItemId } from '../../engine/types'
import { useGame } from '../../store/game-store'

const S = T.stall
const itemName = (id: string) => (T.items as Record<string, { name: string }>)[id]?.name ?? id

export function commitStall(next: GameState) {
  saveGame(next)
  useGame.setState({ game: next })
}

/** 장날 상인과 일정 창에서 여는 단추 — 장날이거나 오늘 열어 둔 좌판이 있을 때만 보인다 */
export function StallEntry({ label }: { label?: string }) {
  const game = useGame((s) => s.game)
  const block = canOpenStall(game)
  const live = !!game.stall && game.stall.day === game.clock.day
  if (block === 'notMarket' && !live) return null
  return <button onClick={() => useGame.getState().open({ kind: 'stall' })}>{label ?? (live && block === 'open' ? S.resume : S.entry)}</button>
}

type Pick = { qty: number; price: StallPrice }

/** 좌판: 준비(올릴 물건 → 꾸미기) → 열린 좌판(손님 맞기) → 접은 뒤 요약. 휴대폰에서는 한 화면에 한 가지씩 */
export function StallView() {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const [step, setStep] = useState<'goods' | 'look'>('goods')
  const [picks, setPicks] = useState<Partial<Record<ItemId, Pick>>>({})
  const [look, setLook] = useState<StallLook>(game.stallLook ?? DEFAULT_LOOK)
  // 날이 바뀌었거나 영업 시간이 끝났으면 열 때 한 번 마감 (돌려받을 것은 한 번만)
  useEffect(() => {
    const g = useGame.getState().game
    const next = expireStall(g)
    if (next !== g) commitStall(next)
  }, [])
  const st = game.stall && game.stall.day === game.clock.day ? game.stall : undefined
  const block = canOpenStall(game)
  const exit = <button data-close onClick={closeModal}>{T.ui.close}</button>

  if (st?.closed) {
    const sum = stallSummary(st)
    const back = Object.entries(st.returned ?? {}).filter(([, n]) => (n ?? 0) > 0).map(([id, n]) => `${itemName(id)} ${n}`).join(' · ')
    return (
      <div className="dialog fest-form stall" role="dialog" aria-label={S.title}>
        <h2>{S.summaryTitle}</h2>
        <p>{fill(S.summary, { v: sum.visitors, s: sum.sold, c: sum.coins })}</p>
        <p className="hint">{back ? fill(S.returned, { list: back }) : S.returnedNone}</p>
        {sum.visitors > 0 && <p className="hint">{S.memoryNote}</p>}
        <p className="hint">{S.closedNote}</p>
        <div className="actions">{exit}</div>
      </div>
    )
  }

  if (st) return <Running />

  if (block && block !== 'open') {
    return (
      <div className="dialog fest-form stall" role="dialog" aria-label={S.title}>
        <h2>{S.title}</h2>
        <p className="hint">{S.guide}</p>
        <p>{S.block[block]}</p>
        <div className="actions">{exit}</div>
      </div>
    )
  }

  const avail = stallGoodsAvailable(game)
  const chosen = (Object.keys(picks) as ItemId[]).filter((id) => (picks[id]?.qty ?? 0) > 0)
  const setQty = (id: ItemId, qty: number, have: number) => {
    const q = Math.max(0, Math.min(qty, have, STALL_PER_GOOD))
    setPicks({ ...picks, [id]: { qty: q, price: picks[id]?.price ?? 'normal' } })
  }
  const setPrice = (id: ItemId, price: StallPrice) => setPicks({ ...picks, [id]: { qty: picks[id]?.qty ?? 0, price } })
  const open = () => {
    const list = chosen.map((item) => ({ item, qty: picks[item]!.qty, price: picks[item]!.price }))
    commitStall(openStall(game, list, look))
  }

  return (
    <div className="dialog fest-form stall" role="dialog" aria-label={S.title}>
      <h2>{step === 'goods' ? S.goodsTitle : S.lookTitle}</h2>
      {step === 'goods' && (
        <>
          {!game.stallLook && <p><strong>{neighborById('merchant')?.role}</strong> {S.merchantSays}</p>}
          <p className="hint">{S.guide}</p>
          <p className="hint">{fill(S.goodsHint, { n: STALL_PER_GOOD })}</p>
          <ul className="stall-goods">
            {avail.map(({ item, have }) => {
              const p = picks[item]
              const full = chosen.length >= STALL_GOODS_MAX && !(p && p.qty > 0)
              return (
                <li key={item}>
                  <strong>{itemName(item)}</strong> <span className="hint">{fill(S.have, { n: have })}</span>
                  <div className="actions">
                    <button aria-label={S.minus} disabled={!p || p.qty < 1} onClick={() => setQty(item, (p?.qty ?? 0) - 1, have)}>−</button>
                    <span aria-live="polite">{p?.qty ?? 0}</span>
                    <button aria-label={S.plus} disabled={full || (p?.qty ?? 0) >= Math.min(have, STALL_PER_GOOD)} onClick={() => setQty(item, (p?.qty ?? 0) + 1, have)}>＋</button>
                  </div>
                  {p && p.qty > 0 && (
                    <div className="actions" role="group" aria-label={fill(S.priceLabel, { name: itemName(item) })}>
                      {STALL_PRICES.map((t) => (
                        <button key={t} className={p.price === t ? 'primary' : ''} aria-pressed={p.price === t} onClick={() => setPrice(item, t)}>
                          {S.price[t]} · {fill(S.priceNow, { n: stallPrice(game, item, t) })}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="hint">{S.priceHint}</p>
          <p className="hint">{S.goodsMoved}</p>
          <div className="actions">
            <button className="primary" disabled={!chosen.length} onClick={() => setStep('look')}>{S.next}</button>
            {exit}
          </div>
        </>
      )}
      {step === 'look' && (
        <>
          <p className="hint">{S.lookHint}</p>
          <p>{S.signLabel}</p>
          <div className="actions menu column">
            {Array.from({ length: STALL_SIGNS }, (_, i) => (
              <button key={i} className={look.sign === i ? 'primary' : ''} aria-pressed={look.sign === i} onClick={() => setLook({ ...look, sign: i })}>{S.signs[i]}</button>
            ))}
          </div>
          <p>{S.clothLabel}</p>
          <div className="actions menu column">
            {STALL_CLOTHS.map((c) => <button key={c} className={look.cloth === c ? 'primary' : ''} aria-pressed={look.cloth === c} onClick={() => setLook({ ...look, cloth: c })}>{S.cloths[c]}</button>)}
          </div>
          <p>{S.decoLabel}</p>
          <div className="actions menu column">
            {STALL_DECOS.map((d) => <button key={d} className={look.deco === d ? 'primary' : ''} aria-pressed={look.deco === d} onClick={() => setLook({ ...look, deco: d })}>{S.decos[d]}</button>)}
          </div>
          <p className="hint">{S.openNote}</p>
          <div className="actions">
            <button className="primary" onClick={open}>{S.open}</button>
            <button onClick={() => setStep('goods')}>{S.back}</button>
          </div>
        </>
      )}
    </div>
  )
}

/** 열린 좌판: 지금 상태와 손님 한 사람. 잠시 나가도 좌판은 그대로, 새 손님은 곁에 있을 때만 */
function Running() {
  const game = useGame((s) => s.game)
  const closeModal = useGame((s) => s.closeModal)
  const st = game.stall!
  const status = stallStatus(game, CONTENT)
  const g = st.guest
  const sum = stallSummary(st)
  const text = g ? guestText(g) : null
  const role = g ? neighborById(g.npc)?.role : undefined
  const act = (fn: (s: GameState) => GameState) => commitStall(fn(useGame.getState().game))
  const done = g?.phase === 'done'
  return (
    <div className="dialog fest-form stall" role="dialog" aria-label={S.title}>
      <h2>{fill(S.openTitle, { sign: S.signs[st.look.sign] })}</h2>
      <p>{fill(S.stats, { v: sum.visitors, s: sum.sold, c: sum.coins })}</p>
      <p className="hint">{fill(S.cap, { c: STALL_COIN_CAP })}</p>
      <ul className="stall-goods">
        {st.goods.map((x) => (
          <li key={x.item}>{fill(S.goodLine, { name: itemName(x.item), left: x.left, qty: x.qty, price: fill(S.priceNow, { n: stallPrice(game, x.item, x.price) }) })}</li>
        ))}
      </ul>
      {g && text && (
        <div className="stall-guest" role="status">
          <strong>{role}</strong>
          <p>{text.arrive}</p>
          <p className="hint">{text.want}{!buyerOf(g.npc).browseOnly && !done ? ` ${text.hint}` : ''}</p>
          {text.regular && <p className="hint">{S.regularLine} {text.regular}</p>}
          {text.review && <p>{text.review}</p>}
          {done ? (
            <>
              <p>{g.result === 'sold' ? fill(S.result.sold, { good: itemName(g.item), n: g.coins ?? 0 }) : S.result[g.result ?? 'looked']}</p>
              {text.reply && <p>{text.reply}</p>}
            </>
          ) : (
            <div className="actions menu column">
              {STALL_WAYS.map((w: StallWay) => <button key={w} onClick={() => act((s) => answerGuest(s, w))}>{S.ways[w]}</button>)}
            </div>
          )}
        </div>
      )}
      {g && !done && status === 'away' && <p className="hint">{S.status.away}</p>}
      {(!g || done) && <p className="hint">{S.status[status === 'guest' ? 'ready' : status === 'none' ? 'finished' : status]}</p>}
      <div className="actions menu column">
        {(!g || done) && status === 'ready' && <button className="primary" onClick={() => act((s) => welcomeGuest(s, CONTENT))}>{S.welcome}</button>}
        {(!g || done) && status === 'quiet' && <button onClick={() => act((s) => waitAtStall(s, CONTENT))}>{S.wait}</button>}
        <button className={status === 'finished' || status === 'over' ? 'primary' : ''} onClick={() => act(closeStall)}>{S.close}</button>
        <button onClick={closeModal}>{S.pause}</button>
      </div>
      <p className="hint">{S.pauseNote}</p>
    </div>
  )
}
