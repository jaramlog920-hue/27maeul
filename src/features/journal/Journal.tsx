// 일지 — 게임 속에서 일어난 사실만 적는다. 두 번째 탭은 이웃 수첩 (만난 이웃, 알게 된 것)
import { useEffect, useRef, useState } from 'react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { fill, itemName, JOB_NAME, JOURNAL_NOTES, T } from '../../content/text'
import { weatherOf } from '../../engine/calendar'
import { seasonOf } from '../../engine/clock'
import { dislikesOf, isSuitor, notYet, type GameState, type JournalEntry } from '../../engine/game'
import { heartsOf } from '../../engine/hearts'
import { birthdayLabel, isBirthday, knownTastes, NO_NOTEBOOK, SLOT_LABEL, SLOTS, spotName } from '../../engine/notebook'
import { NO_LIFE } from '../../engine/people'
import type { ItemId, NeighborDef, Season } from '../../engine/types'
import { neighborPortrait } from '../../render/renderer'
import { useGame } from '../../store/game-store'
import { bondLabel, Hearts } from '../talk/TalkBox'

export function journalLine(e: JournalEntry): string {
  const weather = fill(T.journal.weather, { weather: (T.ui.weather as Record<string, string>)[weatherOf(e.day)] })
  const heard = e.heard.length ? fill(T.journal.heard, { refs: e.heard.map((id) => pieceById(id).ref).join(', ') }) : ''
  const notes = (e.notes ?? []).map((n) => JOURNAL_NOTES[n] ?? '').join('')
  const body = heard + notes || T.journal.quiet
  return fill(T.journal.day, { day: e.day }) + weather + body
}

type Tab = 'days' | 'neighbors'

export function Journal() {
  const closeModal = useGame((s) => s.closeModal)
  const [tab, setTab] = useState<Tab>('days')
  return (
    <div className="dialog journal" role="dialog" aria-label={T.ui.journalTitle}>
      <h2>{T.ui.journalTitle}</h2>
      <div className="tabs" role="tablist">
        {(
          [
            ['days', '하루 기록'],
            ['neighbors', '이웃 수첩'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'days' ? <Days /> : <NeighborBook />}
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
    </div>
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
