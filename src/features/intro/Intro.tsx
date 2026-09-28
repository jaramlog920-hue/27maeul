// 시작 화면: 밝은 하늘 아래 살아 있는 마을 한 장면과 나무 간판 제목
import { T } from '../../content/text'
import { TitleScene } from './TitleScene'

export function Intro({ hasSave, onStart, onContinue }: { hasSave: boolean; onStart: () => void; onContinue: () => void }) {
  return (
    <main className="title">
      <div className="title-sky">
        <div className="title-sign">
          <h1>{T.ui.title}</h1>
          <p className="title-sub">{T.ui.subtitle}</p>
        </div>
        <div className="title-frame">
          <TitleScene />
        </div>
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
