// 가구 20종의 도트 그림 (16픽셀 = 한 칸). 가방 아이콘(8×8)은 같은 그림을 줄여서 만든다.
// 색은 마을 참고 그림의 차분한 톤에 맞춘다 (feedback-village-art-style).

export const FURNI_PALETTE: Record<string, string> = {
  k: '#6b5040', // 윤곽
  W: '#8e6a4d', // 짙은 나무
  w: '#ad845d', // 나무
  l: '#d0a579', // 밝은 나무
  c: '#f8e6c0', // 크림
  C: '#e5d3aa', // 짙은 크림
  r: '#d98a6a', // 테라코타
  R: '#b86e52',
  g: '#7b9a60', // 잎
  G: '#99b67b',
  y: '#f1bf6b', // 노랑
  Y: '#fce2a7',
  b: '#98c5bb', // 청록
  B: '#7aa89e',
  s: '#b3ada2', // 돌·쇠
  S: '#878176',
  p: '#e8a88a', // 살구
  o: '#f1b999',
  z: 'rgba(90,70,50,0.22)', // 그림자
}

export interface FurnitureArt {
  /** 칸 수 */
  w: number
  h: number
  rows: string[]
}

/** 줄 길이를 칸 폭에 맞춘다 (모자라면 빈칸, 넘치면 자른다) */
function art(w: number, h: number, rows: string[]): FurnitureArt {
  const W = w * 16
  const H = h * 16
  const out = rows.slice(0, H).map((r) => (r + '.'.repeat(W)).slice(0, W))
  // 그림을 칸 아래쪽에 붙인다 (모자란 줄은 위에 빈 줄로)
  return { w, h, rows: [...Array<string>(H - out.length).fill('.'.repeat(W)), ...out] }
}

function roundRug(): FurnitureArt {
  const rows: string[] = []
  for (let y = 0; y < 32; y++) {
    let row = ''
    for (let x = 0; x < 32; x++) {
      const dx = (x - 15.5) / 15
      const dy = (y - 15.5) / 13
      const d = Math.sqrt(dx * dx + dy * dy)
      row += d > 1 ? '.' : d > 0.88 ? 'R' : d > 0.72 ? 'r' : d > 0.6 ? 'c' : d > 0.42 ? 'r' : d > 0.3 ? 'o' : 'c'
    }
    rows.push(row)
  }
  return { w: 2, h: 2, rows }
}

function mat(): FurnitureArt {
  const rows: string[] = ['.'.repeat(32), '.'.repeat(32), '.'.repeat(32)]
  for (let y = 3; y < 14; y++) {
    let row = ''
    for (let x = 0; x < 32; x++) {
      if (x < 2 || x > 29) row += y % 2 ? 'C' : '.' // 술
      else if (y === 3 || y === 13) row += 'W'
      else if (x < 5 || x > 26) row += 'r'
      else row += (x + y) % 4 < 2 ? 'C' : 'c' // 엮은 무늬
    }
    rows.push(row)
  }
  return { w: 2, h: 1, rows: [...rows, '.'.repeat(32), '.'.repeat(32)] }
}

