// 새 터 시설 창 (계획 18 남은 것, 사용자 결정 ⑥): 손님집 · 기억 정원 · 공동 마당 · 주민의 꿈터.
// 문 앞(또는 마당 안)에 서면 열린다. 글은 짧게 — 막힌 까닭은 단추를 누를 때 알림 한 줄로.
import { useState } from 'react'
import { CONTENT, GOD_KEYWORDS, neighborById } from '../../content/catalog'
import { fill, itemList, itemName, T, withAnd, withObject, withSubject } from '../../content/text'
import { newsLine } from '../../content/gen-text'
import { canGatherYard, gatherYard, type GameState } from '../../engine/game'
import { dreamKey, roomOwner, canInviteGuest, markerShown, toggleMarker, canMendQuarrel, keywordRecall, mendQuarrel, quarrelPair, visitKidWork, DREAMER, GUESTS, guestNow, inviteGuest, memoriesOf, pickDream, settledAt, settledLine, talkGuest, visitDream, type DreamStage, type FacilityKind, type GuestId, type Memory } from '../../engine/newland-life'
import { saveGame } from '../../engine/save'
import { emptyHomeAt, familyAt, giveFamilyHome, homeWishes } from '../../engine/gen-homes'
import type { Household } from '../../engine/gen'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'

const L = T.newlandLife
type GuestText = { name: string; from: string; lines: string[]; again: string; home: string[] }
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
    case 'reconcile': {
      const pair = quarrelPair(CONTENT.neighbors)
      return pair ? fill(L.memo.reconcile, { aAnd: withAnd(role(pair[0])), b: role(pair[1]) }) : ''
    }
    case 'kidWork':
      return fill(m.n === 3 ? L.memo.kidWork3 : L.memo.kidWork10, { name: game.child?.name ?? '' })
    case 'settle':
      return fill(L.memo.settle, { whoSubj: withSubject(m.who ? guestText(m.who).name : '') })
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
        {/* 다시 온 손님에게 빈집을 내어 준다 (2026-10-08 입주) — 조건이 맞을 때만 보인다 */}
        {canInviteGuest(game) && (
          <button
            onClick={() => {
              commit(inviteGuest(useGame.getState().game))
              useGame.getState().say(fill(L.guestInvited, { whoSubj: withSubject(g.name) }), 3200)
              useGame.getState().closeModal()
            }}
          >
            {L.guestInvite}
          </button>
        )}
      </div>
    </>
  )
}

/** 이웃이 된 손님의 집 앞: 날마다 다른 한 줄 */
function Settled({ id }: { id: GuestId }) {
  const game = useGame((s) => s.game)
  const g = guestText(id)
  return (
    <>
      <p className="talk-role">
        {g.name} <span className="talk-job">{g.from}</span>
      </p>
      <p className="talk-line">{g.home[settledLine(game, id, g.home.length)]}</p>
    </>
  )
}

/** 자란 아이의 일터 (B18-7): 들른 그 순간 하루 한 번 — 요리사면 한 접시를 싸 준다 */
function KidWork() {
  const game = useGame((s) => s.game)
  const name = game.child?.name ?? ''
  const [line] = useState<string>(() => {
    const r = visitKidWork(useGame.getState().game)
    if (!r) return L.kidWork.again
    commit(r.state)
    // 일터 후속 (2026-10-08): 세 번째·열 번째 들른 날은 그날의 특별한 말
    if (r.milestone) return r.milestone === 3 ? L.kidWork.mile3 : L.kidWork.mile10
    if (r.dish) setTimeout(() => useGame.getState().say(fill(L.kidWork.dish, { whoSubj: withSubject(name), item: itemName(r.dish!) }), 3600), 0)
    return L.kidWork.lines[game.clock.day % L.kidWork.lines.length]
  })
  return <p className="talk-line">{line}</p>
}

/** 가구 사람들의 이름 (생성 인물은 이름, 이웃은 역할 이름) */
function familyNames(game: GameState, h: Household): string {
  return h.members.map((id) => game.gen?.persons[id]?.name ?? neighborById(id)?.role ?? '').filter(Boolean).join('·')
}

