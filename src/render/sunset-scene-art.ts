import {drawSunsetBackground} from './sunset-background'
import type { Avatar } from '../engine/avatar'
import { drawScenicBench } from './stargazing-art'
import type { Who } from './sprites'

/** 호숫가 정자에서 보는 노을. 고정 화소의 하늘과 물결만 느리게 변한다. */
export function drawSunset(g: CanvasRenderingContext2D, w: number, h: number, seconds: number, avatar: Avatar | null, companion: Avatar | null = null, companionWho: Who = 'writer') {
  drawSunsetBackground(g,w,h,seconds)
  drawScenicBench(g, Math.round(w * .5), Math.round(h * .88), avatar, companion, true, 'writer', companionWho)
}
