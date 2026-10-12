import { fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newChild } from '../../engine/child'
import { newGame } from '../../engine/game'
import { HOME_ENTRY, PLACES } from '../../engine/world'
import { useGame } from '../../store/game-store'
import { SchoolView } from './SchoolView'

function ready() {
  const base=newGame(CONTENT)
  return {...base,scenes:[],clock:{day:60,minute:600},player:{...base.player,...PLACES.learnTable.stand!},child:newChild(17,base.stats,undefined),flags:{...base.flags,schoolDay:60,kidMade:1}}
}
describe('배움터 작품 보여주기 화면',()=>{
  it('교실 안에서는 작품 소개 단추가 열리고 아이의 작품 기록을 만든다',()=>{
    useGame.setState({game:ready(),modal:{kind:'school'},piecePopups:[],copyResult:null})
    render(<SchoolView />)
    const button=screen.getByRole('button',{name:'작품 소개하기'})
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(useGame.getState().game.life.experiences['fam:show']?.with).toEqual(['family:child'])
  })
  it('교실을 떠나면 열린 화면에서도 발표·구경 단추가 사라진다',()=>{
    const home={...ready(),player:{...ready().player,...HOME_ENTRY}}
    useGame.setState({game:home,modal:{kind:'school'},piecePopups:[],copyResult:null})
    render(<SchoolView />)
    expect(screen.queryByRole('button',{name:'작품 소개하기'})).toBeNull()
    expect(screen.queryByRole('button',{name:'조용히 구경하기'})).toBeNull()
    useGame.getState().showAtSchool('watch')
    expect(useGame.getState().game).toBe(home)
  })
})
