beforeEach(()=>{vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)})
afterEach(()=>vi.restoreAllMocks())
import {render,screen,fireEvent} from '@testing-library/react'
import {EventGallery} from './EventGallery'
import {eventPreviewEntries} from './event-registry'
import {drawConfessionToken} from '../../render/milestone-moments-art'
import {previewActor} from './event-preview-art'
import {SCENES} from '../../content/text'

it('모든 이벤트 콘텐츠를 모으고 삭제한 공부는 포함하지 않는다',()=>{
 const entries=eventPreviewEntries()
 expect(entries.some(e=>e.id==='readingFinished')).toBe(true)
 expect(entries.some(e=>e.id==='facilityFinished:shade')).toBe(true)
 expect(entries.some(e=>e.id==='childAsks')).toBe(false)
 for(const id of Object.keys(SCENES))expect(entries.some(e=>e.id===id)).toBe(true)
})
it('앞으로 추가한 이벤트도 수동 등록 없이 목록에 들어간다',()=>{
 SCENES.previewTest={title:'새 이벤트',lines:[{speaker:'narration',text:'새 내용'}]}
 expect(eventPreviewEntries().some(e=>e.id==='previewTest')).toBe(true)
 delete SCENES.previewTest
})
it('검색한 목록의 순서 재생과 개별 재생을 제공한다',()=>{
 localStorage.setItem('preview-preserve','original')
 render(<EventGallery/>)
 fireEvent.change(screen.getByPlaceholderText('이벤트 이름이나 내용'),{target:{value:'내가 고른 표지'}})
 expect(screen.getByRole('link',{name:/내가 고른 표지/})).toHaveAttribute('href','play.html?event=coverFinished')
 expect(screen.getByRole('link',{name:'지금 목록 순서대로 보기'})).toHaveAttribute('href',expect.stringContaining('sequence=coverFinished'))
 expect(localStorage.getItem('preview-preserve')).toBe('original')
})

it('인물별 이벤트에는 실제 상대 캐릭터를 사용한다',()=>{
 expect(previewActor('ev:romance:merchant:confess').who).toBe('merchant')
 expect(previewActor('ev:romance:postman:confess').who).toBe('postman')
 expect(previewActor('ev:rudy:confess').id).toBe('rudy')
})
it('모든 이벤트에 이미지 또는 도트 썸네일을 제공한다',()=>{
 const {container}=render(<EventGallery/>)
 expect(container.querySelectorAll('.event-card img,.event-card canvas').length).toBe(eventPreviewEntries().length)
})

it.each(['rudy','postman','merchant','presser','tilly','wendell','poppy','cosmo','dexter','basil','marigold','penelope','juniper'])('%s 고백에는 공통 꽃다발을 그리지 않는다',who=>{
 const paint=vi.fn()
 drawConfessionToken(paint,0,0,who)
 const colors=paint.mock.calls.map(call=>call[2])
 expect(colors).not.toContain('#d49aa5')
 if(who!=='juniper')expect(paint).toHaveBeenCalled()
})
