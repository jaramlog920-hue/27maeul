// 연인에게 구절 선물 (2026-10-08): 주민 부탁 필사처럼 모은 말씀 조각 하나를 골라 써 준다 — 이레에 한 번, 정답 없음.
// 기쁨·감사·소망·위로 분위기의 조각이 위에 온다. 써 주면 고마움 한 줄
import { useState } from 'react'
import { neighborById, pieceById } from '../../content/catalog'
import { fill, T } from '../../content/text'
import { pieceFacts } from '../../content/piece-moods'
import { giveLoveVerse, LOVE_VERSE_MOODS } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { applyLifeState } from '../work/WorkDay'

const R = T.romance
const M = T.copyReq.moods as Record<string, string>

export function LoveVerseView() {
  const game = useGame((s) => s.game)
  const { closeModal } = useGame.getState()
  const [said, setSaid] = useState<string | null>(null)
  const who = neighborById(game.romance?.partner ?? '')?.role ?? ''
  const close = <button data-close onClick={closeModal}>{T.ui.close}</button>
  if (said)
    return (
      <div className="dialog board" role="dialog" aria-label={fill(R.loveVerseTitle, { who })}>
        <h2>{who}</h2>
        <p className="talk-line">{said}</p>
        <div className="actions">{close}</div>
      </div>
    )
  const pieces = game.collected
    .filter((id) => !id.startsWith('ot:'))
    .map((id) => ({ id, f: pieceFacts(game.careDone, id) }))
    .sort((a, b) => b.f.moods.filter((m) => LOVE_VERSE_MOODS.includes(m)).length - a.f.moods.filter((m) => LOVE_VERSE_MOODS.includes(m)).length || (a.id < b.id ? -1 : 1))
  return (
    <div className="dialog board" role="dialog" aria-label={fill(R.loveVerseTitle, { who })}>
      <h2>{fill(R.loveVerseTitle, { who })}</h2>
      {pieces.length === 0 ? (
        <p className="hint">{R.loveVerseNone}</p>
      ) : (
        <ul className="rows">
          {pieces.map(({ id, f }) => {
            const p = pieceById(id)
            return (
              <li key={id}>
                <button
                  className="row"
                  onClick={() => {
                    const cur = useGame.getState().game
                    const out = giveLoveVerse(cur, id, pieceFacts(cur.careDone, id))
                    if (!out) return
                    applyLifeState(out.state)
                    setSaid(R.loveVerseThanks[out.hit ? 1 : 0])
                  }}
                >
                  <span className="row-main">
                    <b>{p.title}</b>
                    <small>{p.ref}{f.moods.length ? ` · ${f.moods.map((m) => M[m]).join(' · ')}` : ''}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <div className="actions">{close}</div>
    </div>
  )
}
