// 동물 친구·우리 아이를 눌렀을 때: 데리고 다니기·집에 두기 (돕는 아이는 혼자 다니게 두기도)
import { childMode, childStage } from '../../engine/child'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'

export function FollowMenu({ who }: { who: 'pet' | 'child' }) {
  const game = useGame((s) => s.game)
  const { petCompanion, keepCompanion, keepChild, closeModal } = useGame.getState()
  if (who === 'pet') {
    const c = game.companion
    if (!c) return null
    return (
      <div className="dialog follow" role="dialog" aria-label={c.name}>
        <h2>{c.name}</h2>
        <p className="hint">{c.stay ? '지금은 집에서 기다리고 있어요.' : '지금은 곁을 따라다녀요.'}</p>
        <div className="actions column">
          <button onClick={petCompanion}>쓰다듬기</button>
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
  const helper = childStage(k, day) === 'helper'
  const now = mode === 'follow' ? '지금은 곁을 따라다녀요.' : mode === 'home' ? '지금은 집에서 기다려요.' : '지금은 혼자 마을을 다녀요.'
  return (
    <div className="dialog follow" role="dialog" aria-label={k.name}>
      <h2>{k.name}</h2>
      <p className="hint">{now}</p>
      <div className="actions column">
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
