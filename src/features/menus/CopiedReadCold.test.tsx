import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import * as nt from '../../content/nt-loader'
import { CONTENT } from '../../content/catalog'
import { copiedChapters } from '../../engine/copied-reading'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { CopiedReadPick } from './CopiedReadPick'

afterEach(() => vi.restoreAllMocks())

it('재접속한 완성본은 신약 본문을 받은 다음에 펼친다', async () => {
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, scenes: [], progress: { ...base.progress, eph: { ...base.progress.eph, completed: [1] } }, copy: { ...base.copy, copied: { eph: [1] } } })
  let resolve!: () => void
  const load = vi.spyOn(nt, 'ensureNtBook').mockImplementation(() => new Promise<void>(r => { resolve = r }))
  render(<CopiedReadPick />)
  fireEvent.click(screen.getByRole('button', { name: /에베소서 1장/ }))
  expect(load).toHaveBeenCalledWith('eph')
  expect(screen.queryByRole('region')).toBeNull()
  resolve()
  const passage = await screen.findByRole('region', { name: '필사한 본문 · 에베소서 1장' })
  expect(passage.querySelectorAll('p')).toHaveLength(23)
})

it('본문을 받기 전에도 작성 중인 장의 기록한 절을 목록에 남긴다', () => {
  vi.spyOn(nt, 'ntLoaded').mockReturnValue(false)
  const chapterText = vi.fn(() => { throw new Error('본문은 아직 없음') })
  const base = newGame(CONTENT)
  const s = { ...base, copy: { ...base.copy, at: { eph: { chapter: 1, verse: 4 } } } }
  expect(copiedChapters(s, { ...CONTENT, chapterText })).toEqual([{ book: 'eph', chapter: 1, through: 4 }])
  expect(chapterText).not.toHaveBeenCalled()
})
