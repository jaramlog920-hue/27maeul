// 시작 화면: 제목, 하늘에 떠 있는 섬 마을 그림, 시작 버튼
import { T } from '../../content/text'
import type { Avatar } from '../../engine/avatar'
import { TitleScene } from './TitleScene'

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
      <div className="title-menu">
        {hasSave && (
          <button className="primary wood" onClick={onContinue}>
            {T.ui.continue}
          </button>
        )}
        <button className={hasSave ? 'wood' : 'primary wood'} onClick={onStart}>
          {hasSave ? T.ui.restart : T.ui.start}
        </button>
      </div>
      <p className="title-notice">{T.ui.notice}</p>
    </main>
  )
}
