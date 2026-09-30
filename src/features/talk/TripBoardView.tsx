// 여행 주사위 보드게임: 마을 둘레 24칸, 스무 번 안에 한 바퀴. 칸마다 성경 조각·재료·능력치·이벤트·상자
import { useState } from 'react'
import { CONTENT, pieceById } from '../../content/catalog'
import { fill, itemList, T } from '../../content/text'
import { nextTripPiece } from '../../engine/game'
import { BOARD, NEW_BOARD, playTurn, rollDie, TRIP_TURNS, type BoardState, type Cell, type Landing, type TripReward } from '../../engine/trip-board'
import type { StatId } from '../../engine/stats'
import { useGame } from '../../store/game-store'
import { Passage } from '../passage/Passage'

const TB = (T as unknown as { tripBoard: Record<string, unknown> }).tripBoard as {
  title: string
  intro: string
  cells: Record<Cell, string>
  say: Record<string, string>
  events: Record<string, string>
  done: string
  lapped: string
  timeUp: string
}
const ICON: Record<Cell, string> = { start: '⚑', plain: '', book: '📖', item: '🌱', star: '★', event: '?', chest: '🧰' }
const DIE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

/** 7×7 판의 가장자리 칸 자리 (시계 방향) */
function ringPos(i: number): { col: number; row: number } {
  if (i < 7) return { col: i + 1, row: 1 }
  if (i < 13) return { col: 7, row: i - 5 }
  if (i < 19) return { col: 7 - (i - 12), row: 7 }
  return { col: 1, row: 7 - (i - 18) }
}

function rewardLine(r: TripReward, kid: string): string {
  const stat = (T.stats.names as Record<StatId, string>)[(r as { stat: StatId }).stat]
  switch (r.kind) {
    case 'piece':
      return `📖 ${pieceById(r.id).ref}`
    case 'items':
      return `🌱 ${itemList(r.items)}`
    case 'coins':
      return `${r.n}닢`
    case 'stat':
      return `★ ${r.who === 'child' ? `${kid} ` : ''}${stat} +${r.xp}`
  }
}

export function TripBoardView({ dest, withChild, onDone }: { dest: string; withChild: boolean; onDone: (rewards: TripReward[]) => void }) {
  const game = useGame((s) => s.game)
  const [board, setBoard] = useState<BoardState>(NEW_BOARD)
  const [last, setLast] = useState<Landing | null>(null)
  const [reading, setReading] = useState<string | null>(null)
  const kid = game.child?.name ?? '아이'
  const roll = () => {
    const rnd = useGame.getState().rng
    const r = playTurn(board, rollDie(rnd), rnd, { withChild, nextPiece: (taken) => nextTripPiece(game, CONTENT, taken) })
    setBoard(r.board)
    setLast(r.landing)
    const piece = r.landing.rewards.find((x) => x.kind === 'piece')
    setReading(piece && piece.kind === 'piece' ? piece.id : null)
  }
  const sayLine = last ? (last.say.startsWith('event:') ? TB.events[last.say.slice(6)] : TB.say[last.say]).replaceAll('{child}', kid) : TB.intro
  return (
    <div className="trip-board">
      <p className="hint">{fill(TB.title, { dest })} · 스무 번 안에 한 바퀴</p>
      <div className="tb-grid" role="grid" aria-label="여행 판">
        {BOARD.map((c, i) => {
          const p = ringPos(i)
          return (
            <div key={i} className={`tb-cell tb-${c}${board.pos === i ? ' here' : ''}`} style={{ gridColumn: p.col, gridRow: p.row }} title={TB.cells[c]}>
              <span className="tb-icon">{ICON[c]}</span>
              {board.pos === i && (
                <span className="tb-tokens">
                  <span className="tb-me">나</span>
                  {withChild && <span className="tb-kid">{kid.slice(0, 1)}</span>}
                </span>
              )}
            </div>
          )
        })}
        <div className="tb-center" style={{ gridColumn: '2 / 7', gridRow: '2 / 7' }}>
          <p className="tb-turn">
            {board.turn} / {TRIP_TURNS}번째
          </p>
          <button className="tb-die primary" disabled={board.done} onClick={roll} aria-label="주사위 굴리기">
            <span>{board.lastRoll ? DIE[board.lastRoll - 1] : '🎲'}</span>
          </button>
          <p className="tb-say">{sayLine}</p>
          {last && last.rewards.length > 0 && <p className="tb-got">{last.rewards.map((r) => rewardLine(r, kid)).join(' · ')}</p>}
        </div>
      </div>
      {reading && (
        <div className="tb-reading">
          <Passage refText={pieceById(reading).ref} />
          <p className="hint">받은 이야기는 돌아가서 책상에서 엮을 수 있어요.</p>
        </div>
      )}
      <ul className="tb-legend" aria-label="칸 종류">
        {(['book', 'item', 'star', 'event', 'chest'] as Cell[]).map((c) => (
          <li key={c} className={`tb-${c}`}>
            {ICON[c]} {TB.cells[c]}
          </li>
        ))}
      </ul>
      {board.done && (
        <div className="tb-end">
          <p>
            <strong>{board.lapped ? TB.lapped : TB.timeUp}</strong>
          </p>
          <p className="hint">얻은 것: {board.rewards.length ? board.rewards.map((r) => rewardLine(r, kid)).join(' · ') : '없음'}</p>
          <div className="actions">
            <button className="primary" onClick={() => onDone(board.rewards)}>
              마을 가게 들르기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
