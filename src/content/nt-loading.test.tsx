import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import raw from './bible-subset.json'
import { BOOKS } from '../engine/types'
import { bibleIdOf } from '../engine/shelf-rooms'
import { verseKey } from './verse-hash'

beforeEach(() => vi.resetModules())
afterEach(() => { cleanup(); vi.doUnmock('./nt-loader') })

it('앱 콘텐츠 입구와 진행 색인은 본문을 받지 않으며 선택한 책만 받는다', async () => {
  const loader = await import('./nt-loader')
  const catalog = await import('./catalog')
  expect(BOOKS.every(b => !loader.ntLoaded(b))).toBe(true)
  expect(catalog.copySourceFor('mt').chapters.length).toBe(28)
  expect(catalog.verseCountOf('마 1:1-3')).toBe(3)
  expect(catalog.pieceOfVerse('마 1:1')).toBeDefined()
  expect(() => catalog.versesOf('마 1:1')).toThrow('not loaded: mt')
  const first = loader.ensureNtBook('phm')
  expect(loader.ensureNtBook('phm')).toBe(first)
  await first
  expect(loader.ntLoaded('phm')).toBe(true)
  expect(BOOKS.filter(loader.ntLoaded)).toEqual(['phm'])
  expect(catalog.chapterText('phm', 1).length).toBe(25)
  expect(catalog.chapterGuide('phm', 1)).toBeTruthy()
})

it('책별 본문·누락 절·퀴즈 중복 세기는 원본 전권과 일치한다', async () => {
  const loader = await import('./nt-loader')
  const catalog = await import('./catalog')
  const total = new Map<string, number>()
  for (const chapters of Object.values(raw)) for (const chapter of chapters) for (const text of chapter)
    total.set(verseKey(text), (total.get(verseKey(text)) ?? 0) + 1)
  const src = catalog.quizSourceFor(BOOKS)
  for (const b of BOOKS) {
    await loader.ensureNtBook(b)
    const chapters = raw[bibleIdOf(b) as keyof typeof raw]
    expect(loader.ntBookData(b).chapters).toEqual(chapters)
    for (const [i, chapter] of chapters.entries()) {
      expect(catalog.chapterText(b, i + 1).map(v => v.text)).toEqual(chapter.filter(t => !catalog.noText(t)))
      for (const text of chapter) expect(src.countAnywhere(text)).toBe(total.get(verseKey(text)))
    }
  }
})

it('화면은 실패 안내와 재시도를 제공하고 불러온 뒤 본문을 표시한다', async () => {
  let loaded = false
  const ensure = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(async () => { loaded = true })
  vi.doMock('./nt-loader', () => ({ ntLoaded: () => loaded, ensureNtBooks: ensure }))
  const { NtContent } = await import('../features/passage/NtContent')
  render(<NtContent books={['phm']}><p>필사 화면</p></NtContent>)
  expect(screen.getByRole('status')).toHaveTextContent('불러오는 중')
  expect(screen.queryByText('필사 화면')).toBeNull()
  await screen.findByRole('alert')
  expect(screen.getByRole('button', { name: '저장하고 다시 접속' })).toBeInTheDocument()
  await act(async () => { screen.getByRole('button', { name: '다시 불러오기' }).click() })
  await screen.findByText('필사 화면')
  expect(ensure).toHaveBeenCalledTimes(2)
})

it('본문을 기다리는 책 선택을 취소하면 뒤늦게 필사 창이 열리지 않는다', async () => {
  const { useGame } = await import('../store/game-store')
  const { ntLoaded } = await import('./nt-loader')
  useGame.setState({ modal: { kind: 'copy', view: 'pick' } })
  const before = useGame.getState().game
  useGame.getState().copyBook('phm')
  expect(useGame.getState().game).toBe(before)
  useGame.getState().closeModal()
  await waitFor(() => expect(ntLoaded('phm')).toBe(true))
  expect(useGame.getState().modal).toBeNull()
  expect(useGame.getState().game.copy.book).toBe(before.copy.book)
})
