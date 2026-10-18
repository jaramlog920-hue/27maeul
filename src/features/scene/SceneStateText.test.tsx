import {act,fireEvent,render,screen} from '@testing-library/react'
import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {newGame} from '../../engine/game'
import {BABY_DAY} from '../../engine/stories'
import {useGame} from '../../store/game-store'
import {SceneView} from './SceneView'
import {SceneReplay} from './SceneReplay'

beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
})
afterEach(()=>vi.restoreAllMocks())

it.each(['live','replay'])('%s displays only approved first-chapter wording when the actual shelf is absent',kind=>{
 const game={...newGame(CONTENT),room:[],scenes:['firstChapter']},before=JSON.stringify(game)
 act(()=>useGame.setState({game}))
 render(kind==='live'?<SceneView id="firstChapter"/>:<SceneReplay id="firstChapter"/>)
 expect(screen.getByText('첫 장을 차례대로 이어 정리해 두었다.')).toBeInTheDocument()
 expect(screen.queryByText(SCENES.firstChapter.lines[0].text)).not.toBeInTheDocument()
 expect(JSON.stringify(useGame.getState().game)).toBe(before);expect(localStorage.length).toBe(0)
})
it.each([1,BABY_DAY])('live bakery dialogue at day %s preserves the original reward and does not write the save',day=>{
 const initial=newGame(CONTENT),game={...initial,clock:{...initial.clock,day},scenes:['done:baker:2']},before=JSON.stringify(game)
 act(()=>useGame.setState({game}))
 render(<SceneView id="done:baker:2"/>)
 expect(screen.getByText(day<BABY_DAY?'덕분에 아기 이불을 준비할 수 있었어요.':SCENES['done:baker:2'].lines[0].text)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'다음'}))
 expect(screen.getByText(SCENES['done:baker:2'].lines[1].text)).toBeInTheDocument()
 expect(JSON.stringify(useGame.getState().game)).toBe(before);expect(localStorage.length).toBe(0)
})
