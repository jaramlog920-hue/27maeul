// 직접 만든 음식의 가방 아이콘 (계획 16 작업 25): assets/cooking 도트(cooking-art)를 8×8로 줄여 그대로 쓴다 — 새 그림을 따로 그리지 않는다.
// sprites.ts가 cooking-art를 직접 부르면 서로를 부르게 되어, 아이콘을 쓰는 곳(ItemIcon·renderer)이 이 파일을 한 번 불러 등록한다.
import { COOKING_PROPS } from './cooking-art'
import { iconFromArt } from './furniture-art'
import { ICONS } from './sprites'

export const DISH_ICON_ART: Record<string, string> = { beanDish: 'beanBowl', herbBeanDish: 'herbBeanBowl', honeyBread: 'honeyBread', figPlate: 'figPlate', herbTea: 'herbTea' }
for (const [item, art] of Object.entries(DISH_ICON_ART)) ICONS[item] = iconFromArt(COOKING_PROPS[art])
