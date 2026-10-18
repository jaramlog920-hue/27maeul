import {CONTENT} from '../../content/catalog'
import {SCENES} from '../../content/text'
import {newGame} from '../../engine/game'
import {BABY_DAY} from '../../engine/stories'
import {sceneStateText} from './scene-state-text'

it('keeps the original first chapter when an exposed actual shelf exists',()=>{
 const state=newGame(CONTENT)
 expect(sceneStateText('firstChapter',state)).toBe(SCENES.firstChapter)
})
it('uses the approved organizing line only when the actual shelf is absent',()=>{
 const state={...newGame(CONTENT),room:[]},before=JSON.stringify(state),source=JSON.stringify(SCENES.firstChapter)
 expect(sceneStateText('firstChapter',state).lines[0].text).toBe('첫 장을 차례대로 이어 정리해 두었다.')
 expect(JSON.stringify(state)).toBe(before);expect(JSON.stringify(SCENES.firstChapter)).toBe(source)
})
it.each(['up','left','right'] as const)('does not extend the text exception to an existing %s-facing shelf',facing=>{
 const state={...newGame(CONTENT),room:[{item:'homeShelf' as const,x:18,y:111,facing}]}
 expect(sceneStateText('firstChapter',state)).toBe(SCENES.firstChapter)
})
it('uses preparation before birth while preserving the reward line and all scene metadata',()=>{
 const state=newGame(CONTENT),before=JSON.stringify(state),original=SCENES['done:baker:2'],scene=sceneStateText('done:baker:2',state)
 expect(scene.lines[0]).toEqual({...original.lines[0],text:'덕분에 아기 이불을 준비할 수 있었어요.'})
 expect(scene.lines[1]).toBe(original.lines[1]);expect(scene.album).toBe(original.album);expect(scene.choices).toBe(original.choices)
 expect(JSON.stringify(state)).toBe(before)
})
it('keeps the original sleeping-baby line when the real baker infant exists',()=>{
 const state=newGame(CONTENT)
 expect(sceneStateText('done:baker:2',{...state,clock:{...state.clock,day:BABY_DAY}})).toBe(SCENES['done:baker:2'])
})
it('leaves unrelated scenes and context-free previews untouched',()=>{
 const state=newGame(CONTENT)
 for(const id of Object.keys(SCENES).filter(id=>!['firstChapter','done:baker:2'].includes(id)))expect(sceneStateText(id,state)).toBe(SCENES[id])
 expect(sceneStateText('firstChapter',null)).toBe(SCENES.firstChapter)
 expect(sceneStateText('unknown',state)).toBeUndefined()
})
