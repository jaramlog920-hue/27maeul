import type { Facing } from '../engine/types'

type Kind = 'cat' | 'dog'
// Keep the animation canvas and ground anchor, but give pets a much smaller
// silhouette than the 14-pixel-tall villagers. Preserve facial dots explicitly.
export function compactPetRows(kind: Kind, rows: string[]): string[] {
  const size = kind === 'dog' ? 12 : 11
  const offsetX = Math.floor((16 - size) / 2), offsetY = 16 - size
  const out = Array.from({length:16},()=>Array<string>(16).fill('.'))
  for(let y=0;y<size;y++) for(let x=0;x<size;x++)
    out[offsetY+y][offsetX+x] = rows[Math.floor((y+.5)*16/size)]?.[Math.floor((x+.5)*16/size)] ?? '.'
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='e'||c==='n') out[offsetY+Math.floor(y*size/16)][offsetX+Math.floor(x*size/16)] = c
  }))
  return out.map(row=>row.join(''))
}

export function petStillRows(kind: Kind, form: 'adult'|'baby'|'curl'): string[] {
  const rows = [...PET_SIDE[kind][form]]
  return compactPetRows(kind, tile(rows, Math.floor((16-rows[0].length)/2), 14-rows.length))
}
function tile(rows: string[], x: number, y: number): string[] {
  const result = Array<string>(16).fill('.'.repeat(16))
  rows.forEach((row, dy) => { result[y + dy] = '.'.repeat(x) + row.padEnd(16 - x, '.') })
  return result
}

// Left-facing portraits: pointed ears and a tall thin tail versus floppy ears,
// a projecting cream muzzle and a broader, lower body.
export const PET_SIDE = {
  cat: {
    adult: ['..A...A.......', '..Aa.Aa......A', '..AaaaA.....aA', 'nwaeaaA.....aA', '.AwwaaA.....aA', '...AaaaaaaaAa.', '...AawaaaaaA..', '....AaAaaAaA..', '....wA...wA...'],
    baby: ['.A..A......', '.AaAa.....A', '.AaaaA...aA', 'nwaeaA...aA', '.AwwaaaaaA.', '..AwaaaaA..', '..wA..wA...'],
    curl: ['..A..A.......', '.AaaaaA......', 'nwaeaaAAAA...', '.AwwaaaaaaA..', '..AaaaaaaAaA.', '...AAAAAAaaA.', '......AAAAA..'],
  },
  dog: {
    adult: ['...AAAA.......', '..AaaaaA......', '..AeaaaAA.....', 'AAwwaAAAaA....', 'nwwwwAAaaA...A', '.AAAAAAaaaAAAa', '....AawaaaaaaA', '....AwwaaaaaaA', '....AwAAaaAwA.', '....wA....wA..'],
    baby: ['..AAAA.....', '.AeaaaA....', 'AwwaAAaA...', 'nwwwAAaaAAA', '.AAAAwaaaaA', '...AwwaaaA.', '...wA..wA..'],
    curl: ['...AAAA......', '..AeaaaA.....', '.nwwwAAaAAA..', '..AAAAwaaaaA.', '...AwwaaaaaA.', '....AAAAAAA..'],
  },
} as const

const PORTRAITS = {
  cat: {
    adult: {
      down: tile(['.A....A.', 'AaA..AaA', 'AaaaaaaA', 'AaeaaeaA', '.AannaA.', '..AwwA..', '..AaaA..', '..AwwA..', '..AwwA..', '..AaaA..', '.AwAAwA.'], 4, 2),
      up: tile(['.A....A.', 'AaA..AaA', 'AaaaaaaA', 'AaaaaaaA', '.AaaaaA.', '..AaaA..', '..AaaA..', '..AaaA..', '..AaaA..', '..AaaA..', '.AaAAaA.'], 4, 2),
    },
    baby: {
      down: tile(['.A...A.', 'AaA.AaA', 'AaaaaaA', 'AeaaeaA', '.AnnwA.', '..AwwA.', '..AaaA.', '.AwAwA.'], 4, 5),
      up: tile(['.A...A.', 'AaA.AaA', 'AaaaaaA', 'AaaaaaA', '.AaaaA.', '..AaaA.', '..AaaA.', '.AaAaA.'], 4, 5),
    },
  },
  dog: {
    adult: {
      down: tile(['..AAAAAA..', '.AaaaaaaA.', 'AaAaaaaAaA', 'AaAeaaeAaA', 'AaAwwwwAaA', '.AAwnnwAA.', '..AwwwwA..', '..AwwwwA..', '..AwaawA..', '..AaaaaA..', '..AwAAwA..'], 3, 2),
      up: tile(['..AAAAAA..', '.AaaaaaaA.', 'AaAaaaaAaA', 'AaAaaaaAaA', 'AaAaaaaAaA', '.AAaaaaAA.', '..AaaaaA..', '..AaaaaA..', '..AaaaaA..', '..AaaaaA..', '..AaAAaA..'], 3, 2),
    },
    baby: {
      down: tile(['.AAAAAA.', 'AaaaaaaA', 'AAeaaeAA', 'AAwwwwAA', '.AwnnwA.', '..AwwA..', '..AaaA..', '.AwAAwA.'], 4, 5),
      up: tile(['.AAAAAA.', 'AaaaaaaA', 'AAaaaaAA', 'AAaaaaAA', '.AaaaaA.', '..AaaA..', '..AaaA..', '.AaAAaA.'], 4, 5),
    },
  },
}

