// 시작 화면: 해질녘 마을 서고 문 앞. 제목은 문 위 돌간판에 새긴다.
import { T } from '../../content/text'
import type { Avatar } from '../../engine/avatar'
import { PLAQUE, SCENE_H, SCENE_W, TitleScene } from './TitleScene'

const pct = (n: number, of: number) => `${(n / of) * 100}%`

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
    <main className="title title-dusk">
      <div className="title-stage">
        <TitleScene avatar={avatar} />
        <div
          className="title-plaque"
          style={{ left: pct(PLAQUE.x, SCENE_W), top: pct(PLAQUE.y, SCENE_H), width: pct(PLAQUE.w, SCENE_W), height: pct(PLAQUE.h, SCENE_H) }}
        >
          <h1>{T.ui.title}</h1>
          <p className="title-sub">{T.ui.subtitle}</p>
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