/** 빈 입주 주택 앞: 집이 없는 신혼 가구 목록 — 고르면 이 집에 산다 (주택 희망 목록, 2026-10-08) */
function EmptyHome() {
  const game = useGame((s) => s.game)
  const here = { x: Math.round(game.player.x), y: Math.round(game.player.y) }
  const home = emptyHomeAt(game, here)
  const wishes = homeWishes(game, roomOwner)
  if (!home || !wishes.length) return <p className="hint">{t('familyHome.none')}</p>
  return (
    <>
      <p className="hint">{t('familyHome.lead')}</p>
      <ul className="rows">
        {wishes.map((h) => (
          <li key={h.id}>
            <button
              className="row"
              onClick={() => {
                commit(giveFamilyHome(useGame.getState().game, h.id, home, roomOwner))
                useGame.getState().say(t('familyHome.moved', { names: familyNames(game, h) }), 3200)
                useGame.getState().closeModal()
              }}
            >
              <span className="row-main"><b>{familyNames(game, h)}</b></span>
              <span className="row-meta">{t('familyHome.give')}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

/** 새 터로 옮긴 주민 가족의 집 앞: 날마다 다른 한 줄 */
function Family() {
  const game = useGame((s) => s.game)
  const f = familyAt(game, { x: Math.round(game.player.x), y: Math.round(game.player.y) })
  if (!f) return null
  const lines = [t('familyHome.line1'), t('familyHome.line2'), t('familyHome.line3')]
  return <p className="talk-line">{lines[game.clock.day % lines.length]}</p>
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
            <button onClick={() => commit(toggleMarker(useGame.getState().game, m))}>{markerShown(game, m) ? L.markerHide : L.markerShow}</button>
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
  // 신약 키워드 계승 (B18-6): 다툰 이웃에게 함께 쓰는 자리 — '사랑'을 만났으면 그 구절이 곁에 보인다(못 만나도 고를 수 있다)
  const pair = quarrelPair(CONTENT.neighbors)
  const names = pair ? { aAnd: withAnd(neighborById(pair[0])?.role ?? ''), b: neighborById(pair[1])?.role ?? '' } : null
  const love = keywordRecall(game.godRecords ?? []).find((k) => k.keyword === 'love')
  const mend = () => {
    if (!pair || !names) return
    commit(mendQuarrel(useGame.getState().game, pair))
    useGame.getState().say(fill(L.quarrel.done, names), 3600)
  }
  const [recall, setRecall] = useState(false)
  const kept = keywordRecall(game.godRecords ?? [])
  return (
    <>
      {names && canMendQuarrel(game) && (
        <>
          <p className="talk-line">{fill(L.quarrel.line, names)}</p>
          {love && <p className="hint">{fill(L.quarrel.word, { name: GOD_KEYWORDS.love?.name ?? '', ref: love.first.ref })}</p>}
        </>
      )}
      {names && game.flags.loveCase && <p className="talk-line">{fill(L.quarrel.after, names)}</p>}
      <div className="actions menu column">
        <button className="primary" onClick={gather}>{L.yardGather}</button>
        {names && canMendQuarrel(game) && <button onClick={mend}>{L.quarrel.pick}</button>}
        <button aria-expanded={recall} onClick={() => setRecall((v) => !v)}>{L.recall.open}</button>
      </div>
      {recall &&
        (kept.length ? (
          <ul className="rows recall-list">
            {kept.map((k) => (
              <li key={k.keyword}>
                <div className="row">
                  <span className="row-main"><b>{GOD_KEYWORDS[k.keyword]?.name ?? k.keyword}</b></span>
                  <span className="row-meta">{fill(L.recall.line, { n: k.n, ref: k.first.ref })}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">{L.recall.none}</p>
        ))}
    </>
  )
}

/** 꿈마다의 문구 (페넬로피는 예전 L.dream, 틸리부터 L.dreams.<npc>) */
type DreamText = typeof L.dream
export const dreamText = (npc: string): DreamText => (npc === DREAMER ? L.dream : ((L.dreams as Record<string, Partial<DreamText>>)[npc] as DreamText) ?? L.dream)

function Workshop({ npc = DREAMER }: { npc?: string }) {
  const game = useGame((s) => s.game)
  const D = dreamText(npc)
  // 들른 그 순간 한 번 계산한다 (문 연 날·짠 것 챙기기)
  const [stage, setStage] = useState<DreamStage | null>(() => {
    const def = neighborById(npc)
    const r = visitDream(useGame.getState().game, def?.help.gives ?? {}, npc)
    if (!r) return null
    commit(r.state)
    if (r.gift) setTimeout(() => useGame.getState().say(fill(D.gift, { whoSubj: withSubject(def?.role ?? ''), items: itemList(r.gift!) }), 3600), 0)
    return r.stage
  })
  if (!stage) return null
  const line = stage === 'open' ? D.open : stage === 'trouble' ? D.trouble : game.flags[dreamKey('dreamPick', npc)] === 1 ? D.afterSlow : D.afterTwo
  const pick = (n: 1 | 2) => {
    commit(pickDream(useGame.getState().game, n, npc))
    setStage('after')
  }
  return (
    <>
      <p className="talk-line">{line}</p>
      {stage === 'trouble' && (
        <div className="actions menu column">
          <button onClick={() => pick(1)}>{D.pickSlow}</button>
          <button onClick={() => pick(2)}>{D.pickTwo}</button>
        </div>
      )}
    </>
  )
}

export function FacilityView({ id }: { id: FacilityKind }) {
  const { closeModal } = useGame.getState()
  const game = useGame((s) => s.game)
  const who = id === 'settled' ? settledAt(game, { x: Math.round(game.player.x), y: Math.round(game.player.y) }) : null
  const title =
    who ? fill(L.settledTitle, { who: guestText(who).name }) : id === 'family' ? t('familyHome.title', { names: familyHereNames(game) }) : id === 'emptyHome' ? t('familyHome.emptyTitle') : id === 'kidWork' ? fill(L.kidWork.title, { name: game.child?.name ?? '' }) : id === 'guest' ? L.guestTitle : id === 'memorial' ? L.memorialTitle : id === 'courtyard' ? L.yardTitle : id === 'gallery' ? fill(dreamText('tilly').title, { who: neighborById('tilly')?.role ?? '' }) : fill(L.dream.title, { who: neighborById(DREAMER)?.role ?? '' })
  return (
    <div className="dialog facility" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      {id === 'guest' && <Guest />}
      {id === 'memorial' && <Memorial />}
      {id === 'courtyard' && <Yard />}
      {id === 'weaver' && <Workshop />}
      {id === 'gallery' && <Workshop npc="tilly" />}
      {who && <Settled id={who} />}
      {id === 'kidWork' && <KidWork />}
      {id === 'emptyHome' && <EmptyHome />}
      {id === 'family' && <Family />}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 지금 선 자리 가족의 이름 */
function familyHereNames(game: GameState): string {
  const f = familyAt(game, { x: Math.round(game.player.x), y: Math.round(game.player.y) })
  return f ? familyNames(game, f.household) : ''
}

/** 손님 이름 목록 (테스트·도감용) */
export const GUEST_NAMES = (): string[] => GUESTS.map((g) => guestText(g.id).name)