export const FURNITURE_ART: Record<string, FurnitureArt> = {
  // ── 길을 막는 큰 가구 ──
  // 옆에서 본 의자: 오른쪽을 본다 (등받이가 왼쪽). 왼쪽을 보게 하려면 뒤집어 그린다
  chair: art(1, 1, [
    '....kk..........',
    '....kwk.........',
    '....klk.........',
    '....kwk.........',
    '....klk.........',
    '....kwk.........',
    '....kwkkkkkkkk..',
    '....kwllllllllk.',
    '....kwwwwwwwwwk.',
    '....kkkkkkkkkkk.',
    '....kWk.....kWk.',
    '....kWk.....kWk.',
    '....kWk.....kWk.',
    '...zzzzzzzzzzzz.',
  ]),
  bookcase: art(1, 1, [
    '..kkkkkkkkkkkk..',
    '..kWWWWWWWWWWk..',
    '..kWrRbBgGyWWk..',
    '..kWrRbBgGyWWk..',
    '..kwwwwwwwwwwk..',
    '..kWYyWrrWbbWk..',
    '..kWYyWrrWbbWk..',
    '..kWYyWrrWbbWk..',
    '..kwwwwwwwwwwk..',
    '..kWggWcCWRrWk..',
    '..kWggWcCWRrWk..',
    '..kWggWcCWRrWk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '..zzzzzzzzzzzz..',
  ]),
  chest: art(1, 1, [
    '...kkkkkkkkkk...',
    '..kwwwwwwwwwwk..',
    '..kllllllllllk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkyykkkkk..',
    '..kwwwwyywwwwk..',
    '..kwWwwwwwwWwk..',
    '..kwWwwwwwwWwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '...zzzzzzzzzz...',
  ]),
  barrel: art(1, 1, [
    '....kkkkkkkk....',
    '...kllllllllk...',
    '...kWWWWWWWWk...',
    '..kwwwwwwwwwwk..',
    '..kSSSSSSSSSSk..',
    '..kwwlwwwwwwwk..',
    '..kwwlwwwwwwwk..',
    '..kwwlwwwwwwwk..',
    '..kSSSSSSSSSSk..',
    '..kwwwwwwwwwwk..',
    '...kWWWWWWWWk...',
    '....kkkkkkkk....',
    '...zzzzzzzzzz...',
  ]),
  wheel: art(1, 1, [
    '.....kkkkkk.....',
    '....kW....Wk....',
    '...kW.W..W.Wk...',
    '...k...kk...k...',
    '...kWWWkkWWWk...',
    '...k...kk...k...',
    '...kW.W..W.Wk...',
    '....kW....Wk....',
    '.....kkkkkk.....',
    '.......kk..cC...',
    '..kkkkkkkkkcCk..',
    '..kwwwwwwwwwwk..',
    '..kW........Wk..',
    '..kW........Wk..',
    '..zkzzzzzzzzkz..',
  ]),
  lectern: art(1, 1, [
    '..kkkkkkkkkkkk..',
    '..kccccckcccck..',
    '..kcCCCckcCCck..',
    '..kcccccckccck..',
    '...kkkkkkkkkk...',
    '......kwwk......',
    '......kwlk......',
    '......kwwk......',
    '......kwlk......',
    '......kwwk......',
    '....kkkkkkkk....',
    '....kWWWWWWk....',
    '....zzzzzzzz....',
  ]),
  lampStand: art(1, 1, [
    '.......y........',
    '......yYy.......',
    '.......y........',
    '.....kkkkk......',
    '.....kwwwk......',
    '......kWk.......',
    '......kwk.......',
    '......kWk.......',
    '......kwk.......',
    '......kWk.......',
    '......kwk.......',
    '......kWk.......',
    '....kkkkkkk.....',
    '....kWWWWWk.....',
    '....zzzzzzz.....',
  ]),
  bigPlant: art(1, 1, [
    '.....g..G.......',
    '...gGg.gGg.g....',
    '..gGGggGGgGg....',
    '.gGgggGgggGGg...',
    '..ggGgggGgGgg...',
    '...gggGggggg....',
    '....gggggg......',
    '......kk........',
    '....kkkkkkk.....',
    '....kRrrrRk.....',
    '....krRRRrk.....',
    '....kRrrrRk.....',
    '.....kRRRk......',
    '.....kkkkk......',
    '....zzzzzzz.....',
  ]),
  longBench: art(2, 1, [
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..kllllllllllllllllllllllllllk..',
    '..kwwwwwwwwwwwwwwwwwwwwwwwwwwk..',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '...kWk....................kWk...',
    '...kWk....................kWk...',
    '...kWk....................kWk...',
    '...kWk....................kWk...',
    '..zzzzz..................zzzzz..',
  ]),
  daybed: art(2, 1, [
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..kYYYYYYkbbbbbbbbbbbbbbbbbbbk..',
    '..kYyyyyYkbBbbbbbbbbbbbbbbbBbk..',
    '..kYYYYYYkbbbbbbbbbbbbbbbbbbbk..',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..kllllllllllllllllllllllllllk..',
    '..kwwwwwwwwwwwwwwwwwwwwwwwwwwk..',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..kWk......................kWk..',
    '..kWk......................kWk..',
    '..zzz......................zzz..',
  ]),
  cupboard: art(2, 1, [
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..kWWWWWWWWWWWWWWWWWWWWWWWWWWk..',
    '..kWcWbWcWbWcWkWyWYWyWYWyWYWWk..',
    '..kWcWbWcWbWcWkWyWYWyWYWyWYWWk..',
    '..kwwwwwwwwwwwwwwwwwwwwwwwwwwk..',
    '..kwwwwwwwwwwwkwwwwwwwwwwwwwwk..',
    '..kwllllllllwwkwwllllllllllwwk..',
    '..kwlwwwyywlwwkwwlwwwyywwwlwwk..',
    '..kwlwwwwwwlwwkwwlwwwwwwwwlwwk..',
    '..kwllllllllwwkwwllllllllllwwk..',
    '..kwwwwwwwwwwwkwwwwwwwwwwwwwwk..',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..zzzzzzzzzzzzzzzzzzzzzzzzzzzz..',
  ]),
  // ── 바닥에 까는 것 ──
  roundRug: roundRug(),
  mat: mat(),
  pillows: art(1, 1, [
    '....kkkkkk......',
    '...kooooook.....',
    '...koppppok.....',
    '...kooooookkk...',
    '....kkkkkkbbbk..',
    '.....kbbbbbBbk..',
    '.....kbBBBBBbk..',
    '.....kbbbbbbbk..',
    '......kkkkkkk...',
    '......zzzzzzz...',
  ]),
  // ── 탁자 위에 올리는 작은 것 ──
  teapot: art(1, 1, [
    '.......kk.......',
    '......kbbk......',
    '....kkkkkkkk....',
    '...kbbbbbbbbk.k.',
    '.kkkbbBbbbbbkkbk',
    '.k..kbbbbbbbk.bk',
    '.kkkkbbbbbbbkkk.',
    '.....kbbbbbk....',
    '......kkkkk.....',
    '.....zzzzzzz....',
  ]),
  fruitBowl: art(1, 1, [
    '.....o.g.y......',
    '....yoyrgoy.....',
    '...ryggoyrro....',
    '..kkkkkkkkkkk...',
    '..kccccccccck...',
    '...kCCCCCCCk....',
    '....kkkkkkk.....',
    '.....zzzzz......',
  ]),
  scrolls: art(1, 1, [
    '....kkkkkk......',
    '...kcCccCck.....',
    '...kkkkkkkkk....',
    '..kcCccCccCck...',
    '..kkkkkkkkkkkk..',
    '.kcCccCccCccCck.',
    '.kkkkkkkkkkkkkk.',
    '..zzzzzzzzzzzz..',
  ]),
  inkpot: art(1, 1, [
    '.........l......',
    '........l.......',
    '.......l........',
    '.....kkkkk......',
    '.....kSSSk......',
    '....kkkkkkk.....',
    '...kSSSSSSSk....',
    '...kSkkkkkSk....',
    '...kSSSSSSSk....',
    '....kkkkkkk.....',
    '....zzzzzzz.....',
  ]),
  dryFlowers: art(1, 1, [
    '......y.o.......',
    '.....yY.op.y....',
    '......l.l.lY....',
    '.......lll......',
    '........l.......',
    '......kkkk......',
    '.....kCccCk.....',
    '.....kccccck....',
    '.....kCccCk.....',
    '......kkkk......',
    '......zzzz......',
  ]),
  hourglass: art(1, 1, [
    '.....kkkkkk.....',
    '.....kWWWWk.....',
    '......kYYk......',
    '......kyYk......',
    '.......kk.......',
    '......k.yk......',
    '......kyyk......',
    '.....kWWWWk.....',
    '.....kkkkkk.....',
    '.....zzzzzz.....',
  ]),
}

