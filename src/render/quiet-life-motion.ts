import { mirror, SHEEP, spriteRows, type SpriteOpts, type Who } from './sprites'

export const QUIET_ACTIONS = ['yawn', 'wrist', 'stretch', 'hum', 'wave'] as const
export type QuietAction = typeof QUIET_ACTIONS[number]
export const QUIET_LABELS: Record<QuietAction, string> = {
  yawn: '입 가리고 하품', wrist: '손목 풀기', stretch: '기지개', hum: '흥얼거리기', wave: '손 흔들기',
}

/** 앞모습의 작은 몸짓. 옷·머리·손 색은 현재 인물의 도트를 그대로 쓴다. */
export function quietLifeRows(who: Who, action: QuietAction, frame: number, opts: SpriteOpts): string[] {
  const phase = ((Math.trunc(frame) % 4) + 4) % 4
  const active = phase === 1 || phase === 2
  const rows = spriteRows(who, 'down', {
    ...opts, frame: 0, pose: 'stand', blink: opts.blink || (action === 'yawn' && active),
  }).map(row => [...row])
  const put = (x: number, y: number, color: string) => {
    if (y < rows.length - 1 && rows[y]?.[x] !== undefined) rows[y][x] = color
  }
  const handY = Math.min(10, rows.length - 2)
  const hand = (x: number, y: number) => {
    put(x, y, opts.inky ? 'K' : 's')
    put(x, y + 1, '5')
  }
  const lift = (right: boolean, x: number, y: number) => {
    const hx = right ? 8 : 1, edge = right ? 9 : 0
    const sleeve = rows[8][hx]
    for (let yy = 9; yy <= handY + 1; yy++) {
      put(hx, yy, '.'); put(edge, yy, '.')
    }
    put(hx, 8, sleeve)
    put(x, y + 2, sleeve)
    hand(x, y)
  }
  if (action === 'yawn' && phase > 0) {
    if (active) { put(4, 6, 'k'); put(5, 6, 'k') }
    lift(true, active ? 6 : 7, active ? 6 : 8)
  }
  if (action === 'wrist') {
    lift(false, 3, 9)
    lift(true, phase % 2 ? 5 : 6, phase === 2 ? 8 : 9)
  }
  if (action === 'stretch' && phase > 0) {
    lift(false, 0, active ? 5 : 7)
    lift(true, 9, active ? 5 : 7)
  }
  if (action === 'wave' && phase < 3) lift(true, phase === 1 ? 8 : 9, phase === 1 ? 5 : 6)
  if (action === 'hum' && active) {
    put(4, 6, 'k')
    if (phase === 2) put(5, 6, 'k')
  }
  return rows.map(row => row.join(''))
}

/** 양의 발을 번갈아 내딛고, 쉬는 박자에는 풀 쪽으로 고개를 숙인다. */
export function sheepLifeRows(side: 'left' | 'right', action: 'walk' | 'graze', frame: number): string[] {
  const phase = ((Math.trunc(frame) % 4) + 4) % 4
  const rows = [...SHEEP]
  if (action === 'walk') rows[4] = phase % 2 ? '..k.k.k.' : '.k.k.k..'
  else if (phase === 1 || phase === 2) {
    rows[1] = 'wwwwww..'
    rows[2] = 'wWwwwwkk'
    rows[3] = '.wwwwwks'
    if (phase === 2) rows[4] = '.k.k.k.s'
  }
  return side === 'left' ? mirror(rows) : rows
}
