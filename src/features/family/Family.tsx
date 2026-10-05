// 메뉴 → 가족 (2026-09-30 사용자): 배우자·아이·동물 친구와 가족 앨범을 한 화면에
import { neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { ADULT_JOBS, childMode, childStage, type AdultJob, type ChildStage } from '../../engine/child'
import { useState } from 'react'
import { heartsOf } from '../../engine/hearts'
import { closeHearts } from '../../engine/family'
import { STAT_IDS, statScore, type StatId } from '../../engine/stats'
import { useGame } from '../../store/game-store'

const STAT_NAME = T.stats.names as Record<StatId, string>
const STAGE_NAME: Record<ChildStage, string> = { baby: '아기', toddler: '걷는 아이', helper: '돕는 아이', adult: '어른' }
export const JOB_NAME: Record<AdultJob, string> = {
  scribe: '서기', scholar: '학자', woodworker: '목수', shipwright: '배 목수',
  teaKeeper: '찻집 일꾼', merchant: '상인', fisher: '어부', sailor: '뱃사람',
  herbalist: '약초꾼', traveler: '여행자', cook: '요리사', painter: '화가',
  weaver: '직조가', gardener: '원예가', potter: '도예가', instrumentMaker: '악기 제작자',
}
const MODE_NAME = { follow: '데리고 다니는 중', home: '집에 있어요', roam: '혼자 마을을 다녀요', cradle: '요람에서 자요', away: '먼 곳에 살아요' } as const
const STAGE_NAMES_ROMANCE = { dating: '사귀는 중', engaged: '약혼', married: '부부' } as Record<string, string>

export function Family() {
  const game = useGame((s) => s.game)
  const [careerChoice, setCareerChoice] = useState<AdultJob | null>(null)
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
        {game.romance?.stage === 'married' && partner?.avatar && <button onClick={() => open({ kind: 'wardrobe', who: 'spouse' })}>{partner.role} 옷장</button>}
        {kid && <button onClick={() => open({ kind: 'wardrobe', who: 'child' })}>{kid.name} 옷장</button>}
      </div>
      {empty && <p className="hint">아직 함께 사는 가족이 없어요. 이웃과 가까워지고, 떠돌이 동물을 거두면 이곳에 적혀요.</p>}
      {partner && r && (
        <section className="fam-card">
          <h3>
            {partner.role} <span className="fam-tag">{STAGE_NAMES_ROMANCE[r.stage ?? ''] ?? ''}</span>
          </h3>
          <p>
            마음 {'♥'.repeat(Math.min(10, heartsOf(game.hearts[partner.id])))}
            {r.marriedDay ? ` · 함께한 지 ${day - r.marriedDay + 1}일 · 결혼한 날 ${r.marriedDay}일째` : r.since ? ` · 사귄 지 ${day - r.since + 1}일` : ''}
          </p>
        </section>
      )}
      {kid && (
        <section className="fam-card">
          <h3>
            {kid.name} <span className="fam-tag">{STAGE_NAME[childStage(kid, day)]}</span>
          </h3>
          <p>
            태어난 지 {day - kid.born + 1}일 · {MODE_NAME[childMode(kid, day)]}
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
              <p>{kid.name}이 관심과 잘하는 일을 살펴보고 {JOB_NAME[kid.job]} 일을 제안했어요. 함께 진로를 정해요.</p>
              <label>진로 <select value={careerChoice ?? kid.job} onChange={e => setCareerChoice(e.target.value as AdultJob)}>
                {ADULT_JOBS.map(j => <option key={j} value={j}>{JOB_NAME[j]}{(kid.interests?.[j] ?? 0) > 0 ? ' · 함께 경험함' : ''}</option>)}
              </select></label>
              <button onClick={() => useGame.getState().chooseChildCareer(careerChoice ?? kid.job!)}>이 진로로 함께 결정하기</button>
            </div>
          )}
          {kid.job && kid.jobConfirmed !== false && childStage(kid, day) === 'adult' && (
            <div className="actions">
              <p>직업과 사는 곳은 따로 정할 수 있어요.</p>
              <button onClick={() => useGame.getState().setChildResidence(!kid.left)}>{kid.left ? '마을로 돌아와 살기' : '마을 밖에서 살아보기'}</button>
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
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
