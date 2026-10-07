// 새 터 시설 창 (계획 18 남은 것, 사용자 결정 ⑥): 손님집 · 기억 정원 · 공동 마당 · 주민의 꿈터.
// 문 앞(또는 마당 안)에 서면 열린다. 글은 짧게 — 막힌 까닭은 단추를 누를 때 알림 한 줄로.
import { useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { fill, itemList, itemName, T, withAnd, withObject, withSubject } from '../../content/text'
import { newsLine } from '../../content/gen-text'
import { canGatherYard, gatherYard, type GameState } from '../../engine/game'
import { DREAMER, GUESTS, guestNow, memoriesOf, pickDream, talkGuest, visitDream, type DreamStage, type FacilityKind, type Memory } from '../../engine/newland-life'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'

const L = T.newlandLife
type GuestText = { name: string; from: string; lines: string[]; again: string }
const guestText = (id: string): GuestText => (L.guests as Record<string, GuestText>)[id]

function commit(next: GameState) {
  saveGame(next)
  useGame.setState({ game: next })
}

function memoryText(game: GameState, m: Memory): string {
  const role = (id?: string) => (id ? neighborById(id)?.role ?? '' : '')
  switch (m.kind) {
    case 'wedding':
      return fill(L.memo.wedding, { whoAnd: withAnd(role(m.who)) })
    case 'childBorn':
      return L.memo.childBorn
    case 'feast':
      return L.memo.feast
    case 'yard':
      return fill(L.memo.yard, { n: m.n ?? 0 })
    case 'farewell':
      return fill(L.memo.farewell, { whoSubj: withSubject(role(m.who)) })
    case 'gen':
      return m.log ? newsLine(game, { day: m.day ?? 0, kind: m.log.kind, who: m.log.who }) ?? '' : ''
  }
}

function Guest() {
  const game = useGame((s) => s.game)
  const [said, setSaid] = useState<string | null>(null)
  const guest = guestNow(game)
  if (!guest) return <p className="hint">{L.guestNone}</p>
  const g = guestText(guest)
  const talk = () => {
    const r = talkGuest(game)
    if (!r) return useGame.getState().say(L.guestTalked)
    commit(r.state)
    setSaid(r.line === 'again' ? g.again : g.lines[r.line])
    if (r.gift) useGame.getState().say(fill(L.guestGift, { whoSubj: withSubject(g.name), itemObj: withObject(itemName(r.gift)) }), 3600)
  }
  return (
    <>
      <p className="talk-role">
        {g.name} <span className="talk-job">{g.from}</span>
      </p>
      {said && <p className="talk-line">{said}</p>}
      <div className="actions menu column">
        <button className="primary" onClick={talk}>{L.guestTalk}</button>
      </div>
    </>
  )
}

function Memorial() {
  const game = useGame((s) => s.game)
  const list = memoriesOf(game)
    .map((m) => ({ m, text: memoryText(game, m) }))
    .filter((x) => x.text)
  if (!list.length) return <p className="hint">{L.memorialNone}</p>
  return (
    <ul className="rows memorial-list">
      {list.map(({ m, text }, i) => (
        <li key={i}>
          <div className="row">
            <span className="row-main"><b>{text}</b></span>
            <span className="row-meta">{m.day == null ? L.noDate : fill(L.dayLine, { day: m.day })}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Yard() {
  const game = useGame((s) => s.game)
  const gather = () => {
    const block = canGatherYard(game, CONTENT)
    if (block) return useGame.getState().say(block === 'time' ? L.yardTime : block === 'done' ? L.yardAgain : L.yardNobody)
    const before = game
    const next = gatherYard(game, CONTENT)
    commit(next)
    const names = Object.keys(next.hearts).filter((id) => (next.hearts[id] ?? 0) > (before.hearts[id] ?? 0)).map((id) => neighborById(id)?.role ?? id)
    useGame.getState().say(fill(L.yardDone, { with: withAnd(names.join('·')) }), 3200)
  }
  return (
    <div className="actions menu column">
      <button className="primary" onClick={gather}>{L.yardGather}</button>
    </div>
  )
}

function Workshop() {
  const game = useGame((s) => s.game)
  // 들른 그 순간 한 번 계산한다 (문 연 날·짠 것 챙기기)
  const [stage, setStage] = useState<DreamStage | null>(() => {
    const def = neighborById(DREAMER)
    const r = visitDream(useGame.getState().game, def?.help.gives ?? {})
    if (!r) return null
    commit(r.state)
    if (r.gift) setTimeout(() => useGame.getState().say(fill(L.dream.gift, { whoSubj: withSubject(def?.role ?? ''), items: itemList(r.gift!) }), 3600), 0)
    return r.stage
  })
  if (!stage) return null
  const line = stage === 'open' ? L.dream.open : stage === 'trouble' ? L.dream.trouble : game.flags.dreamPick === 1 ? L.dream.afterSlow : L.dream.afterTwo
  const pick = (n: 1 | 2) => {
    commit(pickDream(useGame.getState().game, n))
    setStage('after')
  }
  return (
    <>
      <p className="talk-line">{line}</p>
      {stage === 'trouble' && (
        <div className="actions menu column">
          <button onClick={() => pick(1)}>{L.dream.pickSlow}</button>
          <button onClick={() => pick(2)}>{L.dream.pickTwo}</button>
        </div>
      )}
    </>
  )
}

export function FacilityView({ id }: { id: FacilityKind }) {
  const { closeModal } = useGame.getState()
  const title =
    id === 'guest' ? L.guestTitle : id === 'memorial' ? L.memorialTitle : id === 'courtyard' ? L.yardTitle : fill(L.dream.title, { who: neighborById(DREAMER)?.role ?? '' })
  return (
    <div className="dialog facility" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      {id === 'guest' && <Guest />}
      {id === 'memorial' && <Memorial />}
      {id === 'courtyard' && <Yard />}
      {id === 'weaver' && <Workshop />}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 손님 이름 목록 (테스트·도감용) */
export const GUEST_NAMES = (): string[] => GUESTS.map((g) => guestText(g.id).name)
