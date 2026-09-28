// 선반: 모은 것들을 본다 — 이야기 도감·받은 선물·만들 줄 아는 것·풍경 앨범·나의 한 줄·방 꾸미기
import { useState } from 'react'
import { PIECES, pieceById } from '../../content/catalog'
import { fill, ITEM_TEXT, SCENES, T } from '../../content/text'
import { FURNITURE } from '../../engine/room'
import { ItemIcon } from '../../shared/ItemIcon'
import { albumImage, useGame } from '../../store/game-store'

type Tab = 'dex' | 'gifts' | 'recipes' | 'album' | 'lines'

export function Shelf() {
  const [tab, setTab] = useState<Tab>('dex')
  const closeModal = useGame((s) => s.closeModal)
  const tabs: [Tab, string][] = [
    ['dex', T.ui.dex],
    ['album', T.ui.album],
    ['lines', T.ui.myLinesTitle],
    ['gifts', T.ui.gifts],
    ['recipes', T.ui.recipes],
  ]
  return (
    <div className="dialog shelf" role="dialog" aria-label={T.ui.shelfTitle}>
      <h2>{T.ui.shelfTitle}</h2>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'dex' && <Dex />}
      {tab === 'gifts' && <Gifts />}
      {tab === 'recipes' && <Recipes />}
      {tab === 'album' && <Album />}
      {tab === 'lines' && <Lines />}
      <div className="actions">
        <Decorate />
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}

/** 본문을 열었다 '뒤로' 돌아와도 거르기를 기억한다 */
let rememberOnly = false

export function Dex() {
  const collected = useGame((s) => s.game.collected)
  const open = useGame((s) => s.open)
  const [only, setOnlyState] = useState(rememberOnly)
  const setOnly = (v: boolean) => {
    rememberOnly = v
    setOnlyState(v)
  }
  const got = new Set(collected)
  const list = PIECES.filter((p) => !only || p.stamps.length === 0)
  const chapters = [...new Set(list.map((p) => p.chapter))]
  return (
    <div className="dex">
      <div className="dex-filter">
        <button className={!only ? 'on' : ''} onClick={() => setOnly(false)}>
          {T.ui.dexAll}
        </button>
        <button className={only ? 'on' : ''} onClick={() => setOnly(true)}>
          ✦ {T.ui.dexOnly}
        </button>
        <span className="hint">{fill(T.ui.dexCount, { got: list.filter((p) => got.has(p.id)).length, all: list.length })}</span>
      </div>
      <p className="stamp-note">{T.ui.stampNote}</p>
      {chapters.map((c) => (
        <section key={c}>
          <h3>{fill(T.ui.chapterLabel, { chapter: c })}</h3>
          <ul className="dex-list">
            {list
              .filter((p) => p.chapter === c)
              .map((p) =>
                got.has(p.id) ? (
                  <li key={p.id}>
                    <button className={`dex-item ${p.stamps.length === 0 ? 'only' : ''}`} onClick={() => open({ kind: 'passage', pieceId: p.id, askLine: false, back: true })}>
                      <span className="piece-title">
                        {p.stamps.length === 0 && '✦ '}
                        {p.title}
                      </span>
                      <span className="piece-ref">{p.ref}</span>
                      <span className="dex-stamps">
                        {p.stamps.map((s) => (
                          <span key={s.ref} className={`mini-stamp ${s.kind}`}>
                            {s.ref.split(' ')[0]}
                            {s.kind === 'similar' ? '≈' : ''}
                          </span>
                        ))}
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={p.id} className="dex-item unknown">
                    <span className="piece-title">{T.ui.dexUnknown}</span>
                    <span className="piece-ref">{p.ref}</span>
                  </li>
                ),
              )}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Gifts() {
  const gifts = useGame((s) => s.game.giftsGot)
  if (!gifts.length) return <p>{T.ui.giftsEmpty}</p>
  return (
    <ul className="bag-list">
      {gifts.map((id) => (
        <li key={id}>
          <ItemIcon id={id} />
          <span className="bag-name">{ITEM_TEXT[id].name}</span>
          <span className="bag-desc">{ITEM_TEXT[id].desc}</span>
        </li>
      ))}
    </ul>
  )
}

function Recipes() {
  const known = useGame((s) => s.game.recipesKnown)
  if (!known.length) return <p>{T.ui.recipesEmpty}</p>
  return (
    <ul className="journal-list">
      {known.map((r) => (
        <li key={r}>{(T.recipes as Record<string, string>)[r]}</li>
      ))}
    </ul>
  )
}

export function Album() {
  const album = useGame((s) => s.game.album)
  if (!album.length) return <p>{T.ui.albumEmpty}</p>
  return (
    <div className="album-grid">
      {album.map((a) => {
        const img = albumImage(a.id)
        return (
          <figure key={a.id} className="album-card">
            {img ? <img src={img} alt={SCENES[a.id]?.album ?? ''} /> : <div className="album-blank" />}
            <figcaption>
              {SCENES[a.id]?.album} · {fill(T.ui.day, { day: a.day })}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}

export function Lines() {
  const lines = useGame((s) => s.game.myLines)
  const entries = Object.entries(lines)
  if (!entries.length) return <p>{T.ui.myLinesEmpty}</p>
  return (
    <ul className="my-lines">
      {entries.map(([pid, text]) => (
        <li key={pid}>
          <span className="piece-ref">
            {pieceById(pid).title} ({pieceById(pid).ref})
          </span>
          <q>{text}</q>
        </li>
      ))}
    </ul>
  )
}

function Decorate() {
  const inv = useGame((s) => s.game.inv)
  const room = useGame((s) => s.game.room)
  const startDecorate = useGame((s) => s.startDecorate)
  const has = FURNITURE.some((f) => (inv[f] ?? 0) > 0) || room.length > 0
  return (
    <button disabled={!has} title={has ? '' : T.ui.decorateNone} onClick={() => startDecorate('pick')}>
      {T.ui.decorate}
    </button>
  )
}
