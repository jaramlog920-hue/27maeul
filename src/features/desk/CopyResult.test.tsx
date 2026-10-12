import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGame } from '../../engine/game'
import { copySpot } from '../../engine/copying'
import { addXp, freshStats, totalXp } from '../../engine/stats'
import { copyStatGains } from '../../engine/copy-result'
import { deserialize, serialize } from '../../engine/save'
import { useGame } from '../../store/game-store'
import { CopyResult } from './CopyResult'

beforeEach(() => {
  localStorage.clear()
  useGame.getState().load({ ...newGame(CONTENT), scenes: [] })
})

function finishChapter(book: 'jud' | 'phm') {
  useGame.getState().copyBook(book)
  for (let spot = copySpot(useGame.getState().game, book, CONTENT); spot; spot = copySpot(useGame.getState().game, book, CONTENT)) {
    useGame.getState().copyVoice(spot.verse.text)
  }
}

describe('책을 덮은 뒤 필사 결과', () => {
  it('장 완료 보상을 모았다가 책을 덮으면 이전 → 현재 점수와 경험치를 보여 주고 확인으로 닫는다', () => {
    render(<CopyResult />)
    const before = useGame.getState().game.stats
    act(() => finishChapter('jud'))
    expect(screen.queryByRole('status')).toBeNull()
    act(() => useGame.getState().copyExit())
    expect(useGame.getState().modal).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('필사로 오른 능력치')
    expect(screen.getByRole('status')).toHaveTextContent('지능')
    expect(screen.getByRole('status')).toHaveTextContent('손재주')
    const after = useGame.getState().game.stats
    expect(useGame.getState().copyResult).toEqual(copyStatGains(before, after))
    expect(deserialize(serialize(useGame.getState().game), CONTENT)?.stats).toEqual(after)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('여러 책·장을 쓴 뒤 일반 닫기를 해도 이번에 받은 능력치를 모두 합산한다', () => {
    const before = useGame.getState().game.stats
    finishChapter('jud')
    finishChapter('phm')
    useGame.getState().closeModal()
    expect(useGame.getState().copyResult).toEqual(copyStatGains(before, useGame.getState().game.stats))
    expect(useGame.getState().copyResult?.[0].xp).toBe(9)
  })

  it('다시 앉으면 지난 결과를 더하지 않고, 한 절·쓰다 만 입력만으로 능력치가 올랐다고 표시하지 않는다', () => {
    finishChapter('jud')
    useGame.getState().copyExit()
    useGame.getState().open({ kind: 'copy', view: 'pick' })
    useGame.getState().copyBook('phm')
    const spot = copySpot(useGame.getState().game, 'phm', CONTENT)!
    useGame.getState().copyVoice(spot.verse.text)
    useGame.getState().copyType('우')
    useGame.getState().copyExit()
    expect(useGame.getState().copyResult).toBeNull()
    expect(copySpot(useGame.getState().game, 'phm', CONTENT)?.draft).toBe('우')
  })

  it('최고 능력치에서는 상승 표시를 만들지 않고, 저장을 불러오면 결과가 초기화된다', () => {
    const base = useGame.getState().game
    useGame.getState().load({ ...base, stats: Object.fromEntries(Object.entries(base.stats).map(([id, value]) => [id, { ...value, level: 5, xp: 0 }])) as typeof base.stats })
    finishChapter('jud')
    useGame.getState().copyExit()
    expect(useGame.getState().copyResult).toBeNull()
    useGame.getState().load(base)
    finishChapter('jud')
    useGame.getState().copyExit()
    useGame.getState().load(base)
    expect(useGame.getState().copyResult).toBeNull()
    expect(useGame.getState().copySessionStats).toBeNull()
  })

  it('단계가 바뀌어도 경험치 차이가 정확하고 반올림으로 같은 점수라면 경험치를 남긴다', () => {
    const before = addXp(freshStats(), 'wit', 29)
    const after = addXp(before, 'wit', 4.5)
    expect(after.wit.level).toBe(2)
    expect(copyStatGains(before, after)[0].xp).toBe(4.5)
    expect(totalXp(after.wit) - totalXp(before.wit)).toBe(4.5)
    const small = addXp(freshStats(), 'wit', 0.1)
    expect(copyStatGains(freshStats(), small)[0]).toMatchObject({ before: 1, after: 1, xp: 0.1 })
  })
})
