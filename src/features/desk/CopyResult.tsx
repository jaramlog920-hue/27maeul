import { T } from '../../content/text'
import { t } from '../../shared/i18n'
import { useGame } from '../../store/game-store'
import './copy-result.css'

/** 책을 덮은 뒤 마을에서 확인하는 이번 필사의 능력치 변화. */
export function CopyResult() {
  const gains = useGame(s => s.copyResult)
  const dismiss = useGame(s => s.dismissCopyResult)
  if (!gains?.length) return null
  return (
    <div className="dialog copy-result" role="dialog" aria-label={t('copyResult.title')}>
      <div role="status" aria-label={t('copyResult.title')}>
      <h2>{t('copyResult.title')}</h2>
      <p>{t('copyResult.lead')}</p>
      <ul>
        {gains.map(gain => (
          <li key={gain.id}>
            <span>{T.stats.names[gain.id]}</span>
            <span className="copy-result-values">{gain.before} <span aria-hidden="true">→</span> {gain.after}</span>
            <strong>{t('copyResult.gain', { n: gain.after - gain.before })}</strong>
            <small>{t('copyResult.xp', { n: gain.xp })}</small>
          </li>
        ))}
      </ul>
      </div>
      <button onClick={dismiss}>{t('copyResult.confirm')}</button>
    </div>
  )
}
