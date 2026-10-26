// 사랑방 벽 게시판: 주민 부탁 필사(계획 21 R3 — 예전 닢 의뢰 쪽지를 바꾼다) · 마을 일(계획 16 작업 20)
// 부탁한 분류의 구절을 골라 끝까지 직접 필사한다 (닢 없음 — 마음과 선물).
import { useState } from 'react'
import { CONTENT, neighborById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { canWriteRequest, copyRequestsToday, writePresetRequest } from '../../engine/game'
import type { CopyRequest } from '../../engine/copy-requests'
import { REQUEST_PRESETS, normalizeRequestText, type RequestPreset } from '../../engine/request-presets'
import { useGame } from '../../store/game-store'
import { t } from '../../shared/i18n'
import { BlockedButton } from '../../shared/BlockedButton'
import type { CopyRequestBlock } from '../../engine/game'
import { VillageBoard } from '../village/VillageBoard'
import { applyLifeState } from '../work/WorkDay'
import { featureAccess } from '../../engine/feature-rules'
import { libraryGrowth } from '../../engine/progression'

const R = T.copyReq

/** 부탁을 쓸 수 없는 까닭 (누르면 한 줄) */
const requestWhy = (b: CopyRequestBlock): string | null => (b === null ? null : t(`why.request.${b}`))
/** 옮겨 적은 글이 본문과 어디서 다른지 — 한 글자만 틀려도 단추만 회색이라 어디를 고칠지 몰랐다 (2026-10-26 감사 A09) */
function draftWhy(draft: string, target: string): string | null {
  const a = normalizeRequestText(draft), b = normalizeRequestText(target)
  if (a === b) return null
  if (!a) return t('why.draftEmpty')
  let i = 0
  while (i < a.length && a[i] === b[i]) i++
  return i === a.length ? t('why.draftShort') : t('why.draftWrong', { n: i + 1 })
}

export function BoardView() {
  const game = useGame((s) => s.game)
  const { closeModal } = useGame.getState()
  const [tab, setTab] = useState<'requests' | 'village'>('requests')
  const [sel, setSel] = useState<CopyRequest | null>(null)
  const [result, setResult] = useState<{ r: CopyRequest; stars: number; affinity: number } | null>(null)
  const [preset, setPreset] = useState<RequestPreset | null>(null)
  const [draft, setDraft] = useState('')
  const list = copyRequestsToday(game, CONTENT)
  const access = featureAccess(game, 'board')
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

  // 실제로 오른 호감도만 표시한다 (성격·관계 한도에 따른 보정 포함).
  if (result) {
    const who = neighborById(result.r.npc)?.role ?? ''
    return (
      <div className="dialog board" role="dialog" aria-label={t('copyReq.tab')}>
        <h2>{who}</h2>
        <p role="status">{who} · 호감도 +{result.affinity}</p>
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
    const who = neighborById(sel.npc)?.role ?? ''
    return (
      <div className="dialog board" role="dialog" aria-label={t('copyReq.pick')}>
        <h2>{who} · {(R.kinds as Record<string, string>)[sel.kind]}</h2>
        <p className="talk-line">{(R.asks as Record<string, string>)[sel.kind]}</p>
        {sel.cond && <p className="hint">{(R.conds as Record<string, string>)[sel.cond]}</p>}
        {preset ? (
          <section aria-label="구절 직접 필사">
            <h3>{preset.ref}</h3>
            <p className="talk-line">{preset.text}</p>
            {/* 붙여넣기·끌어 놓기는 받지 않는다 — 책상과 같은 "직접 옮겨 적기" (2026-10-26 감사 A14) */}
            <textarea id="request-copy-draft" aria-label="구절 필사" rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} onPaste={(e) => { e.preventDefault(); useGame.getState().say(T.copyFocus.pasteBlocked, 2800) }} onDrop={(e) => e.preventDefault()} autoComplete="off" spellCheck={false} />
            <div className="actions">
              <button onClick={() => { setPreset(null); setDraft('') }}>다른 구절 선택</button>
              <BlockedButton className="primary" why={requestWhy(canWriteRequest(game, sel)) ?? draftWhy(draft, preset.text)} onClick={() => {
                const out = writePresetRequest(useGame.getState().game, sel, preset.id, draft, CONTENT)
                if (!out) return
                applyLifeState(out.state)
                setResult({ r: sel, stars: out.stars, affinity: out.affinity })
                setSel(null)
                setPreset(null)
                setDraft('')
              }}>필사본 전달하기</BlockedButton>
            </div>
          </section>
        ) : (
          <ul className="rows" aria-label="필사할 구절 5개">
            {REQUEST_PRESETS[sel.kind].map((p) => (
              <li key={p.id}><button className="row" onClick={() => { setPreset(p); setDraft('') }}>
                <span className="row-main"><b>{p.ref}</b><small>{p.text}</small></span>
              </button></li>
            ))}
          </ul>
        )}
        <div className="actions">
          <button onClick={() => { setSel(null); setPreset(null); setDraft('') }}>{T.ui.back}</button>
          {close}
        </div>
      </div>
    )
  }

  return (
    <div className="dialog board" role="dialog" aria-label="의뢰 게시판">
      <h2>의뢰 게시판</h2>
      {tabs}
      {access === 'locked' && <p role="status">서고에 {libraryGrowth(game).completedChapters}장을 기록했어요. 어느 책이든 합쳐 10장을 마치면 첫 부탁이 도착하고, 12장이면 게시판을 제대로 쓸 수 있어요.</p>}
      {access === 'preview' && <p role="status">첫 부탁을 한 번 체험할 수 있어요. 어느 책이든 합쳐 열두 장을 마치면 새로운 부탁이 계속 도착해요.</p>}
      {list.length === 0 ? <p className="hint">{t('copyReq.none')}</p> : (
        <ul className="rows">
          {list.map((r) => {
            const block = canWriteRequest(game, r)
            const done = game.flags[`req:${r.id}`]
            return (
              <li key={r.id}>
                <BlockedButton className="row" why={requestWhy(block)} onClick={() => setSel(r)}>
                  <span className="row-main">
                    <b>{neighborById(r.npc)?.role ?? '이웃'} · {(R.kinds as Record<string, string>)[r.kind]}</b>
                    {r.cond && <small>{(R.conds as Record<string, string>)[r.cond]}</small>}
                  </span>
                  <span className="row-meta">{done ? '완료' : r.id === 'growth:board:intro' ? '첫 부탁 · 기한 없음' : fill(t('copyReq.daysLeft'), { n: r.until - game.clock.day + 1 })}</span>
                </BlockedButton>
              </li>
            )
          })}
        </ul>
      )}
      <div className="actions">{close}</div>
    </div>
  )
}
