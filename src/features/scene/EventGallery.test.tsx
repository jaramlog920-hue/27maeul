beforeEach(()=>{vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({fillRect:vi.fn()} as unknown as CanvasRenderingContext2D)})
afterEach(()=>vi.restoreAllMocks())
import {render,screen,fireEvent} from '@testing-library/react'
import {EventGallery} from './EventGallery'
import {eventPreviewEntries,eventGalleryEntries} from './event-registry'
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
 expect(container.querySelectorAll('.event-card img,.event-card canvas').length).toBe(eventGalleryEntries().length)
})
it('새로 연결한 초대 안내도 실제 모임과 함께 검색·순서 재생에 포함하고 원문은 유지한다',()=>{
 const scene=SCENES['notice:starNight']
 render(<EventGallery/>)
 fireEvent.change(screen.getByPlaceholderText('이벤트 이름이나 내용'),{target:{value:'별 보는 밤'}})
 const cards=screen.getAllByRole('link').filter(e=>e.classList.contains('event-card'))
 expect(cards.length).toBe(2)
 const ids=cards.map(card=>new URL(card.getAttribute('href')!,'http://preview.local/').searchParams.get('event'))
 expect(ids).toEqual(expect.arrayContaining(['starNight','notice:starNight']))
 const play=new URL(screen.getByRole('link',{name:'지금 목록 순서대로 보기'}).getAttribute('href')!,'http://preview.local/')
 expect(play.searchParams.get('sequence')).toBe(ids.join(','))
 expect(SCENES['notice:starNight']).toBe(scene)
 expect(eventPreviewEntries().some(e=>e.id==='notice:starNight')).toBe(true)
})
it('새로 그림을 연결한 개인 대화는 홈페이지에서 보이고 원래 대사를 유지한다',()=>{
 const original=SCENES['ev:tilly:busy']
 render(<EventGallery/>)
 fireEvent.change(screen.getByPlaceholderText('이벤트 이름이나 내용'),{target:{value:'바쁜 날'}})
 expect(screen.getByRole('link',{name:/바쁜 날/})).toHaveAttribute('href','play.html?event=ev%3Atilly%3Abusy')
 expect(screen.getByRole('link',{name:'지금 목록 순서대로 보기'})).toHaveAttribute('href',expect.stringContaining('ev%3Atilly%3Abusy'))
 expect(SCENES['ev:tilly:busy']).toBe(original)
 fireEvent.change(screen.getByPlaceholderText('이벤트 이름이나 내용'),{target:{value:'게시판의 첫 부탁'}})
 expect(screen.getByRole('link',{name:/게시판의 첫 부탁/})).toHaveAttribute('href','play.html?event=growth%3Aboard')
})

it.each(['rudy','postman','merchant','presser','tilly','wendell','poppy','cosmo','dexter','basil','marigold','penelope','juniper'])('%s 고백에는 공통 꽃다발을 그리지 않는다',who=>{
 const paint=vi.fn()
 drawConfessionToken(paint,0,0,who)
 const colors=paint.mock.calls.map(call=>call[2])
 expect(colors).not.toContain('#d49aa5')
 if(who!=='juniper')expect(paint).toHaveBeenCalled()
})

it('결혼식 검색은 완성된 13명 잔치와 순서 재생을 찾고 게임 제목은 보존한다',()=>{
 render(<EventGallery/>);fireEvent.change(screen.getByPlaceholderText('이벤트 이름이나 내용'),{target:{value:'결혼식'}});
 const cards=screen.getAllByRole('link').filter(e=>e.classList.contains('event-card'));expect(cards).toHaveLength(13);
 for(const card of cards)expect(card.getAttribute('href')).toContain('wedding%3A');
 expect(screen.getByRole('link',{name:'지금 목록 순서대로 보기'}).getAttribute('href')).toContain('sequence=');
 expect(SCENES['wedding:dexter'].title).toBe('마을 잔치');
})

it('가족방 묶음은 새 29장면과 기존 책읽기·임신·출산만 함께 보여 준다',()=>{
 render(<EventGallery/>)
 fireEvent.click(screen.getByRole('button',{name:'내 집·가족 방'}))
 const cards=screen.getAllByRole('link').filter(e=>e.classList.contains('event-card'))
 expect(cards).toHaveLength(33)
 expect(cards.some(c=>c.getAttribute('href')?.includes('fam%3Awith%3Atilly'))).toBe(true)
 expect(cards.some(c=>c.getAttribute('href')?.includes('fam%3Amarket'))).toBe(false)
 expect(cards.some(c=>c.getAttribute('href')?.includes('pregnancy'))).toBe(true)
})

it('방금 제작한 가족방 29개만 따로 확인할 수 있다',()=>{
 render(<EventGallery/>)
 fireEvent.click(screen.getByRole('button',{name:'새 가족방 29개'}))
 const cards=screen.getAllByRole('link').filter(e=>e.classList.contains('event-card'))
 expect(cards).toHaveLength(29)
 expect(cards.some(c=>c.getAttribute('href')?.includes('pregnancy'))).toBe(false)
 expect(cards.some(c=>c.getAttribute('href')?.includes('growth%3Adecorate'))).toBe(true)
})

it('새 빵집 모음에는 실제 빵집 14개를 모으고 찻집 사건은 포함하지 않는다',()=>{
 render(<EventGallery/>)
 fireEvent.click(screen.getByRole('button',{name:'새 빵집 14개'}))
 const cards=screen.getAllByRole('link').filter(e=>e.classList.contains('event-card'))
 expect(cards).toHaveLength(14)
 expect(cards.some(c=>c.getAttribute('href')?.includes('dateTea'))).toBe(false)
 expect(cards.some(c=>c.getAttribute('href')?.includes('letterTalk'))).toBe(true)
})

it('새 찻집 26개 모음은 가족 집·야외 약속과 구분해 모두 재생한다',()=>{
 render(<EventGallery/>)
 fireEvent.click(screen.getByRole('button',{name:'새 찻집 26개'}))
 const cards=screen.getAllByRole('link').filter(e=>e.classList.contains('event-card'))
 expect(cards).toHaveLength(26)
 expect(cards.some(c=>c.getAttribute('href')?.includes('hesitate2'))).toBe(true)
 expect(cards.some(c=>c.getAttribute('href')?.includes('sister'))).toBe(false)
})
