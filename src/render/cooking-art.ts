import type { Facing } from '../engine/types'
import type { FurnitureArt } from './furniture-art'
import { furnitureUseFrame } from './furniture-use-motion'
import type { SpriteOpts, Who } from './sprites'

// Native pixels, furniture palette, separate character/utensil layers.
type Rect = [string, number, number, number, number]
function picture(rects: Rect[], w = 16, h = 16): string[] {
  const grid = Array.from({ length: h }, () => Array<string>(w).fill('.'))
  for (const [c, x, y, rw, rh] of rects) for (let dy = 0; dy < rh; dy++) for (let dx = 0; dx < rw; dx++) {
    if (x + dx >= 0 && x + dx < w && y + dy >= 0 && y + dy < h) grid[y + dy][x + dx] = c
  }
  return grid.map(r => r.join(''))
}
const plate: Rect[] = [['B', 2, 10, 12, 3], ['c', 3, 9, 10, 3], ['C', 4, 12, 8, 1]]
const bowl: Rect[] = [['B', 3, 8, 10, 4], ['b', 4, 9, 8, 3], ['C', 4, 7, 8, 2], ['B', 5, 12, 6, 1]]
const pot: Rect[] = [['S', 3, 7, 10, 6], ['s', 4, 8, 8, 4], ['S', 1, 8, 2, 2], ['S', 13, 8, 2, 2], ['W', 4, 6, 8, 2]]
const bread: Rect[] = [['W', 4, 6, 8, 5], ['l', 4, 5, 8, 5], ['y', 5, 5, 6, 2], ['C', 6, 6, 1, 2], ['C', 9, 6, 1, 2]]
const beans: Rect[] = [['r', 5, 7, 2, 2], ['R', 8, 7, 2, 2], ['r', 10, 8, 2, 2], ['p', 6, 9, 2, 1]]
const herbs: Rect[] = [['g', 6, 5, 1, 4], ['G', 4, 5, 3, 2], ['g', 7, 7, 4, 1], ['G', 9, 6, 2, 1]]
const steam: Rect[] = [['C', 5, 3, 1, 2], ['c', 6, 1, 1, 2], ['C', 10, 2, 1, 2], ['c', 9, 0, 1, 2]]
export const COOKING_PROPS: Record<string, FurnitureArt> = {}
export const COOKING_LABELS: Record<string, string> = {}
function add(id: string, label: string, rects: Rect[]) {
  COOKING_PROPS[id] = { w: 1, h: 1, rows: picture(rects) }
  COOKING_LABELS[id] = label
}
add('barleyBowl', '보리 재료', [...bowl, ['y', 5, 6, 6, 3], ['W', 6, 7, 1, 1], ['W', 9, 8, 1, 1]])
add('waterJug', '물 항아리', [['W', 5, 3, 6, 2], ['r', 4, 5, 8, 8], ['p', 5, 6, 2, 5], ['B', 6, 3, 4, 1]])
add('beanRaw', '콩 재료', [...bowl, ...beans])
add('beanWashed', '씻은 콩', [...bowl, ...beans, ['b', 4, 6, 2, 1], ['b', 10, 5, 1, 2]])
add('herbRaw', '허브 재료', [['w', 3, 11, 10, 2], ...herbs])
add('herbChopped', '손질한 허브', [['w', 2, 6, 12, 7], ['l', 3, 7, 10, 5], ['g', 4, 8, 2, 1], ['G', 7, 9, 2, 1], ['g', 10, 8, 1, 2]])
add('figRaw', '무화과 재료', [...plate, ['v', 4, 6, 4, 4], ['V', 9, 5, 3, 5], ['g', 6, 5, 1, 2]])
add('figCut', '자른 무화과', [...plate, ['v', 4, 6, 4, 4], ['p', 5, 6, 2, 3], ['V', 9, 6, 3, 4], ['y', 10, 7, 1, 2]])
add('honeyJar', '꿀 단지', [['W', 5, 3, 6, 2], ['C', 4, 5, 8, 8], ['y', 5, 7, 6, 5], ['c', 5, 5, 2, 6]])
add('oliveSide', '올리브 곁들임 · 추후 메뉴용', [...plate, ['g', 4, 7, 3, 3], ['G', 8, 6, 3, 3], ['g', 10, 8, 2, 2]])
add('mixingBowl', '반죽 그릇', [...bowl, ['Y', 5, 6, 6, 3], ['c', 6, 5, 4, 2]])
add('doughUnshaped', '성형 전 반죽', [['w', 2, 12, 12, 1], ['C', 4, 8, 8, 4], ['c', 5, 7, 6, 3]])
add('doughLong', '길쭉한 반죽', [['w', 2, 12, 12, 1], ['C', 3, 9, 10, 3], ['c', 4, 8, 8, 2]])
add('doughRound', '둥근 반죽', [['w', 2, 12, 12, 1], ['C', 4, 8, 8, 4], ['c', 5, 6, 6, 5]])
add('breadLong', '길쭉한 빵', [...plate, ...bread])
add('breadRound', '둥근 빵', [...plate, ['W', 4, 6, 8, 5], ['l', 4, 5, 8, 5], ['y', 5, 4, 6, 4], ['C', 7, 5, 2, 4], ['C', 5, 6, 6, 1]])
add('breadEdge', '가장자리 무늬 빵', [...plate, ...bread, ['W', 5, 9, 1, 1], ['W', 7, 9, 1, 1], ['W', 9, 9, 1, 1], ['W', 11, 9, 1, 1]])
add('breadScored', '표면 무늬 빵', [...plate, ...bread, ['W', 5, 6, 2, 1], ['W', 8, 7, 2, 1], ['W', 10, 6, 2, 1]])
add('breadHot', '갓 구운 빵', [...plate, ...bread, ...steam])
add('honeyBreadPrep', '꿀빵 준비', [...plate, ...bread, ['W', 10, 2, 1, 4], ['y', 9, 3, 3, 2]])
add('honeyBread', '꿀 곁들인 빵', [...plate, ...bread, ['y', 5, 7, 6, 1], ['y', 7, 8, 1, 2]])
add('figPlate', '무화과 간식 접시', [...plate, ['v', 4, 6, 4, 4], ['p', 5, 6, 2, 3], ['V', 9, 6, 3, 4], ['g', 8, 5, 2, 2]])
add('beanPotRaw', '콩 조리 전 냄비', [...pot, ...beans])
add('beanPotCooking', '끓는 콩 냄비', [...pot, ['r', 4, 6, 8, 2], ...beans, ...steam])
add('beanPotReady', '완성된 콩 냄비', [...pot, ['r', 4, 6, 8, 2], ['y', 5, 6, 1, 1], ['y', 9, 7, 1, 1]])
add('beanBowl', '콩 요리 한 그릇', [...bowl, ['r', 4, 7, 8, 2], ...beans])
add('herbBeanPrep', '허브 콩 요리 준비', [...pot, ...beans, ...herbs])
add('herbBeanPot', '허브 콩 요리 냄비', [...pot, ['r', 4, 6, 8, 2], ...herbs, ...steam])
add('herbBeanBowl', '허브 콩 요리 한 그릇', [...bowl, ...beans, ...herbs])
add('teaPrep', '허브 차 준비', [...bowl, ...herbs, ['b', 4, 8, 2, 1]])
add('teaBrewing', '허브 차 우리는 주전자', [['B', 4, 5, 8, 7], ['b', 5, 6, 6, 5], ['B', 11, 7, 3, 2], ['B', 2, 7, 2, 3], ['C', 6, 4, 4, 1], ...steam])
add('herbTea', '허브 차', [['B', 4, 7, 7, 5], ['c', 5, 6, 5, 2], ['g', 5, 7, 5, 1], ['B', 11, 8, 2, 3], ['.', 11, 9, 1, 1], ...steam])
add('plateEmpty', '빈 접시', plate)
add('bowlEmpty', '빈 그릇', bowl)
add('cupEmpty', '빈 찻잔', [['B', 4, 7, 7, 5], ['c', 5, 6, 5, 2], ['C', 5, 7, 5, 1], ['B', 11, 8, 2, 3], ['.', 11, 9, 1, 1]])
add('potEmpty', '빈 냄비', pot)
add('woodenSpoon', '나무 주걱', [['W', 7, 3, 2, 10], ['l', 6, 2, 4, 4], ['w', 7, 3, 2, 2]])
add('ladle', '국자', [['S', 8, 2, 1, 9], ['s', 6, 10, 5, 3], ['S', 7, 12, 3, 1]])
add('ovenPaddle', '화덕 빵삽', [['W', 7, 1, 2, 9], ['w', 4, 9, 8, 5], ['l', 5, 10, 6, 3]])
add('washBasin', '재료 씻는 대야', [['B', 2, 7, 12, 6], ['b', 3, 8, 10, 4], ['c', 4, 8, 2, 1], ['c', 9, 10, 3, 1]])
add('cuttingBoard', '손질 도마', [['W', 2, 5, 12, 8], ['l', 3, 6, 10, 6], ['w', 5, 6, 1, 6], ['w', 10, 6, 1, 6]])
add('servingTray', '음식 쟁반', [['W', 1, 8, 14, 5], ['l', 2, 9, 12, 3], ['W', 0, 9, 2, 2], ['W', 14, 9, 2, 2]])
add('clothCream', '기본 식탁 천', [['C', 2, 4, 12, 9], ['c', 3, 5, 10, 7], ['w', 3, 11, 10, 1]])
add('clothHerb', '허브 무늬 식탁 천', [['C', 2, 4, 12, 9], ['c', 3, 5, 10, 7], ['g', 4, 6, 2, 2], ['G', 9, 9, 2, 2]])
add('plateDecorated', '장식 접시', [...plate, ['r', 3, 10, 1, 1], ['r', 6, 12, 1, 1], ['r', 9, 12, 1, 1], ['r', 12, 10, 1, 1]])
add('mealForTwo', '두 사람 식사 차림', [['w', 1, 4, 14, 10], ['c', 2, 5, 12, 8], ['B', 3, 7, 4, 4], ['y', 4, 8, 2, 2], ['B', 9, 7, 4, 4], ['r', 10, 8, 2, 2]])
add('mealForFour', '네 사람 식사 차림', [['w', 1, 2, 14, 13], ['c', 2, 3, 12, 11], ...[3, 9].flatMap(x => [4, 10].flatMap(y => [['B', x, y, 4, 3], ['y', x + 1, y + 1, 2, 1]] as Rect[]))])
add('dirtyDishes', '정리 전 그릇', [...plate, ['r', 5, 10, 2, 1], ['g', 9, 10, 1, 1], ['B', 5, 5, 6, 4], ['C', 6, 5, 4, 1]])
add('cleanDishes', '정리한 그릇', [...plate, ['B', 3, 7, 10, 2], ['c', 4, 6, 8, 2], ['B', 5, 3, 6, 3], ['c', 6, 3, 4, 1]])

