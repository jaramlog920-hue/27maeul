// 계획 21 R5·R6·R8: 다른 마을과 서고 소문, 마을 서고 순위.
// 다른 마을은 "있다고 가정만" 한다 — 이름(지어낸 우리말)과 서고 점수(숫자)만 있고 갈 수 없다.
// 점수는 저장된 씨앗으로 날마다 조금씩 오른다: 앞서는 마을·비슷한 마을·뒤처지는 마을이 섞인다.
// 순위는 오탈자 정확도로 겨루지 않는다 — 모은 조각·꽂은 권수·정성 필사·부탁 필사·방명록을 셀 뿐.
import { mulberry32 } from './offers'
import type { GameState } from './game'

/** 다른 마을 숫자의 씨앗: 주민 가족 씨앗(저장됨), 없으면 고정값 */
export const villageSeed = (s: Pick<GameState, 'gen'>): number => s.gen?.seed ?? 20261007

/** 지어낸 다른 마을 19곳 (성경·실제 지명 없음 — FORBIDDEN_PLACES 검사) */
export const VILLAGES: readonly string[] = [
  '버들내', '솔고개', '물방아골', '돌담마을', '갈대울', '아랫섬', '바람재', '느티골', '샘터말', '은행나루',
  '달맞이골', '들국화말', '솔섬', '개울목', '언덕배기', '보리밭골', '등불재', '노을나루', '감나무골',
]

/** 마을마다 하루에 오르는 서고 점수 (씨앗으로 0.6–3.6) — 플레이어가 보통 하루 1–3점쯤 쌓는 것을 기준으로 */
export function villageRates(seed: number): number[] {
  const rnd = mulberry32((seed ^ 0x5bd1e995) >>> 0)
  return VILLAGES.map(() => 0.6 + rnd() * 3)
}

/** 그날 다른 마을들의 서고 점수 (날마다 조금씩 들쭉날쭉, 줄지는 않는다) */
export function villageScores(seed: number, day: number): number[] {
  const rates = villageRates(seed)
  return rates.map((r, i) => {
    const wob = mulberry32((seed + i * 977 + day * 31) >>> 0)() * 2
    return Math.max(0, Math.floor(r * day + wob))
  })
}

/** 우리 마을 서고 점수: 모은 말씀 조각 + 꽂은 권수×10 + 정성 필사×2 + 끝낸 부탁 필사×2 + 방명록 */
export function ourScore(s: Pick<GameState, 'collected' | 'shelved' | 'careDone' | 'flags'> & { guestbook?: unknown[] }): number {
  const shelved = Object.values(s.shelved).filter((g) => g !== undefined).length
  const reqs = Object.keys(s.flags).filter((k) => k.startsWith('req:')).length
  return s.collected.length + shelved * 10 + (s.careDone?.length ?? 0) * 2 + reqs * 2 + (s.guestbook?.length ?? 0)
}

export interface RankRow {
  name: string | null
  score: number
}

/** 순위표 (우리 마을은 name null). 같은 점수면 우리 마을이 먼저 */
export function rankTable(seed: number, day: number, mine: number): RankRow[] {
  const rows: RankRow[] = [{ name: null, score: mine }, ...villageScores(seed, day).map((score, i) => ({ name: VILLAGES[i], score }))]
  return rows.sort((a, b) => b.score - a.score || (a.name === null ? -1 : b.name === null ? 1 : 0))
}

// ── 소문 (R6) ──

/** 소문을 들려주는 이웃: 떠돌이 상인(장사)·편지 나르는 이웃(꼼꼼)·빵 굽는 이웃(수다)·물 긷는 아이(아이) */
export const RUMOR_SPEAKERS: readonly string[] = ['merchant', 'postman', 'baker', 'child']
export type RumorKind = 'behind' | 'farBehind' | 'ahead' | 'overtook'

/** 말 걸기 한 번에 소문이 나올 몫: 3%, 앞선 마을과 차이가 크면 최대 10% */
export function rumorChance(gap: number): number {
  return Math.min(0.1, 0.03 + Math.max(0, gap) / 400)
}

/** 오늘 이 이웃에게서 소문이 나오는가 (날·이웃 씨앗 — 같은 날 다시 말 걸어도 같은 판정) */
export function rumorNow(s: Pick<GameState, 'clock' | 'flags' | 'collected' | 'shelved' | 'careDone'>, npc: string, seed: number): { kind: RumorKind; village: string; n: number } | null {
  if (!RUMOR_SPEAKERS.includes(npc) || s.flags.rumorDay === s.clock.day) return null
  const mine = ourScore(s)
  const table = rankTable(seed, s.clock.day, mine)
  const top = table.find((r) => r.name !== null)!
  const gap = top.score - mine
  let h = (seed ^ (s.clock.day * 2654435761)) >>> 0
  for (const ch of npc) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0
  if (mulberry32(h)() >= rumorChance(gap)) return null
  // 우리가 맨 위면 '앞섬'(처음 한 번은 '역전'), 아니면 앞선 마을 이야기
  if (gap <= 0) {
    const second = table.find((r) => r.name !== null)!
    return { kind: s.flags.rumorOvertook ? 'ahead' : 'overtook', village: second.name!, n: booksOf(second.score) }
  }
  return { kind: gap > 60 ? 'farBehind' : 'behind', village: top.name!, n: booksOf(top.score) }
}

/** 점수로 어림한 꽂은 권수 (소문에서 "몇 권"으로만 말한다) */
export const booksOf = (score: number): number => Math.max(1, Math.min(27, Math.floor(score / 25)))
