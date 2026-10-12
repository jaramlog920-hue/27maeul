import { pieceById } from '../../content/catalog'
import { T } from '../../content/text'
import { useGame } from '../../store/game-store'
import { Passage } from './Passage'
import { Stamps } from './Stamps'

/** back: 닫으면 말씀 › 말씀 조각으로 돌아간다. said: 조각을 건넨 이웃의 말 (특별한 대화에서 바로 열렸을 때) */
export function PassageWindow({ pieceId, askLine, back, said }: { pieceId: string; askLine: boolean; back?: boolean; said?: string }) {
  const piece = pieceById(pieceId)
  const { closeModal, open } = useGame.getState()
  return (
    <div className="dialog scroll-dialog" role="dialog" aria-label={piece.title}>
      {said && <p className="talk-line">{said}</p>}
      <h2>{piece.title}</h2>
      <Passage refText={piece.ref} />
      <Stamps piece={piece} />
      {/* 조각 제목은 개역한글 소제목 — 출처를 본문 창에 밝힌다 (말씀 탭 목록에는 붙이지 않는다) */}
      <p className="stamp-note">소제목과 관련 본문은 대한성서공회 개역한글 성경읽기의 표기를 따릅니다.</p>
      <div className="actions">
        <button onClick={() => (askLine ? open({ kind: 'myLine', lineKey: pieceId }) : back ? open({ kind: 'word', tab: 'pieces' }) : closeModal())}>
          {askLine ? T.ui.next : back ? T.ui.back : T.ui.close}
        </button>
      </div>
    </div>
  )
}
