// 신약을 마친 뒤 돌아보기 (2026-10-21 점검): 스물일곱 권 잔치 뒤 한 번 — 지나온 날 수, 모은 조각, 가까워진 이웃 다섯
import { neighborById } from '../../content/catalog'
import { heartsOf } from '../../engine/hearts'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'

export function NtRecap() {
  const game = useGame((s) => s.game)
  const { closeModal } = useGame.getState()
  const close = Object.entries(game.hearts).filter(([id, p]) => neighborById(id) && heartsOf(p) > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="dialog" role="dialog" aria-label={t('ntRecap.title')}>
      <h2>{t('ntRecap.title')}</h2>
      <p>{t('ntRecap.days', { day: game.clock.day })}</p>
      <p>{t('ntRecap.pieces', { n: game.collected.filter((id) => !id.startsWith('ot:')).length })}</p>
      {close.length > 0 && <p>{t('ntRecap.friends', { names: close.map(([id]) => neighborById(id)!.role).join(' · ') })}</p>}
      <p className="hint">{t('ntRecap.next')}</p>
      <div className="actions"><button className="primary" onClick={closeModal}>{t('ntRecap.close')}</button></div>
    </div>
  )
}
