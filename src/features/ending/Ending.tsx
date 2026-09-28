// 다 쓴 날 (설계 2.11, exclusion-list §1-7): 전달자·길은 그리지 않는다. 이웃이 모여 축하하고, 함께한 날들을 넘겨 본다.
import { useState } from 'react'
import { fill, SCENES, T } from '../../content/text'
import { seasonOf } from '../../engine/clock'
import { LETTERS_TO_READ } from '../../engine/stories'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'
import { speakerName } from '../scene/SceneView'
import { Album, Lines } from '../shelf/Shelf'

export function Ending() {
  const [step, setStep] = useState(0)
  const game = useGame((s) => s.game)
  const nextScene = useGame((s) => s.nextScene)
  const scene = SCENES.ending
  const reads = (game.flags.childLetters ?? 0) >= LETTERS_TO_READ
  const seasons = new Set(Array.from({ length: game.clock.day }, (_, i) => `${Math.floor(i / 7)}:${seasonOf(i + 1)}`)).size
  const child = reads ? T.ending.childReads : T.ending.childListens
  const pages = [
    <div key="gather" className="scene-lines">
      {scene.lines.map((l, i) => (
        <p key={i} className={speakerName(l.speaker) ? 'scene-line said' : 'scene-line narration'}>
          {speakerName(l.speaker) && <span className="talk-role">{speakerName(l.speaker)}</span>}
          {l.text}
        </p>
      ))}
    </div>,
    <div key="read">
      <p className="scene-line said">
        <span className="talk-role">{speakerName(child.speaker)}</span>
        {child.text}
      </p>
      <Passage refText="눅 1:1-4" />
    </div>,
    <ul key="stats" className="ending-stats">
      <li>{fill(T.ui.endingDays, { days: game.clock.day })}</li>
      <li>{fill(T.ui.endingSeasons, { n: seasons })}</li>
      <li>{fill(T.ui.endingPieces, { n: game.collected.length })}</li>
    </ul>,
    <Album key="album" />,
    <Lines key="lines" />,
    <div key="next">
      <h3>{T.ui.endingNext}</h3>
      <p className="hint">{T.ui.endingNextNote}</p>
      <Passage refText="행 1:1" />
    </div>,
  ]
  const last = step === pages.length - 1
  return (
    <div className="dialog scroll-dialog ending" role="dialog" aria-label={T.ui.endingTitle}>
      <h2>{T.ui.endingTitle}</h2>
      {pages[step]}
      <div className="actions">
        {step > 0 && <button onClick={() => setStep(step - 1)}>{T.ui.back}</button>}
        <button className="primary" onClick={() => (last ? nextScene() : setStep(step + 1))}>
          {last ? T.ui.endingContinue : T.ui.next}
        </button>
      </div>
    </div>
  )
}
