// 곁에 선 이웃에게 말 걸기: 가까이 가도 창이 저절로 뜨지 않고, 이 단추를 눌러야 대화가 열린다
import { neighborById } from '../../content/catalog'
import { eventWaiting, neighborBeside } from '../../engine/game'
import { useGame } from '../../store/game-store'

export function TalkButton() {
  const id = useGame((s) => (s.modal || s.decorating ? null : neighborBeside(s.game)))
  const waiting = useGame((s) => (id ? !!eventWaiting(s.game, id) : false))
  const talkTo = useGame((s) => s.talkTo)
  if (!id) return null
  const who = neighborById(id)?.role ?? '이웃'
  return (
    <button className={`talk-button${waiting ? ' waiting' : ''}`} onClick={() => talkTo(id)}>
      💬 대화하기 · {who}
    </button>
  )
}
