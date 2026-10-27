// 계획 20 2부: 주민 가족 소식 글 — 수첩 '마을' 칸과 아침 소식이 함께 쓴다.
// 만난 사람만 이름으로, 아직 모르는 사람은 '?'.
import { neighborById } from './catalog'
import { fill, T, withAnd, withSubject } from './text'
import { BAKER_BABY_ID, canPair, type GenLog } from '../engine/gen'
import type { GameState } from '../engine/game'
import { NO_NOTEBOOK } from '../engine/notebook'
import { t } from '../shared/i18n'

/** 계보 id의 화면 이름: 고정 주민은 만났을 때만, 태어난 아이는 부모를 만났으면 */
export function personName(game: Pick<GameState, 'notebook' | 'gen'>, id: string): string {
  const met = (game.notebook ?? NO_NOTEBOOK).met
  const p = game.gen?.persons[id]
  if (id === BAKER_BABY_ID && p) return met.includes('baker') || met.includes('wendell')
    ? p.name ?? (p.stage === 'baby' ? t('gen.baby') : t('gen.bakerChild')) : t('gen.unknown')
  // 손주(부모가 태어난 주민)는 부모를 거슬러 올라가 아는 이웃이 있으면 (2026-10-21 셋째 대)
  const knownLine = (q: string, depth: number): boolean => met.includes(q) || (depth > 0 && game.gen?.persons[q]?.origin === 'born' && game.gen.persons[q].parents.some((r) => knownLine(r, depth - 1)))
  if (p?.origin === 'born') return p.parents.some((q) => knownLine(q, 3)) ? p.name ?? t('gen.baby') : t('gen.unknown')
  return met.includes(id) ? neighborById(id)?.role ?? t('gen.unknown') : t('gen.unknown')
}

/** 소식 한 줄 (글이 없는 종류는 null) */
export function newsLine(game: Pick<GameState, 'notebook' | 'gen'>, l: GenLog): string | null {
  const tpl = (T.gen.news as Record<string, string>)[l.kind]
  if (!tpl) return null
  const [a, b, child] = l.who
  const an = personName(game, a), bn = personName(game, b)
  return fill(tpl, { a: an, aAnd: withAnd(an), aSubj: withSubject(an), bSubj: withSubject(bn), b: bn, child: child ? personName(game, child) : '' })
}

/** 아침에 보여 줄 새 소식 (sinceDay 뒤의 것, 많아야 3건 — P13) */
export function freshNews(game: Pick<GameState, 'notebook' | 'gen'> & Partial<Pick<GameState, 'romance'>>, sinceDay: number): string[] {
  const g = game.gen
  if (!g) return []
  // 아침 알림에는 아는 사람 이야기만 (2026-10-14 사용자: '?가 ? 곁에서…'로 떴다) — 수첩 마을 칸에는 그대로 남는다
  const unknown = t('gen.unknown')
  const known = (l: GenLog) => l.who.slice(0, 2).every((id) => !id || personName(game, id) !== unknown)
  const fresh = g.log.filter((l) => l.day > sinceDay && known(l))
  // 큰 소식(연인·결혼·출생…)을 앞에, '요즘 자주 어울려요'는 짝이 될 수 있는 쌍만 하루 한 줄 — 날마다 가득 차 큰 소식이 묻혔다 (2026-10-27 플레이 점검)
  const big = fresh.filter((l) => l.kind !== 'friend')
  const friend = fresh.filter((l) => l.kind === 'friend' && canPair(g, game.romance?.partner, l.who[0], l.who[1])).slice(-1)
  return [...big, ...friend].map((l) => newsLine(game, l)).filter((x): x is string => !!x).slice(0, 3)
}
