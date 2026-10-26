import { lazy } from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ScreenBoundary } from './ScreenBoundary'
import { useGame } from '../store/game-store'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('생활 화면 청크를 기다리는 동안 안내와 닫기 기능을 제공한다', async () => {
  let finish!: (value: { default: () => React.ReactNode }) => void
  const Screen = lazy(() => new Promise<{ default: () => React.ReactNode }>(resolve => { finish = resolve }))
  useGame.setState({ modal: { kind: 'family' } })
  render(<ScreenBoundary><Screen /></ScreenBoundary>)
  expect(screen.getByRole('status')).toHaveTextContent('화면을 불러오는 중')
  await act(async () => { screen.getByRole('button', { name: '닫기' }).click() })
  expect(useGame.getState().modal).toBeNull()
  await act(async () => { finish({ default: () => <p>가족 화면</p> }) })
  expect(screen.getByText('가족 화면')).toBeInTheDocument()
})
it('청크 실패를 처리해 게임 전체가 사라지지 않고 창을 닫을 수 있다', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const Screen = lazy(async () => { throw new Error('Failed to fetch dynamically imported module: /assets/screens/x.js') })
  useGame.setState({ modal: { kind: 'family' } })
  render(<ScreenBoundary><Screen /></ScreenBoundary>)
  expect(await screen.findByRole('alert')).toHaveTextContent('불러오지 못했어요')
  await act(async () => { screen.getByRole('button', { name: '닫기' }).click() })
  expect(useGame.getState().modal).toBeNull()
})
