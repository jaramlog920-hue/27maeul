// 사랑방 벽 게시판: 주민 부탁 필사(계획 21 R3 — 예전 닢 의뢰 쪽지를 바꾼다) · 마을 일(계획 16 작업 20)
// 이웃이 부탁하면 모은 말씀 조각 하나를 골라 써 준다 (정답 없음, 닢 없음 — 마음과 선물).
import { useState } from 'react'
import { CONTENT, neighborById, pieceById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { pieceFacts } from '../../content/piece-moods'
import { canWriteRequest, copyRequestsToday, writeRequest } from '../../engine/game'
import { KIND_MOODS, type CopyRequest } from '../../engine/copy-requests'
import { useGame } from '../../store/game-store'
import { t } from '../../shared/i18n'
import { VillageBoard } from '../village/VillageBoard'
import { applyLifeState } from '../work/WorkDay'

const R = T.copyReq
const star = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n)

export function BoardView() {
  const game = useGame((s) => s.game)
  const { closeModal } = useGame.getState()
  const [tab, setTab] = useState<'requests' | 'village'>('requests')
  const [sel, setSel] = useState<CopyRequest | null>(null)
  const [result, setResult] = useState<{ r: CopyRequest; stars: number } | null>(null)
  const list = copyRequestsToday(game, CONTENT)
  const tabs = (
    <div className="actions menu">
      <button className={tab === 'requests' ? 'primary' : ''} aria-pressed={tab === 'requests'} onClick={() => setTab('requests')}>{t('copyReq.tab')}</button>
      <button className={tab === 'village' ? 'primary' : ''} aria-pressed={tab === 'village'} onClick={() => setTab('village')}>{T.village.tab}</button>
    </div>
  )
  const close = <button data-close onClick={closeModal}>{T.ui.close}</button>

  if (tab === 'village')
    return (
      <div className="dialog board" role="dialog" aria-label={T.village.title}>
        <h2>의뢰 게시판</h2>
        {tabs}
        <VillageBoard />
        <div className="actions">{close}</div>
      </div>
    )

  // 써 준 뒤: 별과 고마움 한 줄
  if (result) {
    const who = neighborById(result.r.npc)?.role ?? ''
    return (
      <div className="dialog board" role="dialog" aria-label={t('copyReq.tab')}>
        <h2>{who}</h2>
        <p className="copy-req-stars" aria-label={`별 ${result.stars}`}>{star(result.stars)}</p>
        <p className="talk-line">{R.thanks[result.stars - 1]}</p>
        <div className="actions">
          <button className="primary" onClick={() => setResult(null)}>{T.ui.next}</button>
          {close}
        </div>
      </div>
    )
  }

  // 구절 고르기
  if (sel) {
    const want = KIND_MOODS[sel.kind]
    const pieces = game.collected
      .filter((id) => !id.startsWith('ot:'))
      .map((id) => ({ id, f: pieceFacts(game.careDone, id) }))
      .sort((a, b) => b.f.moods.filter((m) => want.includes(m)).length - a.f.moods.filter((m) => want.includes(m)).length || (a.id < b.id ? -1 : 1))
    const who = neighborById(sel.npc)?.role ?? ''
    return (
      <div className="dialog board" role="dialog" aria-label={t('copyReq.pick')}>
        <h2>{who} · {(R.kinds as Record<string, string>)[sel.kind]}</h2>
        <p className="talk-line">{(R.asks as Record<string, string>)[sel.kind]}</p>
        {sel.cond && <p className="hint">{(R.conds as Record<string, string>)[sel.cond]}</p>}
        {pieces.length === 0 ? <p className="hint">{t('copyReq.noPieces')}</p> : (
          <ul className="rows">
            {pieces.map(({ id, f }) => {
              const p = pieceById(id)
              return (
                <li key={id}>
                  <button
                    className="row"
                    onClick={() => {
                      const cur = useGame.getState().game
                      const out = writeRequest(cur, sel, id, pieceFacts(cur.careDone, id), CONTENT)
                      if (!out) return
                      applyLifeState(out.state)
                      setSel(null)
                      setResult({ r: sel, stars: out.stars })
                    }}
                  >
                    <span className="row-main">
                      <b>{p.title}</b>
                      <small>{p.ref}{f.moods.length ? ` · ${f.moods.map((m) => (R.moods as Record<string, string>)[m]).join(' · ')}` : ''}{f.care ? ` · ${t('copyWays.care')}` : ''}</small>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <div className="actions">
          <button onClick={() => setSel(null)}>{T.ui.back}</button>
          {close}
        </div>
      </div>
    )
  }

  return (
    <div className="dialog board" role="dialog" aria-label="의뢰 게시판">
      <h2>의뢰 게시판</h2>
      {tabs}
      {list.length === 0 ? <p className="hint">{t('copyReq.none')}</p> : (
        <ul className="rows">
          {list.map((r) => {
            const block = canWriteRequest(game, r)
            const done = game.flags[`req:${r.id}`]
            return (
              <li key={r.id}>
                <button className="row" disabled={block !== null} onClick={() => setSel(r)}>
                  <span className="row-main">
                    <b>{neighborById(r.npc)?.role ?? '이웃'} · {(R.kinds as Record<string, string>)[r.kind]}</b>
                    {r.cond && <small>{(R.conds as Record<string, string>)[r.cond]}</small>}
                  </span>
                  <span className="row-meta">{done ? star(done) : fill(t('copyReq.daysLeft'), { n: r.until - game.clock.day + 1 })}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="actions">{close}</div>
    </div>
  )
}
