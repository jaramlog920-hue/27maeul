import type { Facing } from '../engine/types'
import { motionBodyRows } from './motion-body'
import { spriteRows, type SpriteOpts, type Who } from './sprites'
import type { EventMotion } from '../engine/event-scene'

export const GATHERING_ACTIONS = ['pourTea', 'sipTea', 'stitch', 'showWork', 'point', 'takeNote', 'plant', 'waterPlants', 'greet', 'offerGift', 'receiveGift', 'inspectWork', 'wipeTable'] as const
export type GatheringAction = typeof GATHERING_ACTIONS[number]
export const GATHERING_LABELS: Record<GatheringAction, string> = {
  pourTea: '차 따르기', sipTea: '찻잔 들어 마시기', stitch: '천 바느질하기', showWork: '완성한 것 펼쳐 보이기',
  point: '발견한 것 가리키기', takeNote: '관찰 공책에 메모하기', plant: '씨앗 심기', waterPlants: '물뿌리개로 물주기',
  greet: '손 흔들어 맞이하기', offerGift: '선물 건네기', receiveGift: '선물 받아 살펴보기', inspectWork: '작품 가까이 살펴보기', wipeTable: '탁자 닦기',
}

/** 모임의 역할·소품에 따라 구체적인 동작을 고른다. 다른 생활 동작은 기존 그림을 쓴다. */
export function gatheringActionFor(m: EventMotion): GatheringAction | null {
  if (m.set !== 'social') return null
  if (m.action === 'wave') return 'greet'
  if (m.action === 'pour' && m.prop === 'teapot') return 'pourTea'
  if (m.action === 'drink' && m.prop === 'cup') return 'sipTea'
  if (m.action === 'stitch' && m.prop === 'cloth') return 'stitch'
  if (m.action === 'show' && m.prop === 'cloth') return 'showWork'
  if (m.action === 'point' && !m.prop) return 'point'
  if (m.action === 'read' && m.prop === 'book' && m.label?.includes('기록')) return 'takeNote'
  if (m.action === 'sow' && m.prop === 'seed') return 'plant'
  if (m.action === 'water' && m.prop === 'water') return 'waterPlants'
  if (m.action === 'offer' && m.prop === 'gift') return 'offerGift'
  if (m.action === 'inspect' && m.prop === 'gift') return 'receiveGift'
  if (m.action === 'inspect' && m.label?.includes('작품')) return 'inspectWork'
  if (m.action === 'tidy' && m.prop === 'tray') return 'wipeTable'
  return null
}

