// 곁에 선 이웃에게 말 걸기: 가까이 가도 창이 저절로 뜨지 않고, 이 단추를 눌러야 대화가 열린다
import { neighborById } from '../../content/catalog'
import { storyWaiting, neighborBeside } from '../../engine/game'
import { libraryVisitorTile, visitorBeside } from '../../engine/library-visitor'
import { useGame } from '../../store/game-store'

export function TalkButton() {
  const visitor = useGame(s => !s.modal && !s.decorating && visitorBeside(s.game))
  const id = useGame((s) => (s.modal || s.decorating ? null : neighborBeside(s.game)))
  const waiting = useGame((s) => (id ? !!storyWaiting(s.game, id) : false))
  const talkTo = useGame((s) => s.talkTo)
  if (visitor) return <button className="talk-button" onClick={() => {
    const game = useGame.getState().game
    const at = libraryVisitorTile(game)
    if (at) useGame.getState().tap(at)
  }}>💬 대화하기 · 서고 방문객</button>
  if (!id) return null
  const who = neighborById(id)?.role ?? '이웃'
  return (
    <button className={`talk-button${waiting ? ' waiting' : ''}`} onClick={() => talkTo(id)}>
      💬 대화하기 · {who}
    </button>
  )
}
