import { dreamText, npcDream } from './dream-text'
export { dreamText } from './dream-text'
// 새 터 시설 창 (계획 18 남은 것, 사용자 결정 ⑥): 손님집 · 기억 정원 · 공동 마당 · 주민의 꿈터.
// 문 앞(또는 마당 안)에 서면 열린다. 글은 짧게 — 막힌 까닭은 단추를 누를 때 알림 한 줄로.
import { weatherOf } from '../../engine/calendar'
import { genPersona, kidPersona, personaLine, residentJob } from '../../engine/persona'
import { useEffect, useRef, useState } from 'react'
import { BlockedButton } from '../../shared/BlockedButton'
import { CONTENT, GOD_KEYWORDS, neighborById } from '../../content/catalog'
import { callName, fill, itemList, itemName, JOB_NAME, T, withAnd, withObject, withSubject } from '../../content/text'
import { newsLine } from '../../content/gen-text'
import { canGatherYard, gatherYard, mendQuarrelWith, yardFriends, type GameState } from '../../engine/game'
import { kidVisiting, talkKidVisit, dreamKey, roomOwner, canInviteGuest, markerShown, toggleMarker, canMendQuarrel, keywordRecall, quarrelPair, visitKidWork, giveKidLunch, kidLunchBlock, DREAMER, GUESTS, guestNow, inviteGuest, memoriesOf, pickDream, settledAt, settledLine, talkGuest, visitDream, kidWorkBuildAt, type DreamStage, type FacilityKind, type GuestId, type Memory } from '../../engine/newland-life'
import { canClaimHome } from '../../engine/newland-myhome'
import { emptyHomeAt, familyAt, giveFamilyHome, homeWishes, wantsToMove } from '../../engine/gen-homes'
import type { Household } from '../../engine/gen'
import { t } from '../../shared/i18n'
import type { Tile } from '../../engine/types'
import { partnerName, useGame } from '../../store/game-store'
import { ownerJob, ownerName, visitNpcDream } from '../../engine/kid-work'
import { seenStories, storyBook, useSceneSay } from '../scene/SceneReplay'
import { SCENES } from '../../content/text'
import { PixelArt } from '../library/LibraryWork'
import { WORKPLACE_INTERIORS, WORKPLACE_PALETTE } from '../../render/workplace-interior-art'

const L = T.newlandLife
type GuestText = { name: string; from: string; lines: string[]; again: string; home: string[] }
const guestText = (id: string): GuestText => (L.guests as Record<string, GuestText>)[id]

function commit(next: GameState) {
  // 저장은 스토어의 같은 길로 (2026-10-19 감사 L-13)
  useGame.getState().commitGame(next)
}

