// 동물 친구·우리 아이를 눌렀을 때: 데리고 다니기·집에 두기 (돕는 아이는 혼자 다니게 두기도)
import { childMode, childStage } from '../../engine/child'
import { JOB_NAME } from '../../content/text'
import { fill, T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function FollowMenu({ who }: { who: 'pet' | 'child' }) {
  const game = useGame((s) => s.game)
  const { petCompanion, petActivity, keepCompanion, keepChild, closeModal, open } = useGame.getState()
  if (who === 'pet') {
    const c = game.companion
    if (!c) return null
    return (
      <div className="dialog follow" role="dialog" aria-label={c.name}>
        <h2>{c.name}</h2>
        <p className="hint">{c.stay ? '지금은 집에서 기다리고 있어요.' : '지금은 곁을 따라다녀요.'}</p>
        <details>
          <summary>{T.pet.record}</summary>
          <p>{fill(T.pet.days, { days: Math.max(1, game.clock.day - c.since + 1) })}</p>
          {!c.found?.length && <p>{T.pet.unknown}</p>}
          {c.moments?.play !== undefined && <p>{T.pet.firstPlay} · {fill(T.pet.date, { day: c.moments.play })}</p>}
          {c.moments?.rest !== undefined && <p>{T.pet.firstRest} · {fill(T.pet.date, { day: c.moments.rest })}</p>}
        </details>
        <div className="actions column">
          <button onClick={petCompanion}>쓰다듬기</button>
          <button disabled={Math.abs(c.x-game.player.x)+Math.abs(c.y-game.player.y)>2} onClick={() => petActivity('play')}>{T.pet.play}</button>
          <button disabled={Math.abs(c.x-game.player.x)+Math.abs(c.y-game.player.y)>2} onClick={() => petActivity('rest')}>{T.pet.rest}</button>
          <button className={!c.stay ? 'primary' : ''} disabled={!c.stay} onClick={() => keepCompanion(false)}>
            데리고 다니기
          </button>
          <button className={c.stay ? 'primary' : ''} disabled={!!c.stay} onClick={() => keepCompanion(true)}>
            집에 두기
          </button>
          <button onClick={closeModal}>{T.ui.close}</button>
        </div>
      </div>
    )
  }
  const k = game.child
  if (!k) return null
  const day = game.clock.day
  const mode = childMode(k, day)
  if (mode === 'away') return null
  if (mode === 'cradle')
    return (
      <div className="dialog follow" role="dialog" aria-label={k.name}>
        <h2>{k.name}</h2>
        <p>요람에서 새근새근 자고 있어요.</p>
        <div className="actions">
          <button onClick={closeModal}>{T.ui.close}</button>
        </div>
      </div>
    )
  const helper = childStage(k, day) === 'helper' || childStage(k, day) === 'adult'
  const now = mode === 'follow' ? '지금은 곁을 따라다녀요.' : mode === 'home' ? '지금은 집에서 기다려요.' : '지금은 혼자 마을을 다녀요.'
  return (
    <div className="dialog follow" role="dialog" aria-label={k.name}>
      <h2>{k.name}</h2>
      {k.job && <p>{JOB_NAME[k.job]} · 마을에 남아 산다</p>}
      <p className="hint">{now}</p>
      <div className="actions column">
        {!k.job && <button onClick={() => open({ kind: 'kidTime' })}>{T.family.time.open}</button>}
        <button className={mode === 'follow' ? 'primary' : ''} disabled={mode === 'follow'} onClick={() => keepChild('follow')}>
          데리고 다니기
        </button>
        <button className={mode === 'home' ? 'primary' : ''} disabled={mode === 'home'} onClick={() => keepChild('home')}>
          집에 두기
        </button>
        {helper && (
          <button className={mode === 'roam' ? 'primary' : ''} disabled={mode === 'roam'} onClick={() => keepChild('roam')}>
            혼자 다니게 두기
          </button>
        )}
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
