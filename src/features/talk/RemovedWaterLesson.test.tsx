import {render,screen} from '@testing-library/react'
import {TalkBox} from './TalkBox'
import {useGame} from '../../store/game-store'
import {newGame} from '../../engine/game'
import {CONTENT} from '../../content/catalog'

it('옛 공부 플래그가 남아 있어도 대화에 글자 가르치기 버튼·대사가 없다',()=>{
 const s=newGame(CONTENT)
 const modal={kind:'talk' as const,neighborId:'child',line:'안녕하세요.'}
 useGame.setState({game:{...s,clock:{day:1,minute:1090},flags:{...s.flags,childAsked:1,childLetters:0}},modal})
 render(<TalkBox modal={modal}/>)
 expect(screen.queryByRole('button',{name:'글자 가르치기'})).not.toBeInTheDocument()
 expect(screen.queryByText('오늘도 한 글자 가르쳐 주세요!')).not.toBeInTheDocument()
 expect('startTeach' in useGame.getState()).toBe(false)
})
