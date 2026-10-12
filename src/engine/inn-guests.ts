// 공동 주택 2층 여관 손님 (2026-10-12 사용자: 2층 여관 손님과 말을 나누고, 며칠 묵는지 알 수 있게. 늘 차 있을 필요는 없다)
// 아래쪽 방 넷 가운데 독립한 자녀가 쓰지 않는 방에 길손이 1~4밤씩 묵고 떠난다.
// 누가 언제 오는지는 날·방으로 정해진다 — 다시 불러와도 같고, 빈 날도 있다.
import type { Avatar } from './avatar'
import type { GameState } from './game'
import { lodgingChildren, LODGING_CHILD_SEATS } from './lodging'
import type { Tile } from './types'

export interface InnGuest {
  id: string
  name: string
  /** 어디서 왔는지 */
  from: string
  /** 무슨 일로 왔는지 (말 창 제목 아래 한 줄) */
  why: string
  avatar: Avatar
  /** 처음 만났을 때 */
  hello: string
  /** 전에 묵었던 손님을 다시 만났을 때 */
  again: string
  /** 머무는 동안 날마다 바뀌는 이야기 */
  talk: readonly string[]
  /** 떠나는 날 아침 */
  bye: string
}

export const INN_GUESTS: readonly InnGuest[] = [
  {
    id: 'salt', name: '오렌', from: '바닷가 마을', why: '소금 장수',
    avatar: { look: 'm', name: '오렌', skin: 4, hairFront: 3, top: 1, bottom: 2, hairColor: [28, 40, 25] },
    hello: '바닷가에서 소금을 지고 왔어요. 짐이 가벼워질 때까지 머물 생각이에요.',
    again: '또 왔어요! 이 마을 사람들은 소금을 아껴 쓰지 않아서 좋아요.',
    talk: ['소금 자루가 생각보다 무거워요. 어깨가 아직 얼얼해요.', '바닷바람 냄새가 아직 옷에 배어 있지요?', '이 마을 빵집 빵에는 소금이 딱 알맞게 들어가요.'],
    bye: '오늘 아침에 떠나요. 다음엔 더 고운 소금을 가져올게요.',
  },
  {
    id: 'potter', name: '마일라', from: '붉은 흙 골짜기', why: '옹기장이',
    avatar: { look: 'f', name: '마일라', skin: 2, hairFront: 7, hairBack: 3, top: 3, bottom: 1, hairColor: [20, 55, 45] },
    hello: '그릇을 팔러 왔어요. 깨지지 않게 오느라 걸음이 느렸지요.',
    again: '반가워요. 지난번에 판 그릇, 아직 잘 쓰이고 있으면 좋겠어요.',
    talk: ['흙마다 굽는 불 세기가 달라요. 그래서 재미있어요.', '물동이 하나 만드는 데 꼬박 사흘이 걸려요.', '이 방 창으로 들어오는 아침 햇살이 좋아요.'],
    bye: '이제 떠날 때예요. 짐이 가벼워져서 돌아가는 길은 빠르겠어요.',
  },
  {
    id: 'herbs', name: '세필', from: '안개 낀 숲 마을', why: '약초꾼',
    avatar: { look: 'm', name: '세필', skin: 1, hairFront: 4, top: 2, bottom: 3, acc: 0, hairColor: [30, 30, 60] },
    hello: '언덕 쪽에 좋은 풀이 난다고 해서 왔어요. 며칠 둘러볼 거예요.',
    again: '다시 왔어요. 그 언덕 풀은 해마다 조금씩 자리를 옮겨요.',
    talk: ['박하는 그늘을, 쑥은 볕을 좋아해요.', '말린 풀은 바람이 잘 드는 곳에 걸어 둬야 해요.', '이 마을 우물물로 우린 차는 맛이 순해요.'],
    bye: '오늘 떠나요. 바구니가 가득 찼거든요.',
  },
  {
    id: 'piper', name: '토반', from: '강 건너 장터', why: '떠돌이 악사',
    avatar: { look: 'm', name: '토반', skin: 3, hairFront: 5, top: 4, bottom: 2, hairColor: [25, 35, 40] },
    hello: '피리 하나 들고 마을마다 다녀요. 여기 저녁 바람 소리가 좋네요.',
    again: '또 만났네요! 새로 배운 가락이 하나 있어요.',
    talk: ['광장에서 한 곡 불었더니 아이들이 따라 흥얼거렸어요.', '피리는 습한 날엔 소리가 조금 낮아져요.', '노래는 마을마다 조금씩 다르게 불려요. 그게 좋아요.'],
    bye: '다음 마을로 가요. 이 마을 가락 하나 챙겨 갈게요.',
  },
  {
    id: 'courier', name: '니아', from: '북쪽 고갯마을', why: '편지 나르는 사람',
    avatar: { look: 'f', name: '니아', skin: 3, hairFront: 2, hairBack: 1, top: 2, bottom: 2, hairColor: [30, 45, 30] },
    hello: '편지 꾸러미를 나르는 길이에요. 비가 그칠 때까지 쉬어 가려고요.',
    again: '안녕하세요! 이번에도 편지가 한가득이에요.',
    talk: ['편지 한 통 한 통에 기다리는 사람이 있다고 생각하면 발이 빨라져요.', '이 마을 편지 바구니는 늘 잘 정리돼 있어요.', '고개를 넘을 땐 해 뜨기 전에 출발해야 해요.'],
    bye: '오늘 아침 고개를 넘어요. 몸 건강히 지내세요.',
  },
  {
    id: 'mapper', name: '할로', from: '먼 동쪽 길', why: '길을 그리는 사람',
    avatar: { look: 'm', name: '할로', skin: 2, hairFront: 9, top: 5, bottom: 1, acc: 1, hairColor: [35, 25, 70] },
    hello: '마을과 길을 그려 두는 일을 해요. 이 마을 골목도 그려 갈 거예요.',
    again: '다시 왔어요. 지난번 그린 길이 조금 바뀌었더군요.',
    talk: ['다리 하나만 새로 놓여도 그림을 다시 그려야 해요.', '이 마을은 우물을 가운데 두고 길이 뻗어 있어요.', '발로 걸어 본 길만 그려요. 그래야 틀리지 않거든요.'],
    bye: '그림이 다 됐어요. 오늘 떠나요.',
  },
  {
    id: 'carpenter', name: '베릭', from: '물레방아 마을', why: '다리 고치는 목수',
    avatar: { look: 'm', name: '베릭', skin: 5, hairFront: 3, top: 6, bottom: 2, hairColor: [25, 40, 30] },
    hello: '근처 다리를 손보러 왔어요. 일이 끝날 때까지만 묵어요.',
    again: '또 신세 져요. 이번엔 난간을 고쳐요.',
    talk: ['나무는 마르면서 조금씩 움직여요. 그래서 틈을 남겨 둬요.', '못보다 끼워 맞춘 이음이 오래가요.', '아침 일찍 망치 소리가 시끄러웠다면 미안해요.'],
    bye: '다리가 튼튼해졌어요. 오늘 돌아가요.',
  },
  {
    id: 'scribe', name: '소라', from: '언덕 위 서고 마을', why: '배우러 온 필사생',
    avatar: { look: 'f', name: '소라', skin: 1, hairFront: 1, hairBack: 4, top: 3, bottom: 3, hairColor: [28, 30, 25] },
    hello: '이 마을 서고 이야기를 듣고 왔어요. 옮겨 적는 법을 좀 배우고 싶어요.',
    again: '다시 왔어요! 지난번에 배운 대로 글씨 연습을 했어요.',
    talk: ['한 글자씩 천천히 쓰면 마음도 차분해져요.', '잉크가 번지지 않게 종이를 잘 말리는 게 먼저래요.', '서고 책장을 보니 여기 사람들이 얼마나 정성을 들였는지 알겠어요.'],
    bye: '오늘 떠나요. 배운 것 잊지 않을게요.',
  },
  {
    id: 'wool', name: '테오', from: '높은 들 목장', why: '양털 장수',
    avatar: { look: 'm', name: '테오', skin: 3, hairFront: 11, top: 1, bottom: 3, hairColor: [30, 50, 50] },
    hello: '양털을 팔러 왔어요. 좋은 실 잣는 분이 있다고 들었거든요.',
    again: '안녕하세요. 올해 털은 유난히 부드러워요.',
    talk: ['양들은 봄에 털을 깎으면 한결 가벼워 보여요.', '털은 비 맞기 전에 잘 덮어 둬야 해요.', '이 마을 목자와 양 이야기를 한참 나눴어요.'],
    bye: '털을 다 팔았어요. 오늘 목장으로 돌아가요.',
  },
  {
    id: 'traveler', name: '엘리스', from: '남쪽 올리브 마을', why: '먼 길 가는 나그네',
    avatar: { look: 'f', name: '엘리스', skin: 4, hairFront: 6, hairBack: 2, top: 4, bottom: 1, hairColor: [22, 50, 40] },
    hello: '먼 길 가는 중에 하룻밤 쉬어 가요. 방이 따뜻해서 좋네요.',
    again: '또 들렀어요. 이 방은 늘 정갈해요.',
    talk: ['길을 오래 걷다 보면 마을마다 아침 냄새가 달라요.', '올리브 숲 그늘에서 잠깐 쉬었어요. 시원했어요.', '여기 사람들은 지나가는 사람에게도 인사를 잘 해 줘요.'],
    bye: '오늘 다시 길을 떠나요. 고마웠어요.',
  },
]

