// 메뉴 → 가족 (2026-09-30 사용자): 배우자·아이·동물 친구와 가족 앨범을 한 화면에
import { temperName } from '../../engine/persona'
import { CONTENT, neighborById } from '../../content/catalog'
import { lookOf } from '../../engine/game'
import { T, withSubject } from '../../content/text'
import { ADULT_JOBS, childHome, childMode, childStage, leavesVillage, type AdultJob, type ChildStage } from '../../engine/child'
import { useState } from 'react'
import { t } from '../../shared/i18n'
import { heartsOf } from '../../engine/hearts'
import { closeHearts } from '../../engine/family'
import { STAT_IDS, statScore, type StatId } from '../../engine/stats'
import { ME } from '../../engine/family-tree'
import { partnerName, useGame } from '../../store/game-store'
import { allKids } from '../../engine/siblings'

const STAT_NAME = T.stats.names as Record<StatId, string>
const STAGE_NAME: Record<ChildStage, string> = { baby: '아기', toddler: '걷는 아이', helper: '돕는 아이', adult: '어른' }
export const JOB_NAME: Record<AdultJob, string> = {
  scribe: '서기', scholar: '학자', woodworker: '목수', shipwright: '배 목수',
  teaKeeper: '찻집 일꾼', merchant: '상인', fisher: '어부', sailor: '뱃사람',
  herbalist: '약초꾼', traveler: '여행자', cook: '요리사', painter: '화가',
  weaver: '직조가', gardener: '원예가', potter: '도예가', instrumentMaker: '악기 제작자',
}
const MODE_NAME = { follow: '데리고 다니는 중', home: '집에 있어요', roam: '혼자 마을을 다녀요', cradle: '요람에서 자요', away: '먼 곳에 살아요', lodging: '공동 주택 2층에 살아요' } as const
const STAGE_NAMES_ROMANCE = { dating: '사귀는 중', engaged: '약혼', married: '부부' } as Record<string, string>

