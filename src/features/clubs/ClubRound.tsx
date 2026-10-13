// 모임·행사 한 판 (2026-10-13 사용자: 차 따라 주기처럼 길게, 다른 모임·행사도 — 끝에 결과 창, 할 때마다 다른 대화).
// 이웃마다 한 차례: 바라는 것을 듣고 → 맞게 해 준다(누르고 놓기·셋 중 고르기) → 한마디. 다 끝나면 결과와 남은 이야기.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { neighborById } from '../../content/catalog'
import { callName, fill, T } from '../../content/text'
import { HOLD_BANDS, holdZone, playRound, roundDone, roundMarks, roundSeed, ROUND_MODE, wantOf, type RoundKind } from '../../engine/club-round'
import { useGame } from '../../store/game-store'
import { t } from '../../shared/i18n'
import { commitClub } from './club-store'
import { Preview } from './GroupTask'
import './group-task.css'

const R = T.round
type KindText = { open: string; help?: string; opts: string[]; ask: string[][]; good: string[]; miss?: string[]; low?: string[]; high?: string[]; chat: string[] }
const K = R.kinds as Record<RoundKind, KindText>
const pick = <X,>(list: readonly X[], seed: number) => list[seed % list.length]
const hashOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 3)
const role = (npc: string) => neighborById(npc)?.role ?? npc

export function ClubRound({ id, kind, guests, onFinish, extra }: { id: string; kind: RoundKind; guests: readonly string[]; onFinish?: () => void; extra?: ReactNode }) {
  const game = useGame((s) => s.game)
  const me = game.avatar?.name
  const k = K[kind]
  const marks = roundMarks(game, id)
  const done = roundDone(game, id) || marks.length >= guests.length
  const npc = done ? null : guests[marks.length]
  const [amount, setAmount] = useState(0)
  const [said, setSaid] = useState<{ who: string; text: string } | null>(null)
  const amountRef = useRef(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const stop = () => {
    if (timer.current !== null) clearInterval(timer.current)
    timer.current = null
  }
  useEffect(() => stop, [])
  const seed = roundSeed(game.clock.day, id)
  const play = (value: number) => {
    if (!npc) return
    const { state, good } = playRound(useGame.getState().game, id, kind, guests, value)
    if (state === useGame.getState().game) return
    const zone = holdZone(value)
    const want = wantOf(npc, kind)
    const lines = good ? k.good : ROUND_MODE[kind] === 'hold' ? (zone < want ? k.low! : k.high!) : k.miss!
    setSaid({ who: role(npc), text: pick(lines, seed + hashOf(npc)) })
    commitClub(state)
  }
  const press = () => {
    if (timer.current !== null || said) return
    amountRef.current = 0
    setAmount(0)
    timer.current = setInterval(() => {
      amountRef.current = Math.min(100, amountRef.current + 2)
      setAmount(amountRef.current)
    }, 40)
  }
  const release = () => {
    if (timer.current === null) return
    stop()
    play(amountRef.current)
  }
  const line = (who: string | null, text: string, key: string | number) => (
    <p key={key} className={who ? 'scene-line said' : 'scene-line narration'}>
      {who && <span className="talk-role">{who}</span>}
      {callName(text, me)}
    </p>
  )

  // 한 차례를 마친 뒤: 그 이웃의 한마디 → 다음 차례(또는 결과)
  if (said)
    return (
      <section className="group-task club-round" aria-label={k.open}>
        <Preview id={id} />
        {line(said.who, said.text, 'said')}
        <div className="actions">
          <button className="primary" onClick={() => { setSaid(null); setAmount(0); amountRef.current = 0 }}>{t('common.next')}</button>
        </div>
      </section>
    )

  // 다 마쳤다: 결과 창 — 차례마다 맞았는지·마음, 오늘의 한 줄, 남은 이야기 (날·모임마다 다르게)
  if (!npc) {
    const good = [...marks].filter((m) => m === '1').length
    const score = good === guests.length ? R.score.all : good === 0 ? R.score.none : R.score.some
    const talkers = guests.slice(0, Math.min(2, guests.length))
    const pool = [...k.chat, ...R.chat]
    return (
      <section className="group-task club-round round-result" aria-label={R.resultTitle}>
        <h3>{R.resultTitle}</h3>
        <ul className="round-rows">
          {guests.map((g, i) => (
            <li key={g} className={marks[i] === '1' ? 'hit' : 'miss'}>
              <b>{role(g)}</b>
              <span>{k.opts[wantOf(g, kind)]}</span>
              <span>{marks[i] === '1' ? R.good : R.miss}</span>
              {marks[i] === '1' && <small className="round-heart">{R.heart}</small>}
            </li>
          ))}
        </ul>
        {line(null, pick(score, seed), 'score')}
        <h3>{R.talkTitle}</h3>
        {talkers.map((g, i) => line(role(g), pick(pool, seed + i * 7 + hashOf(g)), g))}
        {extra}
        {onFinish && (
          <div className="actions">
            <button className="primary" onClick={onFinish}>{R.finish}</button>
          </div>
        )}
      </section>
    )
  }

  const want = wantOf(npc, kind)
  return (
    <section className="group-task club-round" aria-label={k.open}>
      <h3>{fill(R.turn, { n: marks.length + 1, total: guests.length })}</h3>
      <Preview id={id} />
      {marks.length === 0 && <p className="hint">{k.open}</p>}
      {line(role(npc), pick(k.ask[want], seed + hashOf(npc)), 'ask')}
      {ROUND_MODE[kind] === 'hold' ? (
        <>
          <div className="group-meter tea-meter" role="meter" aria-label={k.help} aria-valuenow={amount} aria-valuemin={0} aria-valuemax={100}>
            {HOLD_BANDS.map(([a, b], i) => (
              <span key={i} className="tea-zone" style={{ left: `${a}%`, width: `${b - a}%` }}>{k.opts[i]}</span>
            ))}
            <span className="group-meter-fill" style={{ width: `${amount}%` }} />
          </div>
          {k.help && <p className="hint">{k.help}</p>}
          <button
            className="primary group-hold"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press() }}
            onPointerUp={release}
            onPointerCancel={stop}
            onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press() } }}
            onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release() } }}
            onBlur={stop}
          >
            {R.hold}
          </button>
        </>
      ) : (
        <div className="round-picks">
          {k.opts.map((o, i) => <button key={o} onClick={() => play(i)}>{o}</button>)}
        </div>
      )}
    </section>
  )
}
