// 배움터 (2026-09-30): 닢을 내고 아이를 맡기면 고른 능력치가 자란다. 하루 한 번, 저녁 여섯 시까지
import { T } from '../../content/text'
import { canShow, classroomWork, SHOW_MODES, type ShowMode } from '../../engine/family-memory'
import { itemName } from '../../content/text'
import { canSchool, SCHOOL_FEE, SCHOOL_XP } from '../../engine/game'
import { STAT_IDS, statScore, type StatId } from '../../engine/stats'
import { useGame } from '../../store/game-store'

const SHOW_LABEL: Record<ShowMode, string> = { speak: '작품 소개하기', draw: '그림으로 보여 주기', watch: '조용히 구경하기' }
const SHOW_WHY: Record<string, string> = {
  noChild: '',
  stage: '',
  notAtSchool: '',
  nothing: '보여 줄 물건이 없어요.',
  done: '오늘은 다녀왔어요.',
}
const WHY: Record<string, string> = {
  noChild: '맡길 아이가 없어요.',
  baby: '아직 아기예요.',
  away: '아이가 마을을 떠났어요.',
  done: '오늘은 이미 맡겼어요.',
  late: '오늘은 끝났어요.',
  coins: '닢이 모자라요.',
}

export function SchoolView() {
  const game = useGame((s) => s.game)
  const { goSchool, closeModal } = useGame.getState()
  const block = canSchool(game)
  const kid = game.child
  const names = T.stats.names as Record<StatId, string>
  const { showAtSchool } = useGame.getState()
  const watch = canShow(game, 'watch')
  const showing = watch === null || watch === 'done'
  const work = classroomWork(game)
  return (
    <div className="dialog school" role="dialog" aria-label="배움터">
      <h2>배움터</h2>
      <p className="hint">
        하루 {SCHOOL_FEE}닢 · 경험치 +{SCHOOL_XP}
      </p>
      {kid && block !== 'noChild' && block !== 'away' && (
        <ul className="trade-list">
          {STAT_IDS.map((id) => (
            <li key={id}>
              <span className="trade-get">
                {names[id]} 배우기
              </span>
              <span className="trade-pay">
                {kid.name} {statScore(kid.stats[id])}/100
              </span>
              <button disabled={block !== null} onClick={() => goSchool(id)}>
                맡기기
              </button>
            </li>
          ))}
        </ul>
      )}
      {block && <p className="hint">{WHY[block]}</p>}
      {showing && (
        <section className="school-show">
          <h3>교실 한쪽</h3>
          <ul className="kid-acts">
            {SHOW_MODES.map((m) => (
              <li key={m}>
                <button disabled={canShow(game, m) !== null} onClick={() => showAtSchool(m)}>
                  {SHOW_LABEL[m]}
                </button>
              </li>
            ))}
          </ul>
          {SHOW_MODES.map((m) => canShow(game, m)).includes('nothing') && <p className="hint">{SHOW_WHY.nothing}</p>}
          {watch === 'done' && <p className="hint">{SHOW_WHY.done}</p>}
        </section>
      )}
      {work && kid && <p className="hint">교실 선반 · {itemName(work as never)}</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