/** 현재 외형을 유지하는 24×24 네 방향 모션. 왼쪽은 오른쪽을 정확히 반전한다. */
export function gatheringMotionFrame(who: Who, facing: Facing, action: GatheringAction, frame: number, opts: SpriteOpts) {
  const phase = ((Math.trunc(frame) % 4) + 4) % 4
  const direction = facing === 'left' ? 'right' : facing
  const side = direction === 'right'
  const actor = Array.from({ length: 24 }, () => Array<string>(24).fill('.'))
  const prop = Array.from({ length: 24 }, () => Array<string>(24).fill('.'))
  const rect = (layer: string[][], x: number, y: number, w: number, h: number, color: string) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (layer[yy]?.[xx] !== undefined) layer[yy][xx] = color
  }
  const crouch = action === 'plant' || action === 'stitch'
  const source = motionBodyRows(who, direction, { ...opts, frame: 0, pose: crouch ? 'crouch' : 'stand', blink: opts.blink || phase === 3 })
  const standHeight = spriteRows(who, direction, { ...opts, frame: 0, pose: 'stand' }).length
  const y0 = 4 + standHeight - source.length
  source.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') rect(actor, 7 + x, y0 + y, 1, 1, c) }))
  const body = actor.map((row) => [...row])
  const hand = (x: number, y: number) => { rect(actor, x, y, 2, 2, '5'); rect(actor, x, y, 2, 1, 's') }
  const box = (x: number, y: number) => { rect(prop, x, y, 7, 6, 'w'); rect(prop, x + 1, y + 1, 5, 4, 'C'); rect(prop, x + 3, y, 1, 6, 'b') }
  const cup = (x: number, y: number) => { rect(prop, x, y, 3, 3, 'B'); rect(prop, x, y, 3, 1, 'c'); rect(prop, x + 3, y + 1, 1, 1, 'B') }
  const cx = side ? 16 : 10
  let hx = cx, hy = 14
  if (action === 'pourTea') {
    const lift = [0, 1, 2, 0][phase]
    hx = cx; hy = 13 - lift
    rect(prop, cx, hy - 2, 5, 4, 'B'); rect(prop, cx + 1, hy - 3, 3, 1, 'c'); rect(prop, cx + 5, hy - 1, 2, 1, 'B')
    cup(side ? 20 : 17, 16)
    if (phase === 1 || phase === 2) rect(prop, side ? 21 : 18, hy, 1, 16 - hy, 'b')
  } else if (action === 'sipTea') {
    hy = phase === 1 || phase === 2 ? 10 : 15
    cup(cx, hy - 1)
  } else if (action === 'stitch' || action === 'showWork') {
    const up = action === 'showWork' ? [0, 2, 3, 1][phase] : 0
    hy = 16 - up
    rect(prop, cx - 3, hy, 8, 4, 'B'); rect(prop, cx - 2, hy + 1, 6, 2, 'b')
    if (action === 'stitch') { hx = cx + (phase % 2 ? 2 : 0); rect(prop, hx + 1, hy - 3 + phase % 2, 1, 3, 'S'); rect(prop, cx - 1, hy + 1, 3, 1, 'c') }
    else hand(cx + 3, hy - 1)
  } else if (action === 'point' || action === 'greet') {
    const shoulderY = y0 + Math.min(7, source.length - 5)
    const sleeve = source[Math.min(7, source.length - 5)]?.[7] ?? 'r'
    const shoulderX = 14
    hx = side ? 17 : action === 'greet' ? [17,18,17,17][phase] : 17
    hy = action === 'greet' ? shoulderY - [2,3,2,1][phase] : shoulderY + [0,-1,0,1][phase]
    // 가만히 내린 바깥 소매를 지우고 어깨 → 팔꿈치 → 손으로 한 팔만 연결한다.
    if (!side) for (let y = shoulderY; y < shoulderY + 3; y++) rect(actor, 15, y, 1, 1, '.')
    const elbowX = 15, elbowY = action === 'greet' ? shoulderY - 1 : hy
    const line = (x0:number,y0:number,x1:number,y1:number,color:string) => {
      const steps = Math.max(Math.abs(x1-x0),Math.abs(y1-y0))
      for(let i=0;i<=steps;i++) {
        const x=Math.round(x0+(x1-x0)*i/Math.max(1,steps)),y=Math.round(y0+(y1-y0)*i/Math.max(1,steps))
        rect(actor,x,y,2,2,color)
        if(color==='s')rect(actor,x,y+1,2,1,'!')
      }
    }
    line(shoulderX,shoulderY,elbowX,elbowY,sleeve)
    line(elbowX,elbowY,hx-1,hy,'s')
    if (action === 'point') rect(actor, hx + 1, hy, 1, 1, 's')
  } else if (action === 'takeNote' || action === 'inspectWork') {
    rect(prop, cx - 3, 14, 8, 5, 'w'); rect(prop, cx - 2, 14, 6, 4, 'c'); rect(prop, cx, 14, 1, 4, 'C')
    if (action === 'takeNote') { hx = cx + phase % 2; hy = 14 + phase % 2; rect(prop, hx + 1, hy - 2, 1, 3, 'W'); rect(prop, cx - 1, 17, 3, 1, 'w') }
    else { hy = 13; rect(prop, cx - 2, 15, 2, 2, 'g'); rect(prop, cx + 1, 15, 2, 2, 'r') }
  } else if (action === 'plant') {
    hy = 18 + phase % 2
    rect(prop, cx - 3, 21, 8, 2, 'w'); rect(prop, cx, 18, 1, 3, 'g')
    if (phase >= 2) { rect(prop, cx - 1, 18, 3, 1, 'G'); rect(prop, cx + 1, 17, 2, 1, 'g') }
    else rect(prop, cx + 1, 20, 1, 1, 'y')
  } else if (action === 'waterPlants') {
    hy = 14 - phase % 2
    rect(prop, cx - 2, hy, 5, 4, 'B'); rect(prop, cx - 1, hy - 2, 3, 1, 'B'); rect(prop, cx + 3, hy + 1, 3, 1, 'b')
    if (phase === 1 || phase === 2) { rect(prop, cx + 5, hy + 3, 1, 2, 'b'); rect(prop, cx + 6, hy + 5, 1, 1, 'b') }
    rect(prop, cx + 4, 21, 3, 1, 'g')
  } else if (action === 'offerGift' || action === 'receiveGift') {
    const reach = action === 'offerGift' ? [0, 1, 3, 1][phase] : [3, 2, 0, 0][phase]
    hx = cx + reach - 2; hy = 15
    box(cx + reach - 1, 13)
    if (!side) hand(cx + reach + 4, hy)
  } else if (action === 'wipeTable') {
    hx = cx - 3 + phase * 2; hy = 17
    rect(prop, cx - 4, 20, 12, 2, 'w'); rect(prop, hx, 19, 4, 1, 'c')
  }
  if (action === 'point' || action === 'greet') {
    rect(actor,hx-1,hy,2,2,'s')
    rect(actor,hx,hy+1,1,1,'!')
  } else hand(hx - 1, hy)
  if (direction === 'up') {
    // 앞으로 내민 손·팔은 등을 덮지 않는다. 몸 바깥으로 나온 부분만 보인다.
    body.forEach((row,y)=>row.forEach((c,x)=>{if(c!=='.')actor[y][x]=c}))
  }
  const rows = (layer: string[][]) => layer.map((row) => (facing === 'left' ? [...row].reverse() : row).join(''))
  const empty = Array<string>(24).fill('.'.repeat(24))
  const props = rows(prop)
  return { actor: rows(actor), propBack: direction === 'up' ? props : empty, propFront: direction === 'up' ? empty : props,
    anchor: { x: 12, y: 4 + standHeight }, handAnchor: { x: facing === 'left' ? 23 - hx : hx, y: hy }, duration: 320, loop: true }
}
