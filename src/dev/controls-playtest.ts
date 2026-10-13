// 개발용 화면 점검. 각 주소는 기존 저장을 덮지 않고 새 시험 칸을 만든다.
import { PLACES, HOME_FRONT } from '../engine/world'
import { BOOKS, type GameContent } from '../engine/types'
import { NT_CHAPTER_COUNTS } from '../engine/progression'
import type { Modal } from '../store/game-store'
import { lastVerseGame } from './test-saves'

export async function controlsPlaytest(content: GameContent, test: string) {
  const base = await lastVerseGame(content)
  const game = {
    ...base,
    avatar: { ...base.avatar!, name: `시험 ${test}` },
    inv: { ...base.inv, sturdyShoes: 1, bread: 3 },
    flags: { ...base.flags, 'unlock:rainJar': 1, gospelFeast: 2 },
  }
  let modal: Modal | null = null
  if (test === 'copy') {
    modal = { kind: 'copy', view: 'write' }
  } else if (test.startsWith('tea-')) {
    const place = test === 'tea-cafe' ? 'teaTable' : 'hallTable'
    const members = ['baker', 'weaver', 'child']
    game.clock = { day: 100, minute: 602 }
    game.player = { ...game.player, ...PLACES[place].stand, path: [] }
    game.plans = { nextId: 2, appts: [{ id: 'appt:1', clubId: 'club:1', kind: 'club', day: 100, from: 600, to: 720, place, members, startedWith: members, state: 'running', rewarded: false, remembered: false, attended: false, activity: 'tea' }] }
    modal = { kind: 'clubSession', id: 'appt:1' }
  } else {
    game.shelved = Object.fromEntries(BOOKS.map(b => [b, 2]))
    game.progress = { ...game.progress, rev: { completed: Array.from({ length: NT_CHAPTER_COUNTS.rev }, (_, i) => i + 1), arrangement: {} } }
    game.player = { ...game.player, ...(test === 'feast' ? PLACES.bed.stand : HOME_FRONT), path: [] }
    if (test === 'feast') game.clock = { day: 100, minute: 1320 }
  }
  return { game, modal }
}