export const COOL_CUPBOARD: Record<string, Record<Facing, FurnitureArt>> = {}
for (const state of ['closed', 'open', 'stocked']) {
  const views = {} as Record<Facing, FurnitureArt>
  for (const facing of ['down', 'up', 'left', 'right'] as const) {
    const side = facing === 'left' || facing === 'right'
    const r: Rect[] = [['S', 2, 28, 12, 3], ['s', 3, 28, 10, 2], ['W', 2, 2, 12, 26], ['l', 3, 3, 10, 2], ['w', 3, 5, 10, 22], ['W', 2, 27, 2, 3], ['W', 12, 27, 2, 3]]
    if (facing === 'up' || side) {
      r.push(['W', side ? 5 : 7, 6, 1, 20], ['l', 3, 8, 1, 17], ['S', 7, 12, 4, 6], ['s', 8, 13, 2, 4])
      if (side && state !== 'closed') r.push(['W', 12, 5, 3, 21], ['l', 13, 6, 1, 18])
    } else if (state === 'closed') r.push(['W', 7, 5, 1, 22], ['l', 4, 6, 2, 18], ['l', 9, 6, 2, 18], ['S', 6, 14, 1, 3], ['S', 9, 14, 1, 3])
    else {
      r.push(['S', 4, 6, 8, 20], ['s', 5, 7, 6, 18], ['W', 3, 13, 10, 2], ['W', 3, 21, 10, 2], ['W', 0, 5, 3, 22], ['l', 1, 6, 1, 19], ['W', 13, 5, 3, 22], ['l', 14, 6, 1, 19], ['r', 6, 23, 4, 3], ['b', 7, 23, 2, 1])
      if (state === 'stocked') r.push(['B', 5, 10, 6, 3], ['g', 6, 9, 2, 2], ['r', 9, 9, 1, 2], ['C', 5, 17, 2, 4], ['y', 5, 18, 2, 2], ['v', 9, 18, 2, 3])
    }
    let rows = picture(r, 16, 32)
    if (facing === 'left') rows = rows.map(row => [...row].reverse().join(''))
    views[facing] = { w: 1, h: 2, rows }
  }
  COOL_CUPBOARD[state] = views
}

