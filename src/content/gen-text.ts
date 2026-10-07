// 계획 20 2부: 주민 가족 소식 글 — 수첩 '마을' 칸과 아침 소식이 함께 쓴다.
// 만난 사람만 이름으로, 아직 모르는 사람은 '?'.
import { neighborById } from './catalog'
import { fill, T, withAnd, withSubject } from './text'
import type { GenLog } from '../engine/gen'
import type { GameState } from '../engine/game'
import { NO_NOTEBOOK } from '../engine/notebook'
import { t } from '../shared/i18n'

/** 계보 id의 화면 이름: 고정 주민은 만났을 때만, 태어난 아이는 부모를 만났으면 */
export function personName(game: Pick<GameState, 'notebook' | 'gen'>, id: string): string {
  const met = (game.notebook ?? NO_NOTEBOOK).met
  const p = game.gen?.persons[id]
  if (p?.origin === 'born') return p.parents.some((q) => met.includes(q)) ? p.name ?? t('gen.baby') : t('gen.unknown')
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
export function freshNews(game: Pick<GameState, 'notebook' | 'gen'>, sinceDay: number): string[] {
  const g = game.gen
  if (!g) return []
  return g.log.filter((l) => l.day > sinceDay).map((l) => newsLine(game, l)).filter((x): x is string => !!x).slice(-3)
}
