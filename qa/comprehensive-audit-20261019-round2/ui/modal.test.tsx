import {afterEach,expect,it,vi} from 'vitest'
import {writeFileSync} from 'node:fs'
import {act,cleanup,fireEvent,render,waitFor} from '@testing-library/react'
import {ModalLayer} from '../../../src/features/ModalLayer'
import {RankView} from '../../../src/features/library/RankView'
import {SceneReplay} from '../../../src/features/scene/SceneReplay'
import {CONTENT} from '../../../src/content/catalog'
import {newGame} from '../../../src/engine/game'
import {useGame} from '../../../src/store/game-store'
import * as loader from '../../../src/content/nt-loader'
import * as ntContent from '../../../src/features/passage/NtContent'
import {SCENES} from '../../../src/content/text'
afterEach(()=>{cleanup();vi.restoreAllMocks();useGame.setState({modal:null,piecePopups:[],copyResult:null})})
it('dismisses a null-rendering modal instead of leaving an invisible blocking backdrop',async()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
 useGame.setState({game:newGame(CONTENT),modal:{kind:'space',id:'audit-invalid' as never},piecePopups:[],copyResult:null})
 const view=render(<ModalLayer/>);await waitFor(()=>expect(useGame.getState().modal).toBeNull());expect(view.container.querySelector('.modal-backdrop')).toBeNull()
})
it('keeps NT loading UI open, preloads every collected love-verse book, and safely ignores resolution after close',async()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
 const loaded=vi.spyOn(loader,'ntLoaded').mockReturnValue(false)
 const original=ntContent.NtContent,inputs:unknown[]=[]
 vi.spyOn(ntContent,'NtContent').mockImplementation(props=>{inputs.push(props.books);return original(props)})
 let resolve!:()=>void
 const pending=new Promise<void>(r=>{resolve=r}),load=vi.spyOn(loader,'ensureNtBooks').mockReturnValue(pending)
 const b=newGame(CONTENT)
 const johnPiece=CONTENT.pieces.find(p=>p.book==='jn')!
 useGame.setState({game:{...b,collected:['php-004',johnPiece.id],romance:{...b.romance,partner:'wendell',stage:'dating',since:1}},modal:{kind:'loveVerse'},piecePopups:[],copyResult:null})
 const mapOrig=Array.prototype.map,maps:unknown[]=[]
 const mapSpy=vi.spyOn(Array.prototype,'map').mockImplementation(function(this:unknown[],fn:never,...args:never[]){const out=mapOrig.call(this,fn,...args);if(this===useGame.getState().game.collected)maps.push({input:[...this],out,fn:String(fn)});return out} as never)
 const filterOrig=Array.prototype.filter,filters:unknown[]=[]
 const filterSpy=vi.spyOn(Array.prototype,'filter').mockImplementation(function(this:unknown[],fn:never,...args:never[]){const out=filterOrig.call(this,fn,...args);if(this.includes('php')&&this.includes('jn'))filters.push({input:[...this],out,fn:String(fn)});return out} as never)
 const view=render(<ModalLayer/>);mapSpy.mockRestore();filterSpy.mockRestore();writeFileSync('qa/comprehensive-audit-20261019-round2/ui/modal-observation.json',JSON.stringify({calls:load.mock.calls,inputs,maps,filters,direct:[...new Set(['php','jn'].filter(b=>!!b))],loadedCalls:loaded.mock.calls,mapped:new Map(CONTENT.pieces.map(p=>[p.id,p.book])).get(johnPiece.id),johnPiece,collected:useGame.getState().game.collected,modal:useGame.getState().modal},null,2));expect(load).toHaveBeenCalled();expect(load.mock.calls.some(([books])=>books.includes('php')&&books.includes('jn'))).toBe(true);expect(useGame.getState().modal?.kind).toBe('loveVerse');expect(view.container.querySelector('.modal-backdrop')!.querySelector('*')).not.toBeNull()
 act(()=>useGame.setState({modal:null}));await act(async()=>resolve());expect(useGame.getState().modal).toBeNull();expect(view.container.querySelector('.modal-backdrop')).toBeNull()
})
it('rank history closes back to its library parent',()=>{
 const back={kind:'library'} as const;useGame.setState({game:newGame(CONTENT),modal:{kind:'rank',history:true,back}})
 const view=render(<RankView history/>);fireEvent.click(view.getByText('닫기'));expect(useGame.getState().modal).toEqual(back)
})
it('scene replay closes back to its scene-book parent after advancing through all base dialogue',()=>{
 vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null)
 const id='firstChapter',back={kind:'facility',id:'memoryGarden'} as const
 useGame.setState({game:newGame(CONTENT),modal:{kind:'sceneReplay',id,back:back as never}})
 const view=render(<SceneReplay id={id}/>),n=SCENES[id].lines.length
 for(let i=1;i<n;i++)fireEvent.click(view.container.querySelector('.actions button')!)
 fireEvent.click(view.container.querySelector('.actions button')!);expect(useGame.getState().modal).toEqual(back)
})
