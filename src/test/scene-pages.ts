// 장면 창은 한 줄씩 '다음'으로 넘긴다 (2026-10-07). 테스트에서 끝 장까지 넘기며 본 글을 모두 모은다
import { fireEvent, screen } from '@testing-library/react'

export function pageThrough(): string {
  let text = ''
  for (let i = 0; i < 60; i++) {
    const dialogs = screen.queryAllByRole('dialog')
    text += dialogs[dialogs.length - 1]?.textContent ?? ''
    const next = screen.queryByRole('button', { name: '다음' })
    if (!next) break
    fireEvent.click(next)
  }
  return text
}
