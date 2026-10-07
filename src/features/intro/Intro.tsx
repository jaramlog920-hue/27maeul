// 시작 화면: 제목, 하늘에 떠 있는 섬 마을 그림, 시작 버튼
import { T } from '../../content/text'
import type { Avatar } from '../../engine/avatar'
import { TitleScene } from './TitleScene'
import { t } from '../../shared/i18n'

export function Intro({
  hasSave,
  avatar,
  onStart,
  onContinue,
}: {
  hasSave: boolean
  avatar?: Avatar | null
  onStart: () => void
  onContinue: () => void
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
      {/* 스타듀밸리처럼: 새로 시작하기는 늘 새 칸, 불러오기는 칸 고르기 (2026-10-07 사용자) */}
      <div className="title-menu">
        {/* 기록이 있으면 불러오기가 먼저 (2026-10-07 사용자) */}
        {hasSave && (
          <button className="primary wood" onClick={onContinue}>
            {t('saves.load')}
          </button>
        )}
        <button className={hasSave ? 'wood' : 'primary wood'} onClick={onStart}>
          {t('saves.new')}
        </button>
      </div>
      <p className="title-notice">{T.ui.notice}</p>
    </main>
  )
}
