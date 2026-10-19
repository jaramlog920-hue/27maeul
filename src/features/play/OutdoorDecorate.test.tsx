import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { DecorateButton } from './DecorateButton'
import { DecorateBar } from './DecorateBar'
import { outdoorFurniture } from '../../engine/outdoor'

vi.mock('../../audio/sound',()=>({sfx:vi.fn(),setAudioMuted:vi.fn()}))
beforeEach(()=>{
 localStorage.clear()
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
 const s=newGame(CONTENT)
 useGame.getState().load({...s,scenes:[],player:{...s.player,x:10,y:8,path:[]},inv:{...s.inv,stool:1,homeDesk:1},homeLevel:3})
})
afterEach(()=>vi.restoreAllMocks())

it('완필 전에도 마당을 꾸밀 수 있고 실내 방·벽·고정 가구 선택은 노출하지 않는다',()=>{
 render(<><DecorateButton/><DecorateBar/></>)
 fireEvent.click(screen.getByRole('button',{name:'마당 꾸미기'}))
 expect(screen.getByRole('toolbar',{name:'마당 꾸미기'})).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'벽 세우기'})).not.toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'작업실'})).not.toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'필사 책상'})).not.toBeInTheDocument()
 act(()=>useGame.getState().startDecorate('stool'))
 act(()=>useGame.getState().tap({x:12,y:2}))
 expect(outdoorFurniture(useGame.getState().game)).toHaveLength(1)
 expect(useGame.getState().game.inv.stool??0).toBe(0)
 fireEvent.click(screen.getByRole('button',{name:'옮기기'}))
 act(()=>useGame.getState().tap({x:14,y:2}))
 expect(outdoorFurniture(useGame.getState().game)[0]).toMatchObject({x:14,y:2})
 act(()=>useGame.getState().removeSelected())
 expect(outdoorFurniture(useGame.getState().game)).toHaveLength(0)
 expect(useGame.getState().game.inv.stool).toBe(1)
})

it('편집 중 시간은 멈추고 취소하면 들고 있던 물건이 사라지지 않는다',()=>{
 const before=useGame.getState().game
 act(()=>useGame.getState().startDecorate('stool'))
 act(()=>useGame.getState().frame(1))
 expect(useGame.getState().game.clock).toEqual(before.clock)
 act(()=>useGame.getState().stopDecorate())
 expect(useGame.getState().game.inv).toEqual(before.inv)
})
