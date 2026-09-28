// 문 앞 편지 바구니: 오늘의 필사 의뢰 한 통 (게임이 지어낸 생활 문장)
import { fill, T } from '../../content/text'
import { LETTER_PAY } from '../../engine/requests'
import { useGame } from '../../store/game-store'

export function LetterBox() {
  const day = useGame((s) => s.game.clock.day)
  const { startLetter, closeModal } = useGame.getState()
  const requests = T.letters.requests as string[]
  return (
    <div className="dialog" role="dialog" aria-label={T.letters.title}>
      <h2>{T.letters.title}</h2>
      <p>{requests[day % requests.length]}</p>
      <p className="hint">{fill(T.letters.payHint, { pay: LETTER_PAY })}</p>
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
        <button className="primary" onClick={startLetter}>
          {T.letters.start}
        </button>
      </div>
    </div>
  )
}
