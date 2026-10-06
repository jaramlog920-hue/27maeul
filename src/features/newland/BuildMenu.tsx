// 터 가꾸기 창 (계획 20 작업 6): 새 터 입구 표지에서 연다. 놓기(목록 → 부지 미리보기)와 지은 것(취소·허물기) 두 칸.
// 이동은 따로 없다 — 자리를 바꾸려면 취소·허물고 다시 놓는다 (낸 것은 규칙대로 돌아온다). 필사와 서로의 조건이 아니다.
import { useState } from 'react'
import { fill, T } from '../../content/text'
import { buildsOf, type Build } from '../../engine/newland-build'
import { SITE_KINDS, type SiteKind } from '../../engine/newland-sites'
import { useGame } from '../../store/game-store'
import { costText, SitePreview, siteName, type SitePick } from './SitePreview'

const USE_TEXT: Record<SitePick, string> = {
  path: T.build.usePath,
  garden: T.build.useGarden,
  courtyard: T.build.useCourtyard,
  home: T.build.useHome,
  eraser: T.build.useEraser,
}
const STATE_TEXT: Record<Build['state'], string> = { ordered: T.build.ordered, building: T.build.building, done: T.build.done }

function BuiltRow({ b }: { b: Build }) {
  const { removeBuild } = useGame.getState()
  const [sure, setSure] = useState(false)
  const done = b.state === 'done'
  const refundNote = done ? T.build.refundCoins : b.state === 'ordered' ? T.build.refundAll : T.build.refundHalf
  return (
    <li className="build-row">
      <span className="build-name">
        {siteName(b.kind)} · {STATE_TEXT[b.state]}
      </span>
      {sure ? (
        <div className="build-confirm">
          <p className="hint">
            {T.build.sure} {refundNote}
          </p>
          <div className="actions">
            <button className="primary" onClick={() => removeBuild(b.id)}>
              {T.build.yes}
            </button>
            <button onClick={() => setSure(false)}>{T.build.no}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setSure(true)}>{done ? T.build.demolish : T.build.cancel}</button>
      )}
    </li>
  )
}

export function BuildMenu() {
  const game = useGame((s) => s.game)
  const { closeModal } = useGame.getState()
  const [tab, setTab] = useState<'place' | 'built'>('place')
  const [pick, setPick] = useState<SitePick | null>(null)
  const builds = buildsOf(game)

  if (pick) {
    return (
      <div className="dialog build-menu" role="dialog" aria-label={T.build.title}>
        <SitePreview
          pick={pick}
          onBack={() => setPick(null)}
          onPlaced={() => {
            setPick(null)
            setTab('built')
          }}
        />
      </div>
    )
  }
  return (
    <div className="dialog build-menu" role="dialog" aria-label={T.build.title}>
      <h2>{T.build.title}</h2>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'place'} className={tab === 'place' ? 'on' : ''} onClick={() => setTab('place')}>
          {T.build.pickTitle}
        </button>
        <button role="tab" aria-selected={tab === 'built'} className={tab === 'built' ? 'on' : ''} onClick={() => setTab('built')}>
          {T.build.built}
        </button>
      </div>
      {tab === 'place' ? (
        <ul className="build-list">
          {([...SITE_KINDS, 'eraser'] as SitePick[]).map((k) => {
            const isBuild = k === 'courtyard' || k === 'home'
            return (
              <li key={k}>
                <button className="build-pick" onClick={() => setPick(k)}>
                  <strong>{k === 'eraser' ? T.build.eraser : siteName(k as SiteKind)}</strong>
                  <span>{USE_TEXT[k]}</span>
                  {k !== 'eraser' && <span className="hint">{fill(T.build.cost, { cost: costText(k as SiteKind) })}</span>}
                  {isBuild && <span className="hint">{T.build.days}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      ) : builds.length === 0 ? (
        <p className="hint">{T.build.none}</p>
      ) : (
        <ul className="build-built">
          {builds.map((b) => (
            <BuiltRow key={b.id} b={b} />
          ))}
        </ul>
      )}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
