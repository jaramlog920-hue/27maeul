// 개발용 시험 저장 (배포 빌드에는 쓰이지 않는다 — App이 import.meta.env.DEV일 때만 부른다).
// 주소 뒤 ?test=26 → 신약 26권을 마치고 서고에 꽂은 뒤, 요한계시록 마지막 한 절(22:21)만 남은 상태.
import { ensureNtBooks } from '../content/nt-loader'
import { copyVerses } from '../engine/copying'
import { EARLY_MILESTONES } from '../engine/feature-rules'
import { newGame, recordProgress, type GameState } from '../engine/game'
import { NT_CHAPTER_COUNTS } from '../engine/progression'
import { deserialize, serialize } from '../engine/save'
import { BOOKS, type GameContent } from '../engine/types'

const LAST: (typeof BOOKS)[number] = 'rev'

export async function lastVerseGame(content: GameContent): Promise<GameState> {
  await ensureNtBooks([LAST])
  const base = newGame(content)
  const s: GameState = {
    ...base,
    scenes: [],
    avatar: { ...(base.avatar ?? { look: 'f' }), name: base.avatar?.name || '시험' },
    clock: { day: 100, minute: 9 * 60 },
    coins: 30000,
    flags: {
      ...base.flags,
      villageLevel: 10,
      ...Object.fromEntries(content.neighbors.map((n) => [`movedIn:${n.id}`, 1])),
      // 지난 성장 안내가 한꺼번에 뜨지 않게
      ...Object.fromEntries(EARLY_MILESTONES.map((m) => [`growth:${m.id}`, 1])),
    },
  }
  const shelved: GameState['shelved'] = {}
  for (const b of BOOKS) {
    if (b === LAST) continue
    s.progress[b] = { completed: Array.from({ length: NT_CHAPTER_COUNTS[b] }, (_, i) => i + 1), arrangement: {} }
    shelved[b] = 2
  }
  const lastChapter = NT_CHAPTER_COUNTS[LAST]
  s.progress[LAST] = { completed: Array.from({ length: lastChapter - 1 }, (_, i) => i + 1), arrangement: {} }
  const verses = copyVerses(LAST, lastChapter, content)
  const next: GameState = { ...s, shelved, copy: { ...s.copy, book: LAST, at: { ...s.copy.at, [LAST]: { chapter: lastChapter, verse: verses.at(-1)!.verse } } } }
  // 불러오기 정리(제본·책장 등 따라오는 칸)를 한 번 거친다
  return deserialize(serialize(recordProgress(next).state), content) ?? next
}
