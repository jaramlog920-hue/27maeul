import raw from '../content/piece-migration-v2.json'
import type { GameState } from './game'
import type { GameContent } from './types'
const ids = raw as Record<string, string[]>

/** 구분이 합쳐지거나 나뉘어도 예전에 받은 본문을 포함하는 새 조각을 모두 남긴다. 한 번만 변환한다. */
export function migratePieceLayout(s: GameState, content: GameContent): GameState {
  if (s.pieceLayout === 2 || !content.pieces.some(p => p.source)) return s
  const map = (id: string) => ids[id] ?? [id]
  const list = (v: string[] | undefined) => [...new Set((v ?? []).flatMap(map))]
  const pieceLog: GameState['pieceLog'] = {}
  for (const [id, got] of Object.entries(s.pieceLog ?? {})) for (const next of map(id)) {
    if (!pieceLog[next] || got.day < pieceLog[next].day) pieceLog[next] = got
  }
  const myLines: Record<string, string> = {}
  for (const [id, line] of Object.entries(s.myLines ?? {})) for (const next of map(id)) {
    const existing = myLines[next]
    myLines[next] = existing && existing !== line ? existing + '\n' + line : line
  }
  const progress = Object.fromEntries(Object.entries(s.progress).map(([book, p]) => [book, {
    ...p, arrangement: Object.fromEntries(Object.entries(p.arrangement ?? {}).map(([chapter, ordered]) => [chapter, list(ordered)])),
  }])) as GameState['progress']
  return { ...s, pieceLayout: 2, collected: list(s.collected), todayHeard: list(s.todayHeard), post: list(s.post),
    rereads: list(s.rereads),
    ...(s.notebook ? { notebook: { ...s.notebook, heard: Object.fromEntries(Object.entries(s.notebook.heard).map(([who, heard]) => [who, list(heard)])) } } : {}),
    offers: Object.fromEntries(Object.entries(s.offers ?? {}).map(([who, id]) => [who, map(id)[0]])), pieceLog, myLines, progress }
}
