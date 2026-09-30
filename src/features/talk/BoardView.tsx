// 사랑방 벽의 의뢰 게시판 (계획 13 작업 5): 날마다 이웃 부탁 둘
import { CONTENT, neighborById } from '../../content/catalog'
import { itemName, T } from '../../content/text'
import { boardToday, canFulfillBoard } from '../../engine/game'
import { useGame } from '../../store/game-store'

export function BoardView() {
  const game = useGame((s) => s.game)
  const { doBoard, closeModal } = useGame.getState()
  const list = boardToday(game, CONTENT)
  return (
    <div className="dialog board" role="dialog" aria-label="의뢰 게시판">
      <h2>의뢰 게시판</h2>
      <p className="hint">이웃들이 날마다 부탁 쪽지를 붙여 둬요. 물건을 가져다주면 닢과 마음을 받아요.</p>
      <ul className="trade-list">
        {list.map((r) => {
          const block = canFulfillBoard(game, r)
          return (
            <li key={r.id}>
              <span className="trade-get">
                <strong>{neighborById(r.npc)?.role ?? '이웃'}</strong> · {itemName(r.item)} {r.n}개
              </span>
              <span className="trade-pay">
                {r.coins}닢{r.rare ? ` + ${itemName(r.rare)}` : ''}
              </span>
              <button disabled={block !== null} onClick={() => doBoard(r)}>
                {block === 'done' ? '끝냄' : block === 'full' ? T.ui.bagFullShort : '건네기'}
              </button>
            </li>
          )
        })}
      </ul>
      {list.length === 0 && <p className="hint">오늘은 붙은 쪽지가 없어요.</p>}
      <div className="actions">
        <button onClick={closeModal}>{T.ui.close}</button>
      </div>
    </div>
  )
}
