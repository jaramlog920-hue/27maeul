import { withLookDefaults, type FullAvatar } from '../engine/avatar'
import type { GuestKind } from '../engine/game'
import type { GenPerson } from '../engine/gen'
import { generationRows } from './generation-art'
import { FURNITURE_ART, FURNI_PALETTE } from './furniture-art'
import { spriteRows, writerPalette } from './sprites'
import { furnitureUseFrame, USE_PROP_PALETTE } from './furniture-use-motion'

export const MEETING_EMOTES = ['heart', 'laugh', 'talk', 'sweat', 'angry'] as const
export type MeetingEmote = typeof MEETING_EMOTES[number]
export const MEETING_PALETTE: Record<string, string> = {
  k: '#ae9b84', w: '#fffaf0', r: '#c77788', y: '#bb984d', b: '#789cae', g: '#8a9e7b',
}
const SYMBOLS: Record<MeetingEmote, string[]> = {
  heart: ['.........', '.rr...rr.', 'rrrr.rrrr', 'rrrrrrrrr', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....', '.........'],
  laugh: ['.........', '..y...y..', '.y.y.y.y.', '.........', '.r.....r.', '..ywwwy..', '..yyyyy..', '...yyy...', '.........'],
  talk: ['.........', '.ggggggg.', 'ggwwwwwgg', 'gwwwwwwwg', 'gwgwgwgwg', 'gwwwwwwwg', '.ggggggg.', '..gg.....', '.g.......'],
  sweat: ['.....b...', '....bbb..', '...bbbbb.', '...bbbbb.', '....bbb..', '.........', '..gg.....', '.g..gg...', '.........'],
  angry: ['.........', '.rr...rr.', '..rr.rr..', '.........', '....r....', '.........', '..rrrrr..', '.r.....r.', '.........'],
}
/** 13×13 말풍선: 부드러운 테두리와 9×9 감정 도트. PNG도 이 원본에서 내보낸다. */
export function meetingEmoteRows(kind: MeetingEmote): string[] {
  const p = Array.from({ length: 13 }, () => Array<string>(13).fill('.'))
  for (let y = 0; y < 11; y++) for (let x = 0; x < 13; x++) {
    if ((y === 0 || y === 10) && (x === 0 || x === 12)) continue
    p[y][x] = y === 0 || y === 10 || x === 0 || x === 12 ? 'k' : 'w'
  }
  p[11][4] = 'k'; p[11][5] = 'w'; p[11][6] = 'k'; p[12][4] = 'k'; p[12][5] = 'k'
  SYMBOLS[kind].forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') p[y + 1][x + 2] = c }))
  return p.map(row => row.join(''))
}

/** 기존 요람·아기 원본 재사용. 뒤 요람 → 아기 → 앞 난간으로 합성한다. */
export function householdCradleFrame(baby: Pick<GenPerson, 'look' | 'name' | 'avatar'>, frame: number, sleeping: boolean) {
  const avatar = withLookDefaults({ look: baby.look ?? 'f', name: baby.name ?? '', ...baby.avatar })
  const pal = writerPalette('spring', avatar)
  const crib = FURNITURE_ART.homeCradle.rows.map(r => r.replaceAll('z', '.'))
  const actor = Array.from({ length: 16 }, () => Array<string>(16).fill('.'))
  const babyRows = generationRows('baby', 'down', sleeping ? 2 : frame, { frame: 0, blink: sleeping, avatar })
  babyRows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.' && y < 14) actor[y][x + 3] = c === 'o' ? 'k' : c }))
  const front = crib.map((r, y) => y >= 10 ? r : '.'.repeat(16))
  return { back: crib, actor: actor.map(r => r.join('')), front, actorPalette: pal, propPalette: FURNI_PALETTE }
}

export const VISITOR_KINDS: GuestKind[] = ['wanderer', 'learner', 'kid', 'scribe']
export const VISITOR_LABELS: Record<GuestKind, string> = { wanderer: '나그네', learner: '배우러 온 사람', kid: '꼬마', scribe: '다른 마을 서기' }
export const VISITOR_LOOKS: Record<GuestKind, FullAvatar> = {
  wanderer: withLookDefaults({ name: '', look: 'm', skin: 3, hairFront: 10, top: 1, bottom: 2, acc: 0, hairColor: [30, 35, 29] }),
  learner: withLookDefaults({ name: '', look: 'f', skin: 1, hairFront: 7, hairBack: 2, top: 3, bottom: 3, hairColor: [25, 44, 35] }),
  kid: withLookDefaults({ name: '', look: 'm', skin: 2, hairFront: 6, top: 6, bottom: 2, hairColor: [25, 45, 30] }),
  scribe: withLookDefaults({ name: '', look: 'f', skin: 4, hairFront: 1, hairBack: 4, top: 2, bottom: 1, hairColor: [30, 25, 25] }),
}
export type VisitorAction = 'stand' | 'read' | 'write'
export function visitorFrame(kind: GuestKind, action: VisitorAction, frame: number) {
  const avatar = VISITOR_LOOKS[kind], opts = { avatar, frame: 0 as const, blink: frame === 2, short: kind === 'kid' ? 1 : undefined }
  const empty = Array<string>(24).fill('.'.repeat(24))
  if (action === 'stand') {
    const rows = spriteRows('writer', 'down', opts)
    return { actor: Array.from({ length: 24 }, (_, y) => y >= 4 && y < 4 + rows.length ? '.'.repeat(7) + rows[y - 4] + '.'.repeat(7) : '.'.repeat(24)), propBack: empty, propFront: empty, actorPalette: writerPalette('spring', avatar), propPalette: USE_PROP_PALETTE, height: rows.length }
  }
  if (action === 'write') {
    const phase=((Math.trunc(frame)%4)+4)%4,layers=furnitureUseFrame('writer','down','sit',frame,opts)
    const actor=layers.actor.map(r=>[...r]),back=Array.from({length:24},()=>Array<string>(24).fill('.')),front=back.map(r=>[...r])
    const rect=(p:string[][],x:number,y:number,w:number,h:number,c:string)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(p[yy]?.[xx]!==undefined)p[yy][xx]=c}
    for(let y=11;y<17;y++)for(let x=7;x<17;x++)if(['s','5','!','K'].includes(actor[y][x]))actor[y][x]='.'
    // 책을 가슴 아래 책상에 두고 종이 → 손 → 펜 레이어로 나눈다.
    rect(back,4,14,16,2,'g');rect(back,5,14,14,1,'e');rect(back,5,16,2,5,'g');rect(back,17,16,2,5,'g')
    rect(back,8,11,9,3,'g');rect(back,9,11,7,2,'a');rect(back,12,11,1,3,'b')
    const hx=[14,15,14,15][phase]
    rect(actor,8,11,2,2,'r');rect(actor,14,11,2,2,'r');rect(actor,9,12,2,1,'s');rect(actor,9,13,2,1,'5');rect(actor,hx,12,2,1,'s');rect(actor,hx,13,2,1,'5')
    rect(front,hx+1,10,1,1,'b');rect(front,hx,11,1,1,'d');rect(front,hx-1,12,1,1,'d')
    rect(front,4,14,16,1,'e');rect(front,4,15,16,1,'g')
    return {...layers,actor:actor.map(r=>r.join('')),propBack:back.map(r=>r.join('')),propFront:front.map(r=>r.join('')),interaction:{x:hx-1,y:12},actorPalette:writerPalette('spring',avatar),propPalette:USE_PROP_PALETTE,height:spriteRows('writer','down',opts).length}
  }
  const layers = furnitureUseFrame('writer', 'down', action === 'read' ? 'read' : 'craft', frame, opts)
  return { ...layers, actorPalette: writerPalette('spring', avatar), propPalette: USE_PROP_PALETTE, height: spriteRows('writer', 'down', opts).length }
}