export function Family() {
  const game = useGame((s) => s.game)
  // 고른 진로는 그 아이(태어난 날)에게만 — 다른 아이로 바꾸면 버린다 (2026-10-18 감사 L-39)
  const [careerPick, setCareerPick] = useState<{ born: number; job: AdultJob } | null>(null)
  // 진로·살 곳은 한 번 묻고 정한다 — 단추 하나로 조용히 끝났다 (2026-10-27 플레이 점검)
  const [asking, setAsking] = useState<{ kind: 'career'; job: AdultJob } | { kind: 'home'; where: 'away' | 'lodging' } | null>(null)
  const careerChoiceOf = (born: number) => (careerPick?.born === born ? careerPick.job : null)
  const { closeModal, open, keepCompanion } = useGame.getState()
  const day = game.clock.day
  const r = game.romance
  const partner = r?.partner ? neighborById(r.partner) : null
  const kid = game.child
  const pet = game.companion
  const empty = !partner && !kid && !pet
  return (
    <div className="dialog family" role="dialog" aria-label="가족">
      <h2>가족</h2>
      <div className="fam-wardrobe">
        {game.avatar && <button onClick={() => open({ kind: 'wardrobe', who: 'me' })}>내 옷장</button>}
        {game.romance?.stage === 'married' && lookOf(game,'spouse',CONTENT) && <button onClick={() => open({ kind: 'wardrobe', who: 'spouse' })}>{partnerName(game)} 옷장</button>}
        {kid && <button onClick={() => open({ kind: 'wardrobe', who: 'child' })}>{kid.name} 옷장</button>}
        {/* 우리 가족 가계도 (2026-10-12 사용자: 가족 창에서도 바로) */}
        {(game.romance?.stage === 'married' || kid) && <button onClick={() => open({ kind: 'familyTree', personId: ME, neighborId: '' })}>가계도</button>}
      </div>
      {empty && <p className="hint">아직 함께 사는 가족이 없어요. 이웃과 가까워지고, 떠돌이 동물을 거두면 이곳에 적혀요.</p>}
      {partner && r && (
        <section className="fam-card">
          <h3>
            {partnerName(game)} <span className="fam-tag">{STAGE_NAMES_ROMANCE[r.stage ?? ''] ?? ''}</span>
          </h3>
          <p>
            호감도 {'♥'.repeat(Math.min(10, heartsOf(game.hearts[partner.id])))}
            {r.marriedDay ? ` · 함께한 지 ${day - r.marriedDay + 1}일 · 결혼한 날 ${r.marriedDay}일째` : r.since ? ` · 사귄 지 ${day - r.since + 1}일` : ''}
          </p>
          {/* 저녁·데이트를 함께한 날 (결혼 뒤 보상 — 2026-10-21) */}
          {r.stage === 'married' && <p className="hint">함께 저녁을 먹거나 나들이한 날 {game.flags.togetherDays ?? 0}일</p>}
        </section>
      )}
      {/* 아이 셋 (2026-10-13 사용자: 셋 다 활동할 수 있게) — 고른 아이와 함께 보내는 시간·배움터·옷장·진로 */}
      {kid && (game.siblings?.length ?? 0) > 0 && (
        <div className="fam-kids" role="group" aria-label={T.siblings.pick}>
          <span>{T.siblings.pick}</span>
          {allKids(game).slice().sort((a, b) => a.born - b.born).map((k) => (
            <button key={k.born} className={k.born === kid.born ? 'on' : ''} aria-pressed={k.born === kid.born} onClick={() => useGame.getState().selectKid(k.born)}>
              {k.name} <small>{STAGE_NAME[childStage(k, day)]}{k.temper ? ` · ${temperName(k.temper)}` : ''}</small>
            </button>
          ))}
        </div>
      )}
      {kid && (
        <section className="fam-card">
          <h3>
            {kid.name} <span className="fam-tag">{STAGE_NAME[childStage(kid, day)]}</span>
          </h3>
          <p>
            태어난 지 {day - kid.born + 1}일 · {MODE_NAME[childMode(kid, day) === 'away' && childHome(game) === 'lodging' ? 'lodging' : childMode(kid, day)]}
            {kid.job && ` · ${JOB_NAME[kid.job]}`}
          </p>
          {(kid.close ?? 0) > 0 && (
            <p className="kid-close">
              {T.family.time.close} {'♥'.repeat(closeHearts(kid))}
              {'♡'.repeat(5 - closeHearts(kid))}
            </p>
          )}
          {!kid.job && childStage(kid, day) !== 'baby' && <button onClick={() => open({ kind: 'kidTime' })}>{T.family.time.open}</button>}
          {Object.keys(kid.interests ?? {}).length > 0 && <p>함께 경험한 관심 분야: {ADULT_JOBS.filter(j => (kid.interests?.[j] ?? 0) > 0).map(j => JOB_NAME[j]).join(' · ')}</p>}
          {kid.job && kid.jobConfirmed === false && (
            <div className="actions">
              <p>{withSubject(kid.name)} {JOB_NAME[kid.job]} 일을 하고 싶어해요. 함께 진로를 정해요.</p>
              <label>진로 <select value={careerChoiceOf(kid.born) ?? kid.job} onChange={e => setCareerPick({ born: kid.born, job: e.target.value as AdultJob })}>
                {ADULT_JOBS.map(j => <option key={j} value={j}>{JOB_NAME[j]}{(kid.interests?.[j] ?? 0) > 0 ? ' · 함께 경험함' : ''}</option>)}
              </select></label>
              <button onClick={() => setAsking({ kind: 'career', job: careerChoiceOf(kid.born) ?? kid.job! })}>이 진로로 함께 결정하기</button>
            </div>
          )}
          {kid.job && kid.jobConfirmed !== false && childStage(kid, day) === 'adult' && (
            <div className="actions">
              {/* 사는 곳은 직업에 따라: 떠나는 직업은 더 넓은 곳으로, 마을 안 직업은 공동주택으로 (2026-10-12 결정 2) */}
              {kid.left
                ? <button onClick={() => useGame.getState().setChildResidence('home')}>집으로 돌아와 살기</button>
                : leavesVillage(kid.job)
                  ? <button onClick={() => setAsking({ kind: 'home', where: 'away' })}>더 넓은 곳으로 떠나기</button>
                  : <button onClick={() => setAsking({ kind: 'home', where: 'lodging' })}>공동 주택에서 살기</button>}
            </div>
          )}
          {asking && (
            <div className="build-confirm" role="group" aria-label={t('confirm.title')}>
              <p className="hint">{asking.kind === 'career'
                ? t('confirm.career', { name: kid.name, job: JOB_NAME[asking.job] })
                : t(asking.where === 'away' ? 'confirm.leaveAway' : 'confirm.leaveLodging', { name: kid.name })}</p>
              <div className="actions">
                <button className="primary" onClick={() => {
                  if (asking.kind === 'career') useGame.getState().chooseChildCareer(asking.job)
                  else useGame.getState().setChildResidence(asking.where)
                  setAsking(null)
                }}>{t('confirm.yes')}</button>
                <button onClick={() => setAsking(null)}>{t('confirm.keep')}</button>
              </div>
            </div>
          )}
          <ul className="fam-stats">
            {STAT_IDS.map((id) => (
              <li key={id}>
                <span>{STAT_NAME[id]}</span>
                <span className="fam-bar">
                  <span style={{ width: `${statScore(kid.stats[id])}%` }} />
                </span>
                <span>{statScore(kid.stats[id])}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {pet && (
        <section className="fam-card">
          <h3>
            {pet.name} <span className="fam-tag">{pet.kind === 'dog' ? '강아지' : '고양이'}</span>
          </h3>
          <p>함께한 지 {day - pet.since + 1}일 · {pet.stay ? '집에서 기다려요' : '데리고 다녀요'}</p>
          <button onClick={() => keepCompanion(!pet.stay)}>{pet.stay ? '데리고 다니기' : '집에 두기'}</button>
        </section>
      )}
      <div className="actions">
        <button onClick={() => open({ kind: 'journal', tab: 'album' })}>가족 앨범</button>
        <button data-close onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
