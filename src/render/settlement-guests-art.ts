import { withLookDefaults } from '../engine/avatar'
import type { GuestId } from '../engine/newland-life'
import type { Facing } from '../engine/types'
import { spriteRows, writerPalette } from './sprites'
import { extraUseFrame } from './expansion-life-motion'
import { furnitureUseFrame, USE_PROP_PALETTE } from './furniture-use-motion'
import { FURNI_PALETTE } from './furniture-art'

/** 손님집 인물. 기존 주민 헤이즐과 겹치지 않게 넬리(2026-10-07 사용자), 그리고 서고 방문객과 별개의 ID. */
export const SETTLEMENT_GUESTS = {
  nelly: { label: '넬리', elder: false, avatar: withLookDefaults({ name: '넬리', look: 'f', skin: 3, hairFront: 5, hairBack: 6, top: 9, bottom: 4, acc: 11, hairColor: [26, 40, 34] }) },
  morris: { label: '모리스', elder: true, avatar: withLookDefaults({ name: '모리스', look: 'm', skin: 4, hairFront: 3, hairBack: 0, top: 10, bottom: 6, acc: 10, hairColor: [45, 5, 67] }) },
  ivy: { label: '아이비', elder: false, avatar: withLookDefaults({ name: '아이비', look: 'f', skin: 1, hairFront: 9, hairBack: 4, top: 14, bottom: 7, acc: 12, hairColor: [32, 42, 27] }) },
} satisfies Record<GuestId, unknown>
export const GUEST_ACTIONS = ['stand', 'walk', 'work', 'greet', 'carry', 'sit', 'read', 'sleep'] as const
export type GuestAction = typeof GUEST_ACTIONS[number]
export const GUEST_ACTION_LABELS: Record<GuestAction, string> = { stand: '서서 쉬기', walk: '걷기', work: '손일', greet: '인사·선물 건네기', carry: '짐 들기', sit: '앉아 쉬기', read: '읽기', sleep: '잠자기' }
export const GUEST_PROP_PALETTE = { ...FURNI_PALETTE, ...USE_PROP_PALETTE, N: '#506574', n: '#85989b', q: '#f0d5a2', t: '#b38b5b', T: '#725537' }

/** 8px 소품: 버들 바구니 / 점을 이은 별자리판 / 씨앗 주머니. */
export function guestPropRows(id: GuestId, frame = 0): string[] {
  const p = Array.from({ length: 8 }, () => Array<string>(8).fill('.'))
  const rect = (x: number,y: number,w: number,h: number,c: string) => { for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)p[yy][xx]=c }
  if(id==='nelly') {
    rect(2,0,4,1,'T');rect(1,1,1,3,'T');rect(6,1,1,3,'T');rect(0,3,8,1,'T');rect(1,4,6,3,'t');rect(1,7,6,1,'T')
    for(let y=4;y<7;y++)for(let x=2;x<7;x+=2)p[y][x]=(x+y+frame)%2?'q':'T'
  } else if(id==='morris') {
    rect(0,0,8,8,'T');rect(1,1,6,6,'N');rect(2,3,4,1,'n');rect(4,2,1,4,'n')
    for(const [x,y] of [[2,2],[4,3],[5,5],[2,6]])p[y][x]='q'
    if(frame%2)p[1][5]='q'
  } else {
    rect(2,0,4,1,'G');rect(3,1,2,2,'T');rect(1,3,6,4,'t');rect(2,7,4,1,'T');rect(2,3,4,1,'q');rect(3,5,2,1,'G')
    if(frame%2)p[6][5]='q'
  }
  return p.map(r=>r.join(''))
}

/** 인물과 도구의 팔레트를 분리하고 기존 발 위치 앵커를 유지한다. */
export function settlementGuestFrame(id: GuestId, facing: Facing, action: GuestAction, frame: number) {
  const def=SETTLEMENT_GUESTS[id], f=((frame%4)+4)%4
  const opts={frame:0 as const,blink:f===3,avatar:def.avatar,elder:def.elder}
  const palette=writerPalette('spring',def.avatar)
  if(action==='stand'||action==='walk') {
    const rows=spriteRows('writer',facing,{...opts,frame:action==='walk'?([0,1,0,2] as const)[f]:0})
    const actor=Array.from({length:24},(_,y)=>y>=4&&y<4+rows.length?'.'.repeat(7)+rows[y-4]+'.'.repeat(7):'.'.repeat(24))
    return {actor,propBack:Array<string>(24).fill('.'.repeat(24)),propFront:Array<string>(24).fill('.'.repeat(24)),anchor:{x:12,y:4+rows.length},palette,duration:action==='walk'?180:400,loop:true}
  }
  const base=action==='sit'||action==='read'||action==='sleep'
    ? furnitureUseFrame('writer',facing,action==='sleep'?'lie':action,f,opts)
    : extraUseFrame('writer',facing,action==='greet'?'give':action==='carry'?'carry':id==='nelly'?'weave':id==='morris'?'draw':'tidy',f,opts)
  if(action==='sleep')base.actor=base.actor.map(r=>r.replaceAll('o','s'))
  if(action==='work'||action==='carry'||action==='greet') {
    const p=Array.from({length:24},()=>Array<string>(24).fill('.'))
    const x=facing==='left'?1:facing==='right'?15:8,y=12+(f%2)
    guestPropRows(id,f).forEach((r,dy)=>[...r].forEach((c,dx)=>{if(c!=='.')p[y+dy][x+dx]=c}))
    const rows=p.map(r=>r.join('')),empty=Array<string>(24).fill('.'.repeat(24))
    base.propBack=facing==='up'?rows:empty;base.propFront=facing==='up'?empty:rows
  }
  return {...base,palette,duration:action==='greet'?180:300,loop:action!=='greet'}
}
