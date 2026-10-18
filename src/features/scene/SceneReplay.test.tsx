import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { SCENES } from '../../content/text'
import { newGame } from '../../engine/game'
import { useGame } from '../../store/game-store'
import { ModalLayer } from '../ModalLayer'
import { seenStories } from './SceneReplay'

describe('기억 정원 › 다시 보는 장면 (2026-10-14)', () => {
  it('본 도트 장면만 처음 본 날 순으로 모은다 (일지·오늘·앨범)', () => {
    const s = { ...newGame(CONTENT), journal: [{ day: 3, heard: [], notes: ['ev:baker:story:3', 'firstChapter'] }], todayNotes: ['village:3'], album: [{ id: 'ev:baker:story:3', day: 3 }], clock: { day: 5, minute: 600 } }
    expect(seenStories(s)).toEqual([{ id: 'ev:baker:story:3', day: 3 }, { id: 'firstChapter', day: 3 }, { id: 'village:3', day: 5 }])
  })
  it('다시 봐도 고르는 말·마음·기록은 그대로다', () => {
    const id = Object.keys(SCENES).find((k) => k === 'ev:poppy:love:1')!
    const before = { ...newGame(CONTENT), todayNotes: [id] }
    useGame.setState({ game: before })
    render(<ModalLayer />)
    act(() => useGame.getState().open({ kind: 'sceneReplay', id }))
    for (let i = 0; i < 40; i++) {
      const next = screen.queryByRole('button', { name: '다음' })
      if (next) fireEvent.click(next)
      else break
    }
    const choice = document.querySelector('.actions.menu.column button') as HTMLButtonElement | null
    if (choice) fireEvent.click(choice)
    expect(useGame.getState().game.hearts).toEqual(before.hearts)
    expect(useGame.getState().game.album).toEqual(before.album)
    expect(useGame.getState().game.scenes).toEqual(before.scenes)
  })
})
