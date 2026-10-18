// 2026-10-12 휴대폰 점검 MOB-01: 본문 첫 다운로드가 끊긴 뒤엔 같은 화면의 재시도로 복구되지 않는다
// (브라우저가 실패한 import를 기억) — 다른 본문 화면처럼 "저장하고 다시 접속"으로 복구할 수 있어야 한다
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import * as nt from '../../content/nt-loader'
import * as save from '../../engine/save'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { CopiedReadPick } from './CopiedReadPick'

afterEach(() => vi.restoreAllMocks())

it('받기에 실패하면 "저장하고 다시 접속" 단추 — 누르면 저장 뒤 다시 연다', async () => {
  const base = newGame(CONTENT)
  useGame.getState().load({ ...base, scenes: [], progress: { ...base.progress, jud: { ...base.progress.jud, completed: [1] } }, copy: { ...base.copy, copied: { jud: [1] } } })
  vi.spyOn(nt, 'ensureNtBook').mockRejectedValue(new Error('internetdisconnected'))
  const saved = vi.spyOn(save, 'saveGameAsync').mockResolvedValue(true)
  const reload = vi.fn()
  Object.defineProperty(window, 'location', { value: { ...window.location, reload }, configurable: true })
  render(<CopiedReadPick />)
  fireEvent.click(screen.getByRole('button', { name: /유다서 1장/ }))
  const again = await screen.findByRole('button', { name: '저장하고 다시 접속' })
  await act(async () => { fireEvent.click(again) })
  expect(saved).toHaveBeenCalled()
  expect(reload).toHaveBeenCalled()
})
