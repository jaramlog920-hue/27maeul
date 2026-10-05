// 이웃에게 배우는 생활 기술 (기획 11) — 무엇을 누구에게서 배우고, 배운 뒤 무엇이 달라지는지.
// game.ts(가구 놓기)도 읽으므로 게임 상태를 부르지 않는 자료만 둔다.
// 효과는 모습·선택지뿐: 수입·생산 배율, 필사 속도·정확성·본문 접근·제본과 연결하지 않는다.
import type { ItemId, Minigame } from './types'

export interface SkillDef {
  /** 가르쳐 줄 수 있는 이웃 (같은 작업장·같은 손일) */
  teachers: readonly string[]
  /** 실습에 쓰는 기존 손일 */
  hand: Minigame
  /** [본래 모습, 배운 모습] — 배운 뒤에는 둘 다 고를 수 있다 */
  styles: readonly [string, string]
  /** 모습이 바뀌는 실제 물건 (방 꾸미기에 놓는 기존 가구) */
  item: ItemId
  /** 고르고 만드는 곳 */
  at: 'workbench' | 'hearth'
  /** 개인 재료로 그 물건을 만들 수 있으면 재료 (없으면 모습 선택만) */
  needs?: Partial<Record<ItemId, number>>
  /** 시범에서 보여 주는 assets 소품 (styles 순서) */
  art: readonly [string, string]
}

export const FINISH_SKILL = 'carpenterFinish'

export const SKILL_DEFS: Record<string, SkillDef> = {
  // 목수: 생활 가구의 마감
  [FINISH_SKILL]: { teachers: ['carpenter'], hand: 'hold', styles: ['plain', 'warm'], item: 'stool', at: 'workbench', needs: { reed: 2 }, art: ['woodenFinishLight', 'woodenFinishDark'] },
  // 베 짜는 집: 천 색 조합 (방석)
  clothColor: { teachers: ['weaver', 'penelope'], hand: 'weave', styles: ['blue', 'rose'], item: 'cushion', at: 'workbench', needs: { wool: 2 }, art: ['clothBlue', 'clothRose'] },
  // 빵집: 간식 모양 (간식 접시)
  snackShape: { teachers: ['baker', 'wendell'], hand: 'mash', styles: ['round', 'long'], item: 'fruitBowl', at: 'hearth', needs: { barley: 1, fig: 1 }, art: ['breadRound', 'breadPlain'] },
  // 대장간: 고리(나무통 쇠테)의 매끈한 마감 — 뜨거운 쇠는 대장간 사람이 다룬다
  hookFinish: { teachers: ['smith', 'tilly'], hand: 'timing', styles: ['iron', 'copper'], item: 'barrel', at: 'workbench', art: ['ringRound', 'ringSquare'] },
  // 찻집: 찻자리 꾸미기 (주전자 색)
  teaSetting: { teachers: ['poppy'], hand: 'order', styles: ['cream', 'blue'], item: 'teapot', at: 'workbench', art: ['cupPersonal', 'teaTray'] },
  // 기름틀: 담는 그릇(물병) 꾸미기 — 목에 끈 묶기
  jarDecor: { teachers: ['presser'], hand: 'hold', styles: ['plain', 'tied'], item: 'jar', at: 'workbench', art: ['oilEmpty', 'oilFull'] },
  // 포도원: 수확 바구니 손질
  basketCare: { teachers: ['grandpa'], hand: 'weave', styles: ['plain', 'vine'], item: 'basket', at: 'workbench', needs: { reed: 3 }, art: ['basketEmpty', 'plantSupport'] },
  // 관찰 그림 이웃들: 관찰한 꽃을 말려 꾸미기 (창작 기록 — 말씀 서고와 따로)
  flowerKeep: { teachers: ['juniper', 'dexter'], hand: 'pick', styles: ['warm', 'cool'], item: 'dryFlowers', at: 'workbench', needs: { herb: 2 }, art: ['flowerDrawing', 'cloudDrawing'] },
  // 약방: 생활 화분 옮겨 담기 (치료·약효 없음)
  potTidy: { teachers: ['apothecary', 'basil'], hand: 'pick', styles: ['clay', 'stone'], item: 'pot', at: 'workbench', art: ['potGrowing', 'potNewLeaf'] },
}
export const SKILL_IDS = Object.keys(SKILL_DEFS)

/** 이 이웃이 가르쳐 줄 수 있는 기술 (한 이웃 = 한 기술) */
export function skillOf(npc: string): string | null {
  return SKILL_IDS.find((id) => SKILL_DEFS[id].teachers.includes(npc)) ?? null
}
/** 이 물건의 모습을 바꾸는 기술 */
export function skillForItem(item: ItemId): string | null {
  return SKILL_IDS.find((id) => SKILL_DEFS[id].item === item) ?? null
}
/** 방에 놓을 때 붙는 모습 — 배운 모습(두 번째)을 골라 두었을 때만 */
export function placedStyle(flags: Record<string, number>, item: ItemId): string | undefined {
  const id = skillForItem(item)
  return id && flags[`skillFinish:${item}`] === 2 ? SKILL_DEFS[id].styles[1] : undefined
}
