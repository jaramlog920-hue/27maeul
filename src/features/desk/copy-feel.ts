// 필사 손맛 (2026-10-04): 조용한 필사 화면에 어울리는 작은 반응. 점수·연속 횟수 같은 숫자는 띄우지 않는다.
// 글자마다 아주 작은 펜 긁는 소리(높이를 조금씩 달리, 빠르게 써도 겹쳐 시끄럽지 않게).
// 절마다 진동은 뺐다 (2026-10-14 사용자 — 아이폰 웹에서는 울리지 않음).
// 설정에서 펜 소리를 끌 수 있다 (localStorage, 기본은 켬). 움직임 줄이기를 켠 기기에서는 흔들림·날아가기를 뺀다.
import { sfx } from '../../audio/sound'

const SOUND_KEY = 'twenty-seven/copy-sound'

function readOn(key: string): boolean {
  try {
    return globalThis.localStorage?.getItem(key) !== '0'
  } catch {
    return true
  }
}
function writeOn(key: string, on: boolean) {
  try {
    globalThis.localStorage?.setItem(key, on ? '1' : '0')
  } catch {
    /* 저장할 수 없어도 이번 판에는 적용 */
  }
  if (key === SOUND_KEY) soundOn = on
}
let soundOn = readOn(SOUND_KEY)

/** 글자마다 펜 긁는 소리 */
export function copySoundOn(): boolean {
  return soundOn
}
export function setCopySound(on: boolean) {
  writeOn(SOUND_KEY, on)
}
/** 저장된 설정을 다시 읽는다 (테스트에서 localStorage를 바꾼 뒤) */
export function reloadCopyFeel() {
  soundOn = readOn(SOUND_KEY)
  lastQuill = -Infinity
}

/** 펜 소리 사이의 가장 짧은 틈(ms) — 빠르게 써도 소리가 쌓이지 않게 */
export const QUILL_GAP_MS = 70
let lastQuill = -Infinity
function now(): number {
  return globalThis.performance?.now?.() ?? Date.now()
}

/** 맞게 쓴 글자 하나(또는 한꺼번에 확정된 몇 글자) — 높이를 ±12% 안에서 조금씩 달리 */
export function quillScratch(at = now(), rand: () => number = Math.random) {
  if (!soundOn) return
  if (at - lastQuill < QUILL_GAP_MS) return
  lastQuill = at
  sfx('quill', 0.88 + rand() * 0.24)
}


/** 움직임 줄이기 (흔들림·날아가기 대신 살짝 나타나고 사라지게) */
export function prefersStill(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  } catch {
    return false
  }
}
