// 터 가꾸기 창 (계획 20 작업 6): 새 터 입구 표지에서 연다. 놓기(목록 → 부지 미리보기)와 지은 것(취소·허물기) 두 칸.
// 이동은 따로 없다 — 자리를 바꾸려면 취소·허물고 다시 놓는다 (낸 것은 규칙대로 돌아온다). 필사와 서로의 조건이 아니다.
import { useState } from 'react'
import { fill, T } from '../../content/text'
import { buildsOf, type Build } from '../../engine/newland-build'
import { blocksWay, DECOR_KINDS, EXTRA_BUILDS, isDecorKind, SITE_KINDS, type SiteKind } from '../../engine/newland-sites'
import { IconGrid, type IconEntry } from '../../shared/IconGrid'
import { SiteIcon } from './SiteIcon'
import { dreamHeard } from '../../engine/newland-life'
import { kidWorkOwners } from '../../engine/kid-work'
import { t } from '../../shared/i18n'
import { canClaimHome } from '../../engine/newland-myhome'
import { useGame } from '../../store/game-store'
import { costText, SitePreview, siteName, type SitePick } from './SitePreview'

const USE_TEXT: Partial<Record<SitePick, string>> = {
  path: T.build.usePath,
  garden: T.build.useGarden,
  courtyard: T.build.useCourtyard,
  home: T.build.useHome,
  eraser: T.build.useEraser,
}
const STATE_TEXT: Record<Build['state'], string> = { ordered: T.build.ordered, building: T.build.building, done: T.build.done }

function BuiltRow({ b }: { b: Build }) {
  const { removeBuild, claimNewHome } = useGame.getState()
  // 새 터 내 집 (2026-10-14): 다 지은 빈 입주 주택은 내 집으로 정할 수 있다
  const claim = useGame((s) => (b.kind === 'home' ? canClaimHome(s.game, b) : 'notHome'))
  const [sure, setSure] = useState(false)
  const done = b.state === 'done'
  const refundNote = done ? T.build.refundCoins : b.state === 'ordered' ? T.build.refundAll : T.build.refundHalf
  return (
    <li className="build-row">
      <span className="build-name">
        {siteName(b.kind)}{b.size ? ` ${b.size >= 8 ? '3단계' : '2단계'}` : ''} · {STATE_TEXT[b.state]}{claim === 'mine' ? ' · 내 집' : ''}
      </span>
      {claim === null && <button onClick={() => claimNewHome(b.id)}>내 집으로 쓰기</button>}
      {claim === 'mine' && <button onClick={() => claimNewHome(null)}>내 집 그만 쓰기</button>}
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
  // 집 겸 일터의 주인 (2026-10-14: 우리 아이 셋·이웃 자녀)
  const [owner, setOwner] = useState<string | undefined>(undefined)
  const owners = kidWorkOwners(game)
  const builds = buildsOf(game)
  const siteEntry = (k: SitePick): IconEntry => ({
    key: k,
    icon: <SiteIcon kind={k} />,
    label: k === 'eraser' ? T.build.eraser : siteName(k as SiteKind),
    detail: <>
      {USE_TEXT[k] && <p>{USE_TEXT[k]}</p>}
      {isDecorKind(k) && <p>{blocksWay(k) ? '길을 막는 칸이에요.' : '밟고 지나가는 칸이에요.'}</p>}
      {k !== 'eraser' && <p>{fill(T.build.cost, { cost: costText(k as SiteKind) })}</p>}
    </>,
    action: { label: '자리 고르기', onClick: () => setPick(k) },
  })
  // 집 겸 일터: 누구의 것인지 골라서 자리 고르기로
  const kidWorkEntry = (): IconEntry => ({
    ...siteEntry('kidWork'),
    label: T.newlandLife.kidWork.pick,
    detail: <>
      <p>{T.newlandLife.kidWork.pickHint}</p>
      <p>{fill(T.build.cost, { cost: costText('kidWork') })}</p>
      <div className="actions menu column">
        {owners.map((o) => (
          <button key={o.owner} onClick={() => { setOwner(o.owner); setPick('kidWork') }}>
            {fill(T.newlandLife.kidWork.label, { name: o.name })}
          </button>
        ))}
      </div>
    </>,
    action: undefined,
  })

  if (pick) {
    return (
      <div className="dialog build-menu" role="dialog" aria-label={T.build.title}>
        <SitePreview
          pick={pick}
          owner={pick === 'kidWork' ? owner : undefined}
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
        <>
          {/* 2026-10-12 사용자: 줄줄이 늘어놓지 않고 가방처럼 아이콘 칸 — 누르면 값·쓰임, 단추로 자리 고르기 */}
          <IconGrid title={T.build.pickTitle} entries={([...SITE_KINDS, 'eraser'] as SitePick[]).map((k) => siteEntry(k))} />
          {/* 계획 18 남은 건물: 손님집·기억 정원, 꿈 이야기를 들었으면 꿈터 */}
          <IconGrid title="특별한 건물" entries={EXTRA_BUILDS.filter((k) => (k !== 'weaver' || dreamHeard(game)) && (k !== 'gallery' || dreamHeard(game, 'tilly')) && (k !== 'kidWork' || owners.length > 0)).map((k) => (k === 'kidWork' ? kidWorkEntry() : siteEntry(k)))} />
          {/* 꾸미기 소재 (사용자 결정 ⑧) */}
          <IconGrid title={t('decor.title')} entries={DECOR_KINDS.map((k) => siteEntry(k))} />
        </>
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
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
