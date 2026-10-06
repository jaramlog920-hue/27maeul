// 일지 — 게임 속에서 일어난 사실만 적는다. 하루 기록 · 이웃 수첩(만난 이웃, 알게 된 것, 받은 선물) · 앨범 · 업적.
// 2026-10-04: 따로 있던 선반의 풍경 앨범·받은 선물·업적을 이리로 옮겼다 (가족 창의 [가족 앨범]도 이 앨범 칸을 연다)
import { useEffect, useRef, useState } from 'react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { fill, ITEM_TEXT, itemName, JOB_NAME, JOURNAL_NOTES, kidFill, SCENES, spouseFill, T } from '../../content/text'
import { ACHIEVEMENTS } from '../../engine/achievements'
import { weatherOf } from '../../engine/calendar'
import { seasonOf } from '../../engine/clock'
import { dislikesOf, isSuitor, newsRecent, notYet, type GameState, type JournalEntry } from '../../engine/game'
import { heartsOf } from '../../engine/hearts'
import { birthdayLabel, isBirthday, knownTastes, knownLifestyleTastes, noteTasteProposal, canProposeTea, sharedMemories, NO_NOTEBOOK, SLOT_LABEL, SLOTS, spotName } from '../../engine/notebook'
import { availability, scheduleAppt } from '../../engine/plans'
import { saveGame } from '../../engine/save'
import { NO_LIFE } from '../../engine/people'
import type { ItemId, NeighborDef, Season } from '../../engine/types'
import { neighborPortrait } from '../../render/renderer'
import { ItemIcon } from '../../shared/ItemIcon'
import { albumImage, partnerName, useGame, type JournalTab } from '../../store/game-store'
import { isFamilyAlbum } from '../../engine/family'
import { bondLabel, Hearts } from '../talk/TalkBox'

export function journalLine(e: JournalEntry): string {
  const weather = fill(T.journal.weather, { weather: (T.ui.weather as Record<string, string>)[weatherOf(e.day)] })
  const heard = e.heard.length ? fill(T.journal.heard, { refs: e.heard.map((id) => pieceById(id).ref).join(', ') }) : ''
  const notes = (e.notes ?? []).map((n) => JOURNAL_NOTES[n] ?? '').join('')
  const body = heard + notes || T.journal.quiet
  return fill(T.journal.day, { day: e.day }) + weather + body
}

type Tab = JournalTab

