// 시작 화면: 제목, 하늘에 떠 있는 섬 마을 그림, 시작 버튼
import { T } from '../../content/text'
import type { Avatar } from '../../engine/avatar'
import { TitleScene } from './TitleScene'
import { t } from '../../shared/i18n'

export function Intro({
  hasSave,
  canContinue,
  avatar,
  onStart,
  onContinue,
  onLoad,
}: {
  hasSave: boolean
  canContinue: boolean
  avatar?: Avatar | null
  onStart: () => void
  onContinue: () => void
  onLoad: () => void
}) {
  return (
    <main className="title title-island">
      <header className="title-head">
        <h1>{T.ui.title}</h1>
        <p className="title-sub">{T.ui.subtitle}</p>
      </header>
      <div className="title-stage">
        <TitleScene avatar={avatar} />
      </div>
      {/* 이어하기는 하던 기록으로 바로, 불러오기는 칸 고르기, 새로 시작하기는 새 칸 */}
      <div className="title-menu">
        {canContinue && (
          <button className="primary wood" onClick={onContinue}>
            {t('saves.continue')}
          </button>
        )}
        {hasSave && (
          <button className={canContinue ? 'wood' : 'primary wood'} onClick={onLoad}>
            {t('saves.load')}
          </button>
        )}
        <button className={hasSave ? 'wood' : 'primary wood'} onClick={onStart}>
          {t('saves.new')}
        </button>
      </div>
    </main>
  )
}