/** 손님이 묵는 방 자리 = 2층 아래쪽 방 넷 (독립한 자녀 자리와 같다) */
export const INN_SEATS: readonly Tile[] = LODGING_CHILD_SEATS

export interface InnStay {
  guest: string
  room: number
  /** 도착하는 날 (오후에 온다) */
  arrive: number
  /** 떠나는 날 (아침에 떠난다) */
  leave: number
}

/** 방이 비어 있는 날마다 손님이 들 확률 (100분의) */
const ARRIVE_CHANCE = 40
/** 같은 손님이 떠난 뒤 다시 오기까지 적어도 이만큼 */
const COME_BACK_DAYS = 8
const FIRST_DAY = 2

function hash(a: number, b: number): number {
  let h = (a * 374761393 + b * 668265263) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

// 앞에서부터 날마다 차례로 정하므로 어느 날까지 셈해도 앞 날의 결과는 같다
let planned: InnStay[] = []
let plannedTo = FIRST_DAY - 1
const active: (InnStay | null)[] = INN_SEATS.map(() => null)
const restUntil: number[] = INN_SEATS.map(() => FIRST_DAY)
/** 손님마다 마지막으로 떠난 날 */
const lastLeave = new Map<string, number>()

function planTo(day: number): void {
  for (let d = plannedTo + 1; d <= day; d++) {
    INN_SEATS.forEach((_, r) => {
      const cur = active[r]
      if (cur && cur.leave <= d) {
        active[r] = null
        // 손님이 떠난 날은 방을 치우고, 하루 이틀 비워 둘 수도 있다
        restUntil[r] = d + 1 + (hash(r + 11, d) % 2)
      }
      if (active[r] || d < restUntil[r]) return
      const h = hash(r + 1, d)
      if (h % 100 >= ARRIVE_CHANCE) return
      const busy = new Set(active.filter((s): s is InnStay => !!s).map((s) => s.guest))
      const start = (h >>> 8) % INN_GUESTS.length
      for (let i = 0; i < INN_GUESTS.length; i++) {
        const g = INN_GUESTS[(start + i) % INN_GUESTS.length]
        if (busy.has(g.id) || (lastLeave.get(g.id) ?? -Infinity) > d - COME_BACK_DAYS) continue
        const stay: InnStay = { guest: g.id, room: r, arrive: d, leave: d + 1 + ((h >>> 4) % 4) }
        active[r] = stay
        planned.push(stay)
        lastLeave.set(g.id, stay.leave)
        break
      }
    })
  }
  plannedTo = Math.max(plannedTo, day)
}

/** 그날 묵고 있는 손님들 (도착한 날~떠나는 날) — 독립한 자녀가 쓰는 방은 뺀다 */
export function innStays(s: Pick<GameState, 'clock' | 'gen' | 'flags' | 'child'>): InnStay[] {
  const day = s.clock.day
  planTo(day)
  const taken = new Set(lodgingChildren(s).map((c) => INN_SEATS.findIndex((t) => t.x === c.seat.x && t.y === c.seat.y)))
  // 한 번에 최대 4밤이므로 끝에서부터 그날을 지난 것만 본다
  const out: InnStay[] = []
  for (let i = planned.length - 1; i >= 0; i--) {
    const st = planned[i]
    if (st.leave < day - 8 && st.arrive < day - 8) { if (st.arrive < day - 16) break; continue }
    if (st.arrive <= day && day <= st.leave && !taken.has(st.room)) out.push(st)
  }
  return out.sort((a, b) => a.room - b.room)
}

/** 손님이 방에 있는 때: 떠나는 날은 아침(6:00~9:30)만, 도착한 날은 오후(15:30~)부터, 그 사이 날은 아침·저녁 (밤 10시 넘으면 잠든다) */
export function guestInRoom(st: InnStay, day: number, minute: number): boolean {
  const morning = minute >= 6 * 60 && minute < 9 * 60 + 30
  const evening = minute >= 15 * 60 + 30 && minute < 22 * 60
  if (day === st.leave) return morning
  if (day === st.arrive) return evening
  return morning || evening
}

export interface InnGuestHere {
  stay: InnStay
  guest: InnGuest
  at: Tile
}

/** 지금 방에 보이는 손님들 */
export function innGuestsNow(s: Pick<GameState, 'clock' | 'gen' | 'flags' | 'child'> & Partial<Pick<GameState, 'map'>>): InnGuestHere[] {
  if (s.map === 'newland') return []
  return innStays(s)
    .filter((st) => guestInRoom(st, s.clock.day, s.clock.minute))
    .map((st) => ({ stay: st, guest: INN_GUESTS.find((g) => g.id === st.guest)!, at: INN_SEATS[st.room] }))
}

export function innGuestAt(s: Pick<GameState, 'clock' | 'gen' | 'flags' | 'child'> & Partial<Pick<GameState, 'map'>>, t: Tile): InnGuestHere | null {
  return innGuestsNow(s).find((g) => g.at.x === t.x && g.at.y === t.y) ?? null
}

export function innGuestTile(s: Pick<GameState, 'clock' | 'gen' | 'flags' | 'child'> & Partial<Pick<GameState, 'map'>>, id: string): Tile | null {
  return innGuestsNow(s).find((g) => g.guest.id === id)?.at ?? null
}

/** 며칠 묵는지 한 줄 */
export function stayLine(st: InnStay, day: number): string {
  const nights = st.leave - st.arrive
  if (day >= st.leave) return '오늘 아침 떠나요.'
  const left = st.leave - day
  const when = left === 1 ? '내일 아침' : left === 2 ? '모레 아침' : `${left}일 뒤 아침`
  return `${nights}밤 묵어요 · ${when} 떠나요`
}

/** 오늘 들려주는 말: 이번 묵음에 처음 말을 걸면 인사(전에 묵었던 손님은 다시 만난 인사), 떠나는 날이면 작별,
 * 그 밖에는 날마다 바뀌는 이야기 (more번째로 더 들으면 다음 이야기). 창을 열 때 한 번 셈해 두고 쓴다 */
export function guestLine(s: Pick<GameState, 'clock' | 'flags'>, here: InnGuestHere, more = 0): string {
  const { guest, stay } = here
  const day = s.clock.day
  if (more === 0) {
    if (day === stay.leave) return guest.bye
    if (s.flags[`inn:stay:${guest.id}`] !== stay.arrive) return s.flags[`inn:met:${guest.id}`] ? guest.again : guest.hello
  }
  return guest.talk[(day + more + stay.room) % guest.talk.length]
}

/** 손님과 말을 나눈 기록: 처음 만난 날, 이번 묵음에 인사한 것 */
export function metGuest(s: GameState, here: InnGuestHere): GameState {
  const id = here.guest.id
  return { ...s, flags: { ...s.flags, [`inn:met:${id}`]: s.flags[`inn:met:${id}`] ?? s.clock.day, [`inn:stay:${id}`]: here.stay.arrive } }
}

/** 테스트용: 셈해 둔 손님 일정을 지운다 */
export function resetInnPlan(): void {
  planned = []
  plannedTo = FIRST_DAY - 1
  active.fill(null)
  restUntil.fill(FIRST_DAY)
  lastLeave.clear()
}