export const COOK_ACTIONS = ['wash', 'sort', 'chop', 'knead', 'shapeLong', 'shapeRound', 'score', 'stir', 'ladle', 'ovenIn', 'ovenOut', 'garnish', 'pourTea', 'carryMeal', 'placePlate', 'taste', 'shareFood', 'eat', 'clear', 'store', 'choosePlate'] as const
export type CookAction = typeof COOK_ACTIONS[number]
export const COOK_ACTION_LABELS = ['재료 씻기', '재료 분류', '허브 손질', '반죽', '길쭉하게 성형', '둥글게 성형', '무늬 내기', '냄비 젓기', '그릇으로 덜기', '화덕에 넣기', '화덕에서 꺼내기', '곁들임 올리기', '차 따르기', '식사 운반', '접시 놓기', '맛보기', '음식 나누기', '먹기', '그릇 정리', '찬장 보관', '접시 선택']
export const CHILD_COOK_ACTIONS: readonly CookAction[] = ['sort', 'knead', 'shapeLong', 'shapeRound', 'garnish', 'choosePlate', 'taste', 'eat']
const actionProp: Record<CookAction, string> = { wash:'washBasin', sort:'beanRaw', chop:'herbChopped', knead:'mixingBowl', shapeLong:'doughLong', shapeRound:'doughRound', score:'breadScored', stir:'beanPotCooking', ladle:'beanBowl', ovenIn:'doughLong', ovenOut:'breadHot', garnish:'herbBeanBowl', pourTea:'herbTea', carryMeal:'mealForTwo', placePlate:'figPlate', taste:'honeyBread', shareFood:'breadLong', eat:'beanBowl', clear:'dirtyDishes', store:'beanRaw', choosePlate:'plateDecorated' }
export function cookingFrame(who: Who, facing: Facing, action: CookAction, frame: number, opts: SpriteOpts) {
  const f = ((Math.trunc(frame) % 4) + 4) % 4
  const child = !!opts.short
  if (child && !CHILD_COOK_ACTIONS.includes(action)) throw new Error('아이에게 불·칼·뜨거운 그릇 동작을 사용하지 마세요')
  const eating = ['taste', 'eat'].includes(action)
  const base = furnitureUseFrame(who, facing, eating ? 'drink' : ['knead', 'shapeLong', 'shapeRound', 'score'].includes(action) ? 'knead' : 'reach', f, opts)
  const direction = facing === 'left' ? 'right' : facing
  const ix = direction === 'right' ? 18 : 12
  let iy = (child ? 16 : 14) + (f % 2)
  if (eating) iy = [15, 12, 10, 13][f]
  if (['ovenIn', 'ovenOut', 'store', 'placePlate', 'shareFood'].includes(action)) iy -= [0, 1, 2, 0][f]
  const obj = COOKING_PROPS[actionProp[action]]
  const rects: Rect[] = []
  const ox = ix - 4, oy = iy - 3
  const grid = picture([], 24, 24).map(r => [...r])
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const c = obj.rows[y * 2][x * 2]
    if (c !== '.' && oy + y >= 0 && oy + y < 24 && ox + x >= 0 && ox + x < 24) grid[oy + y][ox + x] = c
  }
  if (action === 'stir') rects.push(['W', ix - 2 + [0, 1, 2, 1][f], iy - 4, 1, 5], ['r', ix - 2 + f % 2, iy + 1, 2, 1])
  if (action === 'ladle') rects.push(['S', ix + f % 2, iy - 3, 1, 4], ['s', ix - 1 + f % 2, iy, 3, 1], ['r', ix, iy + 1, 1, f === 2 ? 3 : 1])
  if (action === 'chop') rects.push(['S', ix, iy - 3 - f % 2, 3, 1], ['W', ix + 2, iy - 4 - f % 2, 1, 2])
  if (action === 'wash') rects.push(['b', ix - 2 + f % 2, iy - 2, 1, 2], ['c', ix + 2, iy + f % 2, 1, 1])
  if (action === 'pourTea') rects.push(['B', ix - 3, iy - 4, 3, 2], ['b', ix, iy - 2, 1, f === 1 || f === 2 ? 3 : 1])
  if (action === 'ovenIn' || action === 'ovenOut') rects.push(['W', ix - 4, iy + 3, 7, 1], ['l', ix + 2, iy + 2, 2, 2])
  if (action === 'score') rects.push(['w', ix + f - 2, iy - 2, 1, 3])
  if (action === 'garnish') rects.push(['g', ix - 1 + f % 2, iy - 1, 2, 1])
  const overlay = picture(rects, 24, 24)
  overlay.forEach((r,y) => [...r].forEach((c,x) => { if (c !== '.') grid[y][x] = c }))
  const actor = (facing === 'left' ? base.actor.map(r => [...r].reverse().join('')) : base.actor).map(r => [...r])
  for (let y = 10; y < 20; y++) for (let x = 0; x < 24; x++) if (['s','5','!','K'].includes(actor[y][x])) actor[y][x] = '.'
  for (const hx of direction === 'right' ? [ix - 3] : [ix - 3, ix + 2]) { actor[iy][hx] = 's'; actor[iy + 1][hx] = '5' }
  const orient = (rows: string[]) => facing === 'left' ? rows.map(r => [...r].reverse().join('')) : rows
  const prop = orient(grid.map(r => r.join(''))), empty = picture([], 24, 24)
  return { actor: orient(actor.map(r => r.join(''))), propBack: facing === 'up' ? prop : empty, propFront: facing === 'up' ? empty : prop,
    anchor: base.anchor, interaction: { x: facing === 'left' ? 23 - ix : ix, y: iy }, propId: actionProp[action], duration: [280, 200, 340, 240][f], loop: !['ovenIn','ovenOut','placePlate','store','shareFood'].includes(action) }
}
