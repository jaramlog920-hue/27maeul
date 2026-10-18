// 낱말 조각: 같은 글자의 조각이 둘 이상이면 어느 것을 눌러도 맞다 (2026-10-18 감사 M-7 — 마 1:2의 '낳고' 둘)
import { fireEvent, render } from '@testing-library/react'
import { versesOf } from '../../content/catalog'
import { tilesFor } from '../../engine/copy-ways'
import { CopyPuzzle } from './CopyPuzzle'

it('같은 글자 조각 중 뒤의 것을 눌러도 틀리지 않고 끝까지 맞춘다', () => {
  const text = versesOf('마 1:2')[0].text
  const tiles = tilesFor(text, 3, 0, 'mt', 1, 2)!
  const dup = tiles.pieces.filter((p, i) => tiles.pieces.indexOf(p) !== i)
  expect(dup.length).toBeGreaterThan(0)
  const done = vi.fn()
  const view = render(<CopyPuzzle data={{ kind: 'tiles', tiles }} label="마 1:2" onDone={done} onManual={() => {}} />)
  for (let step = 0; step < tiles.pieces.length; step++) {
    const want = tiles.pieces[step]
    const same = [...view.container.querySelectorAll<HTMLButtonElement>('.copy-tile')].filter((b) => b.textContent === want)
    fireEvent.click(same[same.length - 1])
    expect(view.container.querySelector('.copy-puzzle.smudge')).toBeNull()
  }
  expect(done).toHaveBeenCalledTimes(1)
})
