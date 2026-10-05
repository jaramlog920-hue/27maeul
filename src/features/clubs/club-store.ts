import { saveGame } from '../../engine/save'
import { recordProgress, type GameState } from '../../engine/game'
import { useGame } from '../../store/game-store'

export function commitClub(game:GameState) {
 const next=recordProgress(game).state
 saveGame(next)
 useGame.setState({game:next})
}
