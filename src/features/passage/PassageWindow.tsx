import { pieceById } from '../../content/catalog'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'
import { Passage } from './Passage'
import { Stamps } from './Stamps'

/** back: 닫으면 📖 말씀 › 말씀 조각으로 돌아간다 */
export function PassageWindow({ pieceId, askLine, back }: { pieceId: string; askLine: boolean; back?: boolean }) {
  const piece = pieceById(pieceId)
  const { closeModal, open } = useGame.getState()
  return (
    <div className="dialog scroll-dialog" role="dialog" aria-label={piece.title}>
      <h2>{piece.title}</h2>
      <Passage refText={piece.ref} />
      <Stamps piece={piece} />
      <div className="actions">
        <button onClick={() => (askLine ? open({ kind: 'myLine', lineKey: pieceId }) : back ? open({ kind: 'word', tab: 'pieces' }) : closeModal())}>
          {askLine ? T.ui.next : back ? T.ui.back : T.ui.close}
        </button>
      </div>
    </div>
  )
}
