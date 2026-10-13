// 2026-10-11 연애 점검 4: 마음 문턱을 넘기는 사건이면 옛이야기(romance1/2)가 사건 장면보다 먼저 떴다
import { afterEach, expect, it, vi } from 'vitest'
import { CONTENT, PEOPLE } from '../content/catalog'
import { legacyGame } from '../engine/growth-test-support'
import { setPeopleData, type PersonEvent } from '../engine/people'
import { STORY_HEARTS } from '../engine/romance'
import { POINTS_PER_HEART } from '../engine/hearts'
import { useGame } from './game-store'

vi.mock('../audio/sound', () => ({ sfx: vi.fn(), setAudioMuted: vi.fn() }))
afterEach(() => setPeopleData(PEOPLE))

it('말을 걸면 사건 장면부터 열리고, 옛이야기는 그 뒤 대기열에 남는다', () => {
  const g = legacyGame(CONTENT)
  const at = { x: g.player.x + 1, y: g.player.y }
  const ev: PersonEvent = { id: 'test:gain', title: 'Gain', stage: 0, at, gain: 2 * POINTS_PER_HEART, lines: [{ speaker: 'rudy', text: '안녕' }] } as PersonEvent
  setPeopleData({ people: { ...PEOPLE.people, rudy: { ...PEOPLE.people.rudy, events: [ev] } }, threads: PEOPLE.threads })
  const before = STORY_HEARTS[0] * POINTS_PER_HEART - 1
  // 이미 만난 이웃 (처음 만나면 첫인사부터 — 2026-10-14)
  const s = { ...g, notebook: { ...g.notebook, met: [...(g.notebook?.met ?? []), 'rudy'] }, avatar: { ...g.avatar!, look: 'f' as const }, hearts: { ...g.hearts, rudy: before }, scenes: [],
    npcs: { ...g.npcs, rudy: { ...g.npcs.rudy, x: at.x, y: at.y, visible: true, path: [] } } }
  useGame.setState({ game: s, modal: null })
  useGame.getState().talkTo('rudy')
  expect(useGame.getState().modal).toEqual({ kind: 'scene', id: 'ev:test:gain' })
  expect(useGame.getState().game.scenes).toContain('romance1:rudy')
})