export function Journal({ tab: first = 'days' }: { tab?: Tab }) {
  const closeModal = useGame((s) => s.closeModal)
  const [tab, setTab] = useState<Tab>(first)
  return (
    <div className="dialog journal" role="dialog" aria-label={T.ui.journalTitle}>
      <h2>{T.ui.journalTitle}</h2>
      <div className="tabs" role="tablist">
        {(
          [
            ['days', '하루 기록'],
            ['neighbors', '이웃 수첩'],
            ['album', '앨범'],
            ['awards', '업적'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'days' && <Days />}
      {tab === 'neighbors' && <NeighborBook />}
      {tab === 'album' && <Album />}
      {tab === 'awards' && <Awards />}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

function Days() {
  const journal = useGame((s) => s.game.journal)
  const kid = useGame((s) => s.game.child)
  if (journal.length === 0) return <p>{T.ui.journalEmpty}</p>
  return (
    <>
    {kid?.job && (
      <p className="hint">
        {kid.name} · {JOB_NAME[kid.job]} · {kid.left ? '마을을 떠나 산다' : '마을에 남아 산다'}
      </p>
    )}
    <ul className="journal-list">
      {[...journal].reverse().map((e) => (
        <li key={e.day}>{journalLine(e)}</li>
      ))}
    </ul>
    </>
  )
}

/** 지금 마을에 사는 이웃 (이사 오지 않은 이웃은 수첩에 없다) */
export function villageNeighbors(game: Pick<GameState, 'flags'>): NeighborDef[] {
  const level = game.flags.villageLevel ?? 0
  return CONTENT.neighbors.filter((d) => !notYet(d, level, game.flags))
}

/** 이웃이 하는 일: 후보는 집안 이웃의 일로 */
export function jobOf(def: NeighborDef): string {
  if (def.family) {
    const fam = neighborById(def.family)
    return fam ? `${fam.role}네` : ''
  }
  return ''
}

/** 성별: 연애 후보는 look, 원래 이웃은 gender */
function genderOf(d: NeighborDef): 'f' | 'm' {
  return d.gender ?? d.look ?? 'f'
}

function NeighborBook() {
  const game = useGame((s) => s.game)
  const [open, setOpen] = useState<string | null>(null)
  const notebook = game.notebook ?? NO_NOTEBOOK
  const all = villageNeighbors(game)
  const met = all.filter((d) => notebook.met.includes(d.id))
  const unmet = all.filter((d) => !notebook.met.includes(d.id))
  return (
    <div className="neighbor-book">
      <p className="hint">
        만난 이웃 {met.length} / {all.length} · 선물하거나 사이가 깊어지면 ? 칸이 열려요
      </p>
      <ul className="nb-list">
        {met.map((d) => (
          <li key={d.id} className={`nb-card${open === d.id ? ' open' : ''}`}>
            <button className="nb-head" aria-expanded={open === d.id} onClick={() => setOpen(open === d.id ? null : d.id)}>
              <Portrait def={d} season={seasonOf(game.clock.day)} />
              <span className="nb-name">
                <strong>{d.role}</strong>
                <span className="nb-tags">
                  <span className="nb-tag">{genderOf(d) === 'm' ? '남' : '여'}</span>
                  {isSuitor(game, d) && <span className="nb-tag love">연애 가능</span>}
                </span>
                {jobOf(d) && <span className="nb-job">{jobOf(d)}</span>}
                {isBirthday(d.id, game.clock.day) && <span className="nb-today">오늘 생일</span>}
              </span>
              <span className="nb-bond">{bondLabel(game, d.id)}</span>
            </button>
            {open === d.id && <NeighborPage game={game} def={d} />}
          </li>
        ))}
        {unmet.map((d) => (
          <li key={d.id} className="nb-card unmet">
            <div className="nb-head">
              <Portrait def={d} season={seasonOf(game.clock.day)} shadow />
              <span className="nb-name">
                <strong>???</strong>
                <span className="nb-job">아직 말을 나눠 보지 않은 이웃</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <OtherGifts game={game} />
    </div>
  )
}

/**
 * 받은 선물 가운데 누구에게 받았는지 수첩에 적히지 않은 것 (옛 저장·아이·수첩에 없는 이웃) — 이웃 수첩 맨 아래에 짧게.
 * 누구에게 받았는지 아는 선물은 그 이웃의 쪽(받은 선물)에 있다
 */
export function otherGifts(game: Pick<GameState, 'giftsGot' | 'notebook' | 'flags'>): ItemId[] {
  const got = game.notebook?.got ?? {}
  const shown = new Set(villageNeighbors(game).filter((d) => game.notebook?.met.includes(d.id)).flatMap((d) => got[d.id] ?? []))
  return game.giftsGot.filter((id) => !shown.has(id))
}

function OtherGifts({ game }: { game: GameState }) {
  const rest = otherGifts(game)
  if (!rest.length) return null
  return (
    <section className="nb-gifts" aria-label={T.ui.gifts}>
      <h3>{T.ui.gifts}</h3>
      <ul className="bag-list">
        {rest.map((id) => (
          <li key={id}>
            <ItemIcon id={id} />
            <span className="bag-name">{ITEM_TEXT[id].name}</span>
            <span className="bag-desc">{ITEM_TEXT[id].desc}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Taste({ items }: { items: (ItemId | null)[] }) {
  if (!items.length) return <span className="nb-none">없음</span>
  return (
    <span className="nb-tastes">
      {items.map((it, i) => (
        <span key={i} className={it ? 'nb-taste' : 'nb-taste unknown'}>
          {it ? itemName(it) : '?'}
        </span>
      ))}
    </span>
  )
}

function NeighborPage({ game, def }: { game: GameState; def: NeighborDef }) {
  const notebook = game.notebook ?? NO_NOTEBOOK
  const tastes = knownTastes(notebook, def, dislikesOf(def), game.hearts[def.id] ?? 0)
  const seen = notebook.seen[def.id] ?? {}
  const heard = notebook.heard[def.id] ?? []
  const promises = (game.life ?? NO_LIFE).promises.filter((p) => p.npc === def.id)
  const birthday = birthdayLabel(def.id)
  const got = notebook.got?.[def.id] ?? []
  const lifestyle = knownLifestyleTastes(notebook, def.id)
  const memories = sharedMemories(game.life ?? NO_LIFE, def.id)
  const recently = newsRecent(game, def.id)
  const memoryList = (list: typeof memories) => <ul>{list.map((e) => {
    const scene = SCENES[e.id] ?? (e.kind === 'story' ? SCENES[`ev:${e.id.slice(6)}`] : undefined)
    const title = scene?.title ?? (T.taste.kinds as Record<string, string>)[e.kind] ?? T.taste.memories
    return <li key={e.id}>{title} · {e.first === null ? T.taste.unknownDate : fill(T.ui.day, { day: e.first })}{e.count > 1 ? ` · ${e.count}번` : ''}</li>
  })}</ul>
  return (
    <dl className="nb-page">
      <dt>마음</dt>
      <dd>
        <Hearts n={heartsOf(game.hearts[def.id])} />
      </dd>
      {birthday && (
        <>
          <dt>생일</dt>
          <dd>{birthday}</dd>
        </>
      )}
      <dt>좋아하는 것</dt>
      <dd>
        <Taste items={tastes.likes} />
      </dd>
      <dt>싫어하는 것</dt>
      <dd>
        <Taste items={tastes.dislikes} />
      </dd>
      <dt>하루 일과</dt>
      <dd>
        <ul className="nb-slots">
          {SLOTS.map((slot) => (
            <li key={slot}>
              <span className="nb-slot">{SLOT_LABEL[slot]}</span> {seen[slot] ?? '?'}
            </li>
          ))}
        </ul>
      </dd>
      {recently.length > 0 && (
        <>
          <dt>{T.news.title}</dt>
          <dd><ul>{recently.map((line) => <li key={line}>{line}</li>)}</ul></dd>
        </>
      )}
      <dt>{T.taste.title}</dt>
      <dd>{lifestyle.length ? <ul>{lifestyle.map((label) => <li key={label}>{label}</li>)}</ul> : <span className="nb-none">{T.taste.unknown}</span>}</dd>
      <dt>{T.taste.memories}</dt>
      <dd>{memories.length ? <>{memoryList(memories.slice(0, 3))}{memories.length > 3 && <details><summary>{T.taste.all} ({memories.length})</summary>{memoryList(memories)}</details>}</> : <span className="nb-none">{T.taste.empty}</span>}</dd>
      <dd><TasteProposal game={game} npc={def.id} /></dd>
      <dt>{T.ui.gifts}</dt>
      <dd>{got.length ? <Taste items={got} /> : <span className="nb-none">아직 없음</span>}</dd>
      <dt>보여 준 사본</dt>
      <dd>{heard.length ? heard.map((id) => pieceById(id).ref).join(', ') : <span className="nb-none">아직 없음</span>}</dd>
      {promises.length > 0 && (
        <>
          <dt>약속</dt>
          <dd>
            {promises.map((p) => (
              <div key={p.id}>
                {p.day === game.clock.day ? '오늘' : `${p.day}일째`} {Math.floor(p.from / 60)}시~{Math.floor(p.to / 60)}시 · {spotName(p.at)}
              </div>
            ))}
          </dd>
        </>
      )}
    </dl>
  )
}

/** 이미 함께 즐긴 차 자리를 다시 제안한다. 실제 일정 엔진이 가능한 때만 보여 준다. */
function TasteProposal({ game, npc }: { game: GameState; npc: string }) {
  const [reply, setReply] = useState('')
  const n = game.notebook ?? NO_NOTEBOOK
  const eligible = canProposeTea(n, npc, game.clock.day, game.hearts[npc] ?? 0,
    (game.plans?.appts ?? []).some((a) => a.state === 'done' && !!a.attended && a.remembered && a.activity === 'tea' && !!a.startedWith?.includes(npc)))
  let proposal: ReturnType<typeof scheduleAppt> | null = null
  if (eligible) {
    for (let day = game.clock.day + 1; day <= game.clock.day + 7 && !proposal; day++) {
      for (const from of [10 * 60, 14 * 60, 18 * 60]) {
        if (availability(game, npc, day, from, from + 60, CONTENT) !== 'ok') continue
        const result = scheduleAppt(game, { kind: 'event', activity: 'tea', day, from, to: from + 60, place: 'teaTable', members: [npc] }, CONTENT)
        if (result.appt) { proposal = result; break }
      }
    }
  }
  if (!proposal?.appt) return reply ? <p role="status">{reply}</p> : null
  const appt = proposal.appt
  const answer = (accept: boolean) => {
    const current = useGame.getState().game
    const result = accept ? scheduleAppt(current, { kind: 'event', activity: 'tea', day: appt.day, from: appt.from, to: appt.to, place: appt.place, members: [npc] }, CONTENT) : null
    if (accept && !result?.appt) { setReply(T.taste.busy); return }
    const next = { ...(result?.state ?? current), notebook: noteTasteProposal(current.notebook ?? NO_NOTEBOOK, npc, current.clock.day) }
    saveGame(next)
    useGame.setState({ game: next })
    setReply(accept ? T.taste.accepted : T.taste.later)
  }
  return <div><p>{T.taste.proposal}</p><p>{fill(T.ui.day, { day: appt.day })} · {appt.from / 60}시 · 찻집</p><button onClick={() => answer(true)}>{T.taste.accept}</button><button onClick={() => answer(false)}>{T.taste.later}</button>{reply && <p role="status">{reply}</p>}</div>
}

const FACE = 4

function Portrait({ def, season, shadow }: { def: NeighborDef; season: Season; shadow?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    try {
      const src = neighborPortrait(def, season)
      // 틀은 어른 크기(10×14) 그대로 — 키 작은 아이는 늘이지 않고 발을 바닥에 맞춰 그린다
      const w = Math.max(10, src.width)
      const h = Math.max(14, src.height)
      c.width = w * FACE
      c.height = h * FACE
      g.imageSmoothingEnabled = false
      if (shadow) g.filter = 'brightness(0) opacity(0.35)'
      g.drawImage(src, Math.floor((w - src.width) / 2) * FACE, (h - src.height) * FACE, src.width * FACE, src.height * FACE)
    } catch {
      /* 그림을 그릴 수 없는 곳(시험 환경)에서는 비워 둔다 */
    }
  }, [def, season, shadow])
  return <canvas ref={ref} className="nb-face" aria-hidden="true" />
}

/** 앨범 제목: 아이 이름(계획 12)을 넣는다 */
function albumTitle(id: string, kid: string | undefined, spouse = ''): string {
  return spouseFill(kidFill(SCENES[id]?.album ?? '', kid), spouse)
}

/** 앨범: 풍경·가족의 날 (가족 창의 [가족 앨범]이 이 칸을 연다) */
export function Album() {
  const album = useGame((s) => s.game.album)
  const kid = useGame((s) => s.game.child?.name)
  const spouse = useGame((s) => (s.game.romance?.stage === 'married' ? partnerName(s.game) : ''))
  if (!album.length) return <p>{T.ui.albumEmpty}</p>
  // 가족 쪽(우리 아이·배우자·동물 친구, 함께 보낸 시간)과 마을·풍경 쪽으로 나눠 차곡차곡 (계획 12)
  const family = album.filter((a) => isFamilyAlbum(a.id))
  const other = album.filter((a) => !isFamilyAlbum(a.id))
  const grid = (list: typeof album) => (
    <div className="album-grid">
      {list.map((a) => {
        const img = albumImage(a.id)
        return (
          <figure key={a.id} className="album-card">
            {img ? <img src={img} alt={albumTitle(a.id, kid, spouse)} /> : <div className="album-blank" />}
            <figcaption>
              {albumTitle(a.id, kid, spouse)} · {fill(T.ui.day, { day: a.day })}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
  if (!family.length) return grid(other)
  return (
    <>
      <h3 className="album-part">{T.family.albumFamily}</h3>
      {grid(family)}
      {other.length > 0 && <h3 className="album-part">{T.family.albumOther}</h3>}
      {other.length > 0 && grid(other)}
    </>
  )
}

/** 업적: 이룬 것은 이룬 날과 함께, 못 이룬 것은 흐리게 */
export function Awards() {
  const achieved = useGame((s) => s.game.achieved ?? [])
  return (
    <>
      <p className="hint">
        이룬 업적 {achieved.length} / {ACHIEVEMENTS.length}
      </p>
      <ul className="award-list">
        {ACHIEVEMENTS.map((a) => {
          const got = achieved.find((x) => x.id === a.id)
          return (
            <li key={a.id} className={got ? 'on' : ''}>
              <strong>
                {got ? '★' : '☆'} {a.name}
              </strong>
              <span>{a.desc}</span>
              {got && <span className="award-day">{fill(T.ui.day, { day: got.day })}</span>}
            </li>
          )
        })}
      </ul>
    </>
  )
}