function memoryText(game: GameState, m: Memory): string {
  const role = (id?: string) => (id ? neighborById(id)?.role ?? '' : '')
  switch (m.kind) {
    case 'wedding':
      // 지금 배우자 자리면 이어받은 사람 이름으로 (2026-10-18 감사 L-48)
      return fill(L.memo.wedding, { whoAnd: withAnd(m.who && m.who === game.romance?.partner ? partnerName(game) : role(m.who)) })
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

/** 떠난 아이가 다니러 와 묵는 사흘 (2026-10-12 사용자 결정 2) */
const KID_VISIT_LINES = [
  '집 생각이 나서 왔어요. 사흘만 묵다 갈게요.',
  '먼 길에서 본 것들을 이야기해 드릴게요. 여기 오니 마음이 놓여요.',
  '내일 아침엔 다시 떠나요. 오는 길에 챙긴 짐이에요.',
]
function KidVisit() {
  const game = useGame((s) => s.game)
  const [said, setSaid] = useState<string | null>(null)
  const name = game.child?.name ?? ''
  const talk = () => {
    const r = talkKidVisit(useGame.getState().game)
    if (!r) return useGame.getState().say(L.guestTalked)
    commit(r.state)
    setSaid(KID_VISIT_LINES[r.line])
    if (r.gift) useGame.getState().say(`${withSubject(name)} 가족 나들이 짐을 풀었어요 · ${itemList(r.gift)}`, 3600)
  }
  return (
    <>
      <p className="talk-role">{name} <span className="talk-job">다니러 왔어요</span></p>
      {said && <p className="talk-line">{said}</p>}
      <div className="actions menu column">
        {/* 하루 한 번 — 이야기한 뒤에도 단추가 그대로라 또 누르게 됐다 (2026-10-27 플레이 점검) */}
        <BlockedButton className="primary" why={game.flags.kidVisitTalkDay === game.clock.day ? L.guestTalked : null} onClick={talk}>{L.guestTalk}</BlockedButton>
      </div>
    </>
  )
}

function Guest() {
  const game = useGame((s) => s.game)
  const [said, setSaid] = useState<string | null>(null)
  const guest = guestNow(game)
  if (kidVisiting(game)) return <KidVisit />
  if (!guest) return <p className="hint">{L.guestNone}</p>
  const g = guestText(guest)
  const talk = () => {
    const r = talkGuest(game)
    if (!r) return useGame.getState().say(L.guestTalked)
    commit(r.state)
    setSaid(r.line === 'again' ? g.again : g.lines[r.line])
    if (r.gift) useGame.getState().say(fill(L.guestGift, { whoSubj: withSubject(g.name), itemObj: withObject(itemName(r.gift)) }), 5200)
  }
  return (
    <>
      <p className="talk-role">
        {g.name} <span className="talk-job">{g.from}</span>
      </p>
      {said && <p className="talk-line">{said}</p>}
      <div className="actions menu column">
        {/* 하루 한 번 — 이야기한 뒤에도 단추가 그대로라 또 누르게 됐다 (2026-10-27 플레이 점검) */}
        <BlockedButton className="primary" why={game.flags.guestTalkDay === game.clock.day ? L.guestTalked : null} onClick={talk}>{L.guestTalk}</BlockedButton>
        {/* 다시 온 손님에게 빈집을 내어 준다 (2026-10-08 입주) — 조건이 맞을 때만 보인다 */}
        {canInviteGuest(game) && (
          <button
            onClick={() => {
              const before = useGame.getState().game
              const next = inviteGuest(before)
              commit(next)
              const gift = !before.flags[`moveGift:${guest}`] ? next.moveInGifts?.[guest] : undefined
              const received = gift ? ` ${t('moveGifts.received', { who: g.name, item: itemName(gift) })}` : ''
              useGame.getState().say(fill(L.guestInvited, { whoSubj: withSubject(g.name) }) + received, 5000)
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
function KidWork({ owner }: { owner?: string }) {
  const game = useGame((s) => s.game)
  const name = game.child?.name ?? ''
  const [line, setLine] = useState('')
  // 들른 그 순간 한 번 — 저장은 그린 뒤에 (2026-10-19 감사 L-44: 그리는 도중에 저장하지 않는다)
  const visited = useRef(false)
  useEffect(() => {
    if (visited.current) return
    visited.current = true
    const g = useGame.getState().game
    const daily = L.kidWork.lines[g.clock.day % L.kidWork.lines.length]
    // 다른 아이·이웃 자녀의 일터는 구경만 — 들르기(접시·횟수)는 함께하는 아이 자기 일터에서만 (2026-10-18 감사, Codex E-02)
    const mine = !owner || owner === (g.child ? `me:${g.child.born}` : '')
    if (!mine) {
      // 남의 일터는 그 사람 말로 (2026-10-21): 이웃의 꿈터는 꿈터 말, 주민 자녀는 성격대로, 다른 우리 아이도 성격대로
      const j = ownerJob(g, owner)
      const ctx = { day: g.clock.day, minute: g.clock.minute, weather: weatherOf(g.clock.day), player: g.avatar?.name?.trim() || '필사가', parent: g.avatar?.look === 'm' ? '아빠' : '엄마', job: j ? JOB_NAME[j] : undefined, salt: owner ?? '' }
      // 이웃의 꿈터: 그 이웃만의 말 (처음 들른 날은 문 연 날의 말), 이레마다 그 이웃이 늘 건네던 것 하나 (2026-10-21 점검)
      if (owner?.startsWith('npc:')) {
        const npc = owner.slice(4)
        const r = visitNpcDream(g, npc)
        if (r.state !== g) commit(r.state)
        const mine = npcDream(npc)
        if (r.gift) useGame.getState().say(fill(L.kidWork.dreamGift, { whoSubj: withSubject(neighborById(npc)?.role ?? ''), itemsObj: withObject(itemList(r.gift)) }), 3600)
        const pool = mine?.lines ?? L.kidWork.dreamLines
        return setLine(callName(r.first && mine ? mine.open : pool[(g.clock.day + [...owner].reduce((n, ch) => n + ch.charCodeAt(0), 0)) % pool.length], g.avatar?.name))
      }
      const kid = owner?.startsWith('me:') ? [...(g.siblings ?? [])].find((k) => `me:${k.born}` === owner) : undefined
      if (kid) return setLine(personaLine(kidPersona(kid, g.clock.day), 'grown', ctx))
      const resident = owner ? genPersona(g.gen, owner) : null
      return setLine(resident ? personaLine(resident, 'villager', ctx) : daily)
    }
    const r = visitKidWork(g)
    if (!r) return setLine(L.kidWork.again)
    commit(r.state)
    // 접시는 이정표 날에도 알린다 (2026-10-19 감사 L-46)
    if (r.dish) useGame.getState().say(fill(L.kidWork.dish, { whoSubj: withSubject(name), item: itemName(r.dish) }), 3600)
    // 일터 후속 (2026-10-08): 세 번째·열 번째 들른 날은 그날의 특별한 말
    setLine(r.milestone ? (r.milestone === 3 ? L.kidWork.mile3 : L.kidWork.mile10) : daily)
  }, [owner, name])
  // 그 일의 방 안 (assets 일터 실내 도트, 2026-10-22 연결) — 일이 정해지지 않았으면 그림 없이 말만
  const job = ownerJob(game, owner)
  const room = job ? WORKPLACE_INTERIORS[job] : null
  const mine = !owner || owner === (game.child ? `me:${game.child.born}` : '')
  const lunchWhy = kidLunchBlock(game)
  return <>
    {room && <figure className="workplace-room" aria-label={room.label}><PixelArt rows={room.rows} palette={WORKPLACE_PALETTE} /><figcaption>{room.label}</figcaption></figure>}
    <p className="talk-line">{line}</p>
    {mine && (
      <div className="actions menu column">
        <BlockedButton why={lunchWhy ? t(`kidLunch.${lunchWhy}`) : null} onClick={() => {
          const next = giveKidLunch(useGame.getState().game)
          if (!next) return
          commit(next)
          setLine(t('kidLunch.thanks'))
        }}>{t('kidLunch.give')}</BlockedButton>
      </div>
    )}
  </>
}

/** 가구 사람들의 이름 (생성 인물은 이름, 이웃은 역할 이름) */
export function familyNames(game: GameState, h: Household): string {
  return h.members.map((id) => game.gen?.persons[id]?.name ?? neighborById(id)?.role ?? '').filter(Boolean).join('·')
}

/** 빈 입주 주택 앞: 집이 없는 신혼 가구 목록 — 고르면 이 집에 산다 (주택 희망 목록, 2026-10-08) */
function EmptyHome({ at }: { at?: Tile }) {
  const game = useGame((s) => s.game)
  const here = at ?? { x: Math.round(game.player.x), y: Math.round(game.player.y) }
  const home = emptyHomeAt(game, here)
  const wishes = homeWishes(game, roomOwner)
  // 빈 집 앞에서도 내 집으로 쓸 수 있게 — 터 가꾸기 '지은 것' 칸 안에만 있어 찾기 어려웠다 (2026-10-27 플레이 점검)
  const mine = home && canClaimHome(game, home) === null ? (
    <div className="actions column">
      <button onClick={() => { useGame.getState().claimNewHome(home.id); useGame.getState().closeModal() }}>{t('familyHome.claim')}</button>
      <p className="hint">{t('familyHome.claimNote')}</p>
    </div>
  ) : null
  if (!home || !wishes.length) return <>{mine}<p className="hint">{t('familyHome.none')}</p></>
  return (
    <>
      {mine}
      <p className="hint">{t('familyHome.lead')}</p>
      <ul className="rows">
        {wishes.map((h) => (
          <li key={h.id}>
            <button
              className="row"
              onClick={() => {
                const before = useGame.getState().game
                const next = giveFamilyHome(before, h.id, home, roomOwner)
                if (next === before) { useGame.getState().closeModal(); return }
                commit(next)
                const received = h.members.flatMap(id => {
                  const gift = !before.flags[`moveGift:${id}`] ? next.moveInGifts?.[id] : undefined
                  return gift ? [t('moveGifts.received', { who: next.gen?.persons[id]?.name ?? neighborById(id)?.role ?? '', item: itemName(gift) })] : []
                }).join(' · ')
                useGame.getState().say([t('familyHome.moved', { names: familyNames(game, h) }), received].filter(Boolean).join(' '), 6000)
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
function Family({ at }: { at?: Tile }) {
  const game = useGame((s) => s.game)
  const f = familyAt(game, at ?? { x: Math.round(game.player.x), y: Math.round(game.player.y) })
  if (!f) return null
  // 이사를 바라는 가족 (2026-10-14): 말리거나 인사하거나
  if (wantsToMove(game, f.household)) {
    const bye = !!game.flags[`moveBye:${Number(f.household.id.slice(2))}`]
    return (
      <>
        <p className="talk-line">{bye ? t('familyHome.moveByeDone') : t('familyHome.moveWish')}</p>
        {!bye && (
          <div className="actions menu column">
            <button onClick={() => { useGame.getState().familyMove('stay', f.household.id); }}>{t('familyHome.moveStay')}</button>
            <button onClick={() => { useGame.getState().familyMove('bye', f.household.id); }}>{t('familyHome.moveBye')}</button>
          </div>
        )}
      </>
    )
  }
  // 마을에서 태어난 가족이면 그 사람 성격대로, 아니면 가구마다 어긋나게 (여덟 집이 같은 날 같은 말을 했다 — 2026-10-21 점검)
  const born = f.household.members.find((id) => game.gen?.persons[id]?.origin === 'born')
  const persona = born ? genPersona(game.gen, born) : null
  if (persona && born) {
    const j = residentJob(game.gen, born)
    return <p className="talk-line">{personaLine(persona, 'villager', { day: game.clock.day, minute: game.clock.minute, weather: weatherOf(game.clock.day), player: game.avatar?.name?.trim() || '필사가', job: j ? JOB_NAME[j] : undefined, salt: born })}</p>
  }
  const lines = [t('familyHome.line1'), t('familyHome.line2'), t('familyHome.line3')]
  const no = Number(/^h-(\d+)$/.exec(f.household.id)?.[1] ?? 0)
  return <p className="talk-line">{lines[(game.clock.day + no) % lines.length]}</p>
}

/** 기억 정원 › 장면 도감 (2026-10-14 사용자: 본 도트 장면을 앨범 말고 여기서, 못 본 것은 흐리게) */
function MemorialScenes() {
  const game = useGame((s) => s.game)
  const say = useSceneSay()
  const seen = new Map(seenStories(game).map((x) => [x.id, x.day]))
  const all = storyBook()
  return (
    <>
      <h3>장면 도감 <small className="row-meta">{seen.size}/{all.length}</small></h3>
      <ul className="rows memorial-scenes">
        {all.map((id) => {
          const day = seen.get(id)
          return (
            <li key={id}>
              {day !== undefined ? (
                <button className="row" onClick={() => useGame.getState().open({ kind: 'sceneReplay', id, back: useGame.getState().modal ?? undefined })}>
                  <span className="row-main"><b>{say(SCENES[id]?.title ?? '')}</b></span>
                  <span className="row-meta">{fill(L.dayLine, { day })}</span>
                </button>
              ) : (
                <div className="row scene-unseen" aria-label="아직 못 본 장면">
                  <span className="row-main"><b>???</b></span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Memorial() {
  const game = useGame((s) => s.game)
  const list = memoriesOf(game)
    .map((m) => ({ m, text: memoryText(game, m) }))
    .filter((x) => x.text)
  if (!list.length) return <><MemorialScenes /><p className="hint">{L.memorialNone}</p></>
  return (
    <>
    <MemorialScenes />
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
    </>
  )
}

function Yard() {
  const game = useGame((s) => s.game)
  const gather = () => {
    const block = canGatherYard(game, CONTENT)
    if (block) return useGame.getState().say(block === 'time' ? L.yardTime : block === 'done' ? L.yardAgain : L.yardNobody)
    const next = gatherYard(game, CONTENT)
    commit(next)
    // 이름은 함께한 이웃 모두에서 — 마음이 가득해 오르지 않은 이웃도 (2026-10-19 감사 L-47)
    const names = yardFriends(game, CONTENT).map((id) => neighborById(id)?.role ?? id)
    useGame.getState().say(fill(L.yardDone, { with: withAnd(names.join('·')) }), 3200)
  }
  // 신약 키워드 계승 (B18-6): 다툰 이웃에게 함께 쓰는 자리 — '사랑'을 만났으면 그 구절이 곁에 보인다(못 만나도 고를 수 있다)
  const pair = quarrelPair(CONTENT.neighbors)
  const names = pair ? { aAnd: withAnd(neighborById(pair[0])?.role ?? ''), b: neighborById(pair[1])?.role ?? '' } : null
  const love = keywordRecall(game.godRecords ?? []).find((k) => k.keyword === 'love')
  const mend = () => {
    if (!pair || !names) return
    commit(mendQuarrelWith(useGame.getState().game, pair))
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

function Workshop({ npc = DREAMER }: { npc?: string }) {
  const game = useGame((s) => s.game)
  const D = dreamText(npc)
  // 들른 그 순간 한 번 계산한다 (문 연 날·짠 것 챙기기) — 저장은 그린 뒤에 (2026-10-19 감사 L-44)
  const [stage, setStage] = useState<DreamStage | null>(null)
  const visited = useRef(false)
  useEffect(() => {
    if (visited.current) return
    visited.current = true
    const def = neighborById(npc)
    const r = visitDream(useGame.getState().game, def?.help.gives ?? {}, npc)
    if (!r) return
    commit(r.state)
    if (r.gift) useGame.getState().say(fill(D.gift, { whoSubj: withSubject(def?.role ?? ''), items: itemList(r.gift) }), 3600)
    setStage(r.stage)
  }, [npc, D])
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

export function FacilityView({ id, at }: { id: FacilityKind; at?: Tile }) {
  const { closeModal } = useGame.getState()
  const game = useGame((s) => s.game)
  const here = at ?? { x: Math.round(game.player.x), y: Math.round(game.player.y) }
  const who = id === 'settled' ? settledAt(game, here) : null
  const kidBuild = id === 'kidWork' ? kidWorkBuildAt(game, here) : null
  const title =
    who ? fill(L.settledTitle, { who: guestText(who).name }) : id === 'family' ? t('familyHome.title', { names: familyHereNames(game, here) }) : id === 'emptyHome' ? t('familyHome.emptyTitle') : id === 'kidWork' ? fill(kidBuild?.owner?.startsWith('npc:') ? L.kidWork.dreamLabel : L.kidWork.title, { name: ownerName(game, kidBuild?.owner) }) : id === 'guest' ? L.guestTitle : id === 'memorial' ? L.memorialTitle : id === 'courtyard' ? L.yardTitle : id === 'gallery' ? fill(dreamText('tilly').title, { who: neighborById('tilly')?.role ?? '' }) : fill(L.dream.title, { who: neighborById(DREAMER)?.role ?? '' })
  return (
    <div className="dialog facility" role="dialog" aria-label={title}>
      <h2>{title}</h2>
      {id === 'guest' && <Guest />}
      {id === 'memorial' && <Memorial />}
      {id === 'courtyard' && <Yard />}
      {id === 'weaver' && <Workshop />}
      {id === 'gallery' && <Workshop npc="tilly" />}
      {who && <Settled id={who} />}
      {id === 'kidWork' && <KidWork owner={kidBuild?.owner} />}
      {id === 'emptyHome' && <EmptyHome at={here} />}
      {id === 'family' && <Family at={here} />}
      <div className="actions">
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 지금 선 자리 가족의 이름 */
function familyHereNames(game: GameState, here: Tile): string {
  const f = familyAt(game, here)
  return f ? familyNames(game, f.household) : ''
}

/** 손님 이름 목록 (테스트·도감용) */
export const GUEST_NAMES = (): string[] => GUESTS.map((g) => guestText(g.id).name)
