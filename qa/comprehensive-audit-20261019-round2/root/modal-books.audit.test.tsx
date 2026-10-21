import {vi,it,expect,afterEach} from 'vitest'
import {render,screen,cleanup} from '@testing-library/react'
import {writeFileSync} from 'node:fs'
vi.mock('../../../src/features/passage/NtContent',()=>({NtContent:({books}:{books:string[]})=><output data-testid="audit-required-books">{JSON.stringify(books)}</output>}))
import {ModalLayer} from '../../../src/features/ModalLayer'
import {CONTENT} from '../../../src/content/catalog'
import {newGame} from '../../../src/engine/game'
import {useGame} from '../../../src/store/game-store'
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()})
it('observes actual ModalLayer book list without loader or array instrumentation',()=>{
 const NativeSet=Set,trace:{values:unknown[];yields:unknown[];stack?:string}[]=[]
 class TraceSet<T> extends NativeSet<T>{
  constructor(values?:Iterable<T>){super(values);if(super.has('php' as T)&&super.has('jn' as T)){
   const rec={values:[...super.values()],yields:[] as unknown[],stack:new Error().stack};trace.push(rec)
   const iterator=super[Symbol.iterator].bind(this)
   this[Symbol.iterator]=function*(){for(const x of iterator()){rec.yields.push(x);yield x}}
  }}
 }
 vi.stubGlobal('Set',TraceSet)
 const nativePush=Array.prototype.push,pushes:unknown[]=[]
 vi.spyOn(Array.prototype,'push').mockImplementation(function(this:unknown[],...args:unknown[]){
  const watch=args.length===1&&(args[0]==='php'||args[0]==='jn'),before=watch?[...this]:null
  const result=Reflect.apply(nativePush,this,args)
  if(watch)Reflect.apply(nativePush,pushes,[{before,args,after:[...this],stack:new Error().stack}])
  return result
 })
 const b=newGame(CONTENT),john=CONTENT.pieces.find(p=>p.book==='jn')!
 useGame.setState({game:{...b,collected:['php-004',john.id]},modal:{kind:'loveVerse'},piecePopups:[],copyResult:null})
 render(<ModalLayer/>);
 const observed=JSON.parse(screen.getByTestId('audit-required-books').textContent!)
 writeFileSync('qa/comprehensive-audit-20261019-round2/root/modal-set-trace.json',JSON.stringify({trace,pushes,observed,collected:useGame.getState().game.collected},null,2))
 expect(observed).toEqual(['php','jn'])
})
