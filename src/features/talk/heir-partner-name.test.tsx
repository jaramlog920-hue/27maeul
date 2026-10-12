// 2026-10-12 휴대폰 점검 MOB-02: 은퇴한 부모 자리의 후계자와 사귀면 구절 선물·데이트 화면도 후계자 이름
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CONTENT } from '../../content/catalog'
import { newGenState } from '../../engine/gen'
import { legacyGame } from '../../engine/growth-test-support'
import { NO_ROMANCE } from '../../engine/romance'
import { partnerName, useGame } from '../../store/game-store'
import { LoveVerseView } from './LoveVerseView'

vi.mock('../../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))

function heirGame() {
  const s = legacyGame(CONTENT)
  const gen = newGenState(CONTENT, 7, 134)
  gen.persons['g-0001'] = { id: 'g-0001', origin: 'born', born: 10, stage: 'adult', look: 'm', name: '아론', parents: ['rudy'], spouse: null, household: null }
  gen.retired = { rudy: { heir: 'g-0001', day: 120 } }
  return { ...s, gen, romance: { ...NO_ROMANCE, partner: 'rudy', stage: 'dating' as const, since: 130 } }
}

it('partnerName은 그 자리의 지금 사람 이름', () => {
  expect(partnerName(heirGame())).toBe('아론')
  expect(partnerName({ ...heirGame(), gen: newGenState(CONTENT, 7, 134) })).toBe(CONTENT.neighbors.find((n) => n.id === 'rudy')!.role)
})

it('구절 선물 창 제목도 후계자 이름', () => {
  useGame.setState({ game: heirGame(), modal: { kind: 'loveVerse' } as never })
  render(<LoveVerseView />)
  expect(screen.getByRole('dialog').getAttribute('aria-label')).toContain('아론')
})
