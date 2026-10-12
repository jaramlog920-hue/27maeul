// 2층 여관 손님과 나누는 말 (2026-10-12 사용자): 어디서 왔는지, 며칠 묵는지, 그날의 이야기
import { useState } from 'react'
import { guestLine, innGuestsNow, stayLine } from '../../engine/inn-guests'
import { useGame } from '../../store/game-store'

export function InnGuestTalk({ id, first }: { id: string; first: string }) {
  const game = useGame((s) => s.game)
  const close = useGame((s) => s.closeModal)
  const here = innGuestsNow(game).find((g) => g.guest.id === id) ?? null
  const [more, setMore] = useState(0)
  if (!here) {
    return (
      <div className="dialog" role="dialog" aria-label="여관 손님">
        <h2>여관 손님</h2>
        <p className="talk-line">손님은 방을 비웠어요.</p>
        <div className="actions"><button data-close onClick={close}>닫기</button></div>
      </div>
    )
  }
  const { guest, stay } = here
  const line = more === 0 ? first : guestLine(game, here, more)
  const leaving = game.clock.day >= stay.leave
  return (
    <div className="dialog" role="dialog" aria-label={`여관 손님 ${guest.name}`}>
      <h2>{guest.name}</h2>
      <p className="hint">{guest.from}에서 온 {guest.why} · {stayLine(stay, game.clock.day)}</p>
      <p className="talk-line">{line}</p>
      <div className="actions">
        {!leaving && more < guest.talk.length && <button onClick={() => setMore(more + 1)}>이야기 더 듣기</button>}
        <button data-close onClick={close}>대화 마치기</button>
      </div>
    </div>
  )
}
