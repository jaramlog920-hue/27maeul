import {drawLibraryFinale} from './library-finale-art'

it('마지막 책을 꽂은 뒤에도 책장의 크기와 위치는 고정된다',()=>{
 const shelfAt=(time:number)=>{
  const fillRect=vi.fn(),g={fillStyle:'',fillRect} as unknown as CanvasRenderingContext2D
  drawLibraryFinale(g,320,180,time,null,{},26,{guests:[],spouse:null,child:null,baby:false,babyName:''})
  // 27권을 담는 큰 책장 틀: 카메라 이동으로 위치와 도트 폭이 바뀌지 않아야 한다.
  return fillRect.mock.calls.find(([, ,width,height])=>width===154&&height===101)
 }
 expect(shelfAt(0)).toEqual([83,23,154,101])
 expect(shelfAt(5)).toEqual(shelfAt(0))
 expect(shelfAt(7)).toEqual(shelfAt(0))
})
