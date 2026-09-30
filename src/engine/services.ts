// 집마다 직업 → 주고받기 (2026-09-30 사용자): 이웃마다 사고팔기·맡기기 한두 가지, 하루에 한 번씩.
// 돕기(손일 놀이)는 이미 이웃마다 있다 — 여기는 닢이나 재료를 내고 그 집 솜씨를 받는 일
import { grapesRipe } from './calendar'
import type { ItemId } from './types'

export interface Service {
  id: string
  npc: string
  label: string
  /** 내는 것: 재료와 닢 */
  pay: Partial<Record<ItemId, number>>
  coins?: number
  /** 받는 것: 재료와 닢 */
  get: Partial<Record<ItemId, number>>
  getCoins?: number
  /** 걸리는 시간(분) */
  minutes?: number
  /** 이때만 (없으면 늘) */
  when?: (day: number) => boolean
  whenNote?: string
}

export const SERVICES: readonly Service[] = [
  { id: 'bakerBread', npc: 'baker', label: '갓 구운 빵 사기', pay: {}, coins: 4, get: { bread: 1 } },
  { id: 'bakerBarley', npc: 'baker', label: '보리 두 줌으로 빵 구워 받기', pay: { barley: 2 }, get: { bread: 2 } },
  { id: 'shepherdWool', npc: 'shepherd', label: '양털 사기', pay: {}, coins: 5, get: { wool: 1 } },
  { id: 'weaverBlanket', npc: 'weaver', label: '양털 셋으로 담요 짜 받기', pay: { wool: 3 }, get: { blanket: 1 }, minutes: 10 },
  { id: 'weaverCushion', npc: 'weaver', label: '양털 둘과 닢으로 방석 짜 받기', pay: { wool: 2 }, coins: 4, get: { cushion: 1 } },
  { id: 'beeHoney', npc: 'beekeeper', label: '꿀 사기', pay: {}, coins: 6, get: { honey: 1 } },
  { id: 'beeWax', npc: 'beekeeper', label: '꿀 셋과 닢으로 봉인용 밀랍 받기', pay: { honey: 3 }, coins: 10, get: { sealWax: 1 } },
  { id: 'fisherReeds', npc: 'fisher', label: '그물 고칠 갈대 팔기', pay: { reed: 3 }, get: {}, getCoins: 6 },
  { id: 'presserOil', npc: 'presser', label: '올리브 셋으로 기름 짜 받기', pay: { olive: 3 }, get: { oil: 1 } },
  { id: 'grandpaGrapes', npc: 'grandpa', label: '잘 익은 포도 사기', pay: {}, coins: 3, get: { grapes: 2 }, when: grapesRipe, whenNote: '포도 철에만' },
  { id: 'grandpaFig', npc: 'grandpa', label: '무화과 사기', pay: {}, coins: 3, get: { fig: 1 } },
  { id: 'childLesson', npc: 'child', label: '글자 가르쳐 주기', pay: {}, get: {}, getCoins: 5, minutes: 30 },
  { id: 'postmanPaper', npc: 'postman', label: '편지지로 쓸 파피루스 팔기', pay: { papyrus: 1 }, get: {}, getCoins: 7 },
  { id: 'smithSoot', npc: 'smith', label: '기름 한 병 주고 그을음 받기', pay: { oil: 1 }, get: { soot: 2 } },
  { id: 'apoSeeds', npc: 'apothecary', label: '약초 씨앗 사기', pay: {}, coins: 3, get: { seedHerb: 2 } },
  { id: 'carpenterBasket', npc: 'carpenter', label: '갈대 넷으로 바구니 엮어 받기', pay: { reed: 4 }, get: { basket: 1 }, minutes: 10 },
]

export function servicesOf(npc: string): Service[] {
  return SERVICES.filter((x) => x.npc === npc)
}
