// 2026-10-11 구약 점검 5: 첫 빛을 눌러 건너뛰면 서고 안이 어두운 채로 카드가 떴다
import { fireEvent, render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

const dark = vi.fn()
vi.mock('../../render/renderer', () => ({ setDarknessOverride: (v: number | null) => dark(v) }))
vi.mock('../../content/ot-catalog', () => ({ OT_NAME: {}, ensureOtBook: () => new Promise(() => {}), otLoaded: () => false }))

it('건너뛰면 어둠 덮어쓰기를 바로 푼다', async () => {
  const { FirstLight } = await import('./FirstLight')
  const { container } = render(<FirstLight />)
  dark.mockClear()
  fireEvent.pointerDown(container.querySelector('.first-light-veil')!)
  expect(dark).toHaveBeenLastCalledWith(null)
})
