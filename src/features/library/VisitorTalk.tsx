import { useState } from 'react'
import { pieceById } from '../../content/catalog'
import { canTeachVisitor, teachVisitor, todaysVisitor, type GuestKind } from '../../engine/game'
import { saveGame } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'

const GREETINGS: Record<GuestKind, string> = {
  wanderer: '길을 걷다가 들렀어요. 잠시 쉬면서 이 말씀을 읽고 있었어요.',
  learner: '혼자 읽다가 생각이 많아졌어요. 함께 읽어 주실래요?',
  kid: '이 책을 보고 있었어요! 같이 읽으면 더 잘 알 것 같아요.',
  scribe: '다른 마을에서 왔어요. 이곳에 엮인 책들을 천천히 읽고 있어요.',
}

export function VisitorTalk({ day }: { day: number }) {
  const game = useGame(s => s.game)
  const visitor = todaysVisitor(game)
  const [choosing, setChoosing] = useState(false)
  const close = useGame(s => s.closeModal)
  const present = game.clock.day === day && !!visitor
  return <div className="dialog" role="dialog" aria-label="서고 방문객">
    <h2>서고 방문객</h2>
    <p className="talk-line">{!present ? '방문객은 돌아갔어요.' : visitor.taught ? '함께 읽어 주셔서 고마워요. 오늘 읽은 말씀을 기억할게요.' : GREETINGS[visitor.kind]}</p>
    {present && visitor.village && <p className="hint">{visitor.village}에서 왔어요.</p>}
    {present && visitor.taught && <Passage refText={pieceById(visitor.taught).ref} />}
    {present && canTeachVisitor(game) && !choosing && <div className="actions">
      <button onClick={() => setChoosing(true)}>함께 읽어 주기</button>
    </div>}
    {present && choosing && <ul className="rows">
      {game.collected.filter(id => !id.startsWith('ot:')).map(id => <li key={id}>
        <button className="row" onClick={() => {
          const next = teachVisitor(useGame.getState().game, id)
          if (next) { saveGame(next); useGame.setState({ game: next }); setChoosing(false) }
        }}>{pieceById(id).title} · {pieceById(id).ref}</button>
      </li>)}
    </ul>}
    <div className="actions"><button data-close onClick={close}>대화 마치기</button></div>
  </div>
}
