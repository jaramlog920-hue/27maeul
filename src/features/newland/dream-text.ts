import { T } from '../../content/text'
import { DREAMER } from '../../engine/newland-life'
const L = T.newlandLife

/** 꿈마다의 문구 (페넬로피는 예전 L.dream, 틸리부터 L.dreams.<npc>) */
type DreamText = typeof L.dream
export const dreamText = (npc: string): DreamText => (npc === DREAMER ? L.dream : ((L.dreams as Record<string, Partial<DreamText>>)[npc] as DreamText) ?? L.dream)