export const PET_ACTIONS = ['walk', 'wait', 'sniff', 'play', 'fetch', 'wag'] as const

export function petMotionRows(kind: Kind, facing: Facing, action: typeof PET_ACTIONS[number], frame: number, baby = false): string[] {
  const f = ((frame % 4) + 4) % 4, side = facing === 'left' || facing === 'right'
  const form = baby ? 'baby' : 'adult'
  const left = tile([...PET_SIDE[kind][form]], kind === 'cat' ? 1 : 0, baby ? 6 : kind === 'cat' ? 4 : 3)
  const source = side ? (facing === 'right' ? left.map(row => [...row].reverse().join('')) : left) : PORTRAITS[kind][form][facing]
  // Feet stay planted in the sprite while its world position follows the player.
  // A one-pixel head/body breath and a blink keep it from looking like a toy.
  if (baby && action === 'walk') {
    const rows = [...source]
    if (f === 2) {
      for (let y = 0; y < 10; y++) rows[y] = source[y + 1]
      rows[10] = source[11]
    }
    if (f === 3) for (let y = 0; y < 11; y++) rows[y] = rows[y].replaceAll('e', 'A')
    const compact = compactPetRows(kind, rows), planted = compactPetRows(kind, source)
    for(let y=13;y<16;y++) compact[y] = planted[y]
    return compact
  }
  const p = source.map(row => [...row])
  const put = (x: number, y: number, color: string) => { if (x >= 0 && x < 16 && y >= 0 && y < 16) p[y][x] = color }

  // Tail stays attached to the rump. Cat tails rise high; dog tails are short.
  const tail = (phase: number) => {
    if (side) {
      const edge = kind === 'cat' ? (baby ? 10 : 12) : (baby ? 10 : 13)
      const start = kind === 'cat' ? (baby ? 7 : 5) : (baby ? 8 : 6)
      const end = kind === 'cat' ? (baby ? 10 : 10) : (baby ? 10 : 9)
      for (let y = start; y < end; y++) for (let x = edge; x < 16; x++) put(facing === 'right' ? 15 - x : x, y, '.')
      const x = baby ? 11 : kind === 'cat' ? 13 : 14
      const ys = kind === 'cat' ? (baby ? [7, 8, 9, 10] : [5, 6, 7, 8, 9]) : (baby ? [9, 10] : [7, 8])
      for (const y of ys) put(facing === 'right' ? 15 - x : x, y + phase, y === ys[0] ? 'A' : 'a')
    } else {
      const x = kind === 'cat' ? 11 : 12, start = kind === 'cat' ? (baby ? 8 : 7) : 10
      for (let y = start; y < 12; y++) put(x + phase, y, y === start ? 'A' : 'a')
      for (let cx = kind === 'cat' ? 10 : 11; cx < x + phase; cx++) put(cx, 11, 'a')
      if (facing === 'up') { put(8 + phase, 11, 'A'); put(8 + phase, 12, 'a') }
    }
  }

  if (action === 'sniff' || action === 'play') {
    const lowered = f % 2, headBottom = baby ? 10 : 7
    if (lowered) {
      const old = p.map(row => [...row])
      for (let y = headBottom; y >= 1; y--) for (let x = 0; x < 16; x++) {
        const inHead = !side || (facing === 'left' ? x < 8 : x > 7)
        if (inHead) { p[y + 1][x] = old[y][x]; p[y][x] = '.' }
      }
    }
  }
  if (action === 'walk') {
    const feetY = 12, feet = side ? (baby ? [3, 7] : [5, 10]) : [6, 9]
    for (let y = feetY; y < 14; y++) for (let x = 0; x < 16; x++) p[y][x] = '.'
    feet.forEach((x, i) => {
      const px = side && facing === 'right' ? 15 - x : x, lift = (f + i) % 2
      put(px, feetY, 'a'); put(px + (side ? lift : 0), feetY + 1 - lift, 'w')
    })
  }
  tail(action === 'wag' || action === 'fetch' || action === 'walk' ? f % 2 : 0)
  if (action === 'wait' && f === 2) {
    for (const row of p) for (let x = 0; x < 16; x++) if (row[x] === 'e') row[x] = 'A'
    if (facing === 'up') put(5, baby ? 5 : 2, 'a')
  }
  if (action === 'play') { put(3 + f, 14, 'n'); put(4 + f, 14, 'w'); put(4 + f, 15, 'A') }
  if (action === 'fetch') {
    const x = facing === 'left' ? 0 : facing === 'right' ? 12 : facing === 'up' ? 11 : 6
    const y = facing === 'up' ? 5 : baby ? 10 : 8
    for (const [dx, dy] of [[0, 0], [0, 1], [1, 1], [2, 1], [3, 0], [3, 1]]) put(x + dx, y + dy, 'w')
  }
  if(f===3 && (action==='fetch'||action==='wag'))
    for(const row of p) for(let x=0;x<16;x++) if(row[x]==='e') row[x]='A'
  const compact = compactPetRows(kind, p.map(row => row.join('')))
  if(facing==='up' && f===2 && action==='wait')
    compact[10]=compact[10].slice(0,8)+'A'+compact[10].slice(9)
  // A back-facing animal has no eyes to blink; retain a visible tail-tip beat
  // when a one-pixel tail change would otherwise vanish during compaction.
  if(facing==='up' && f===3 && (action==='fetch'||action==='wag')) {
    const y=12,x=kind==='cat'?10:11
    compact[y]=compact[y].slice(0,x)+'A'+compact[y].slice(x+1)
  }
  return compact
}
