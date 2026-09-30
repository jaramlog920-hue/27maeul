// 메뉴 → 가족 (2026-09-30 사용자): 배우자·아이·동물 친구와 가족 앨범을 한 화면에
import { neighborById } from '../../content/catalog'
import { T } from '../../content/text'
import { childMode, childStage, type AdultJob, type ChildStage } from '../../engine/child'
import { heartsOf } from '../../engine/hearts'
import { STAT_IDS, statScore, type StatId } from '../../engine/stats'
import { useGame } from '../../store/game-store'

const STAT_NAME = T.stats.names as Record<StatId, string>
const STAGE_NAME: Record<ChildStage, string> = { baby: '아기', toddler: '걷는 아이', helper: '돕는 아이', adult: '어른' }
export const JOB_NAME: Record<AdultJob, string> = {
  scribe: '마을 필경사',
  scholar: '먼 도시의 학자',
  woodworker: '마을 목수',
  shipwright: '큰 항구의 배 목수',
  teaKeeper: '마을 찻집 주인',
  merchant: '먼 길 다니는 상인',
  fisher: '마을 어부',
  sailor: '먼 바다의 뱃사람',
  herbalist: '마을 약초꾼',
  traveler: '세상을 도는 나그네',
}
const MODE_NAME = { follow: '데리고 다니는 중', home: '집에 있어요', roam: '혼자 마을을 다녀요', cradle: '요람에서 자요', away: '먼 곳에 살아요' } as const
const STAGE_NAMES_ROMANCE = { dating: '사귀는 중', engaged: '약혼', married: '부부' } as Record<string, string>

export function Family() {
  const game = useGame((s) => s.game)
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
        <button onClick={() => open({ kind: 'shelf', tab: 'album' })}>가족 앨범</button>
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
