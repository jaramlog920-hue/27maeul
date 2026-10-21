import { T } from '../../content/text'
import { DREAMER } from '../../engine/newland-life'
import { slotJob } from '../../engine/kid-work'
import DREAM_LINES from '../../content/dream-lines.json'
const L = T.newlandLife

/** 꿈마다의 문구 (페넬로피는 예전 L.dream, 틸리부터 L.dreams.<npc>) */
type DreamText = typeof L.dream
export const dreamText = (npc: string): DreamText => {
  if (npc === DREAMER) return L.dream
  const own = (L.dreams as Record<string, Partial<DreamText>>)[npc] as DreamText | undefined
  if (own) return own
  // 따로 쓴 꿈이 없는 이웃 (2026-10-21): 그 이웃만의 꿈 이야기(dream-lines.json) + 꿈터 짓는 곳 안내, 없으면 일로 한 줄
  const J = L.dreamJob as Record<string, string>
  const mine = npcDream(npc)
  if (mine) return { ...L.dream, heard: `${mine.heard} ${J.heardTail}` }
  const job = slotJob(npc)
  return { ...L.dream, heard: job && J[job] ? `${J[job]} ${J.heardTail}` : L.dream.heard }
}

/** 이웃만의 꿈 (꿈 이야기·문 연 날·꿈터에서 하는 말 넷) — 페넬로피·틸리는 따로 쓴 꿈이 있어 없다 */
export function npcDream(npc: string): { heard: string; open: string; lines: string[] } | null {
  return (DREAM_LINES as Record<string, { heard: string; open: string; lines: string[] }>)[npc] ?? null
}