/** 가구 그림 글자 → 가방 아이콘 팔레트(ICON_PALETTE)에 더한 글자 */
export const ICON_CHAR: Record<string, string> = {
  k: 'E', W: 'H', w: 'I', l: 'J', c: 'K', C: 'L', r: 'M', R: 'Q', g: 'T', G: 'U',
  y: 'V', Y: 'X', b: 'Z', B: 'a', s: 'e', S: 'h', p: 'i', o: 'j',
}

/** 그림을 8×8 아이콘으로 줄인다: 칸마다 가장 많이 쓴 색 (그림자·빈칸 제외) */
export function iconFromArt(a: FurnitureArt): string[] {
  const W = a.w * 16
  const H = a.h * 16
  const size = Math.max(W, H)
  const ox = (size - W) / 2
  const oy = (size - H) / 2
  const step = size / 8
  const out: string[] = []
  for (let y = 0; y < 8; y++) {
    let row = ''
    for (let x = 0; x < 8; x++) {
      const count: Record<string, number> = {}
      for (let dy = 0; dy < step; dy++)
        for (let dx = 0; dx < step; dx++) {
          const ch = a.rows[Math.floor(y * step + dy - oy)]?.[Math.floor(x * step + dx - ox)]
          if (ch && ch !== '.' && ch !== 'z') count[ch] = (count[ch] ?? 0) + 1
        }
      const best = Object.entries(count).sort((p, q) => q[1] - p[1])[0]
      // 칸의 4분의 1도 안 차면 비워 둔다 (가장자리가 뭉개지지 않게)
      row += best && best[1] * 4 >= step * step ? ICON_CHAR[best[0]] : '.'
    }
    out.push(row)
  }
  return out
}
