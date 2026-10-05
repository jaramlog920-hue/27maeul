// 휴대폰 키보드 맞춤 (2026-10-05 사용자: "글 치는거 누르면 하단으로 내려가서 글이 안보여"). 입력칸을 눌러 키보드가 올라오면
// 필사 화면을 키보드 위에 보이는 만큼(visualViewport)으로 줄이고, 그 안을 [머리 · 본문 칸 · 입력칸]으로 채운다 —
// 따라 쓸 절이 입력칸 바로 위에 보이고, 길잡이는 그 아래로 내려 보면 된다. 브라우저가 입력칸을 가운데로 끌어내린 스크롤은
// 키보드가 다 올라온 뒤(약 0.3초) 맨 위로 되돌린다. 키보드가 없는 컴퓨터 화면은 바뀌지 않는다.
import { useEffect, useLayoutEffect, type RefObject } from 'react'

/** 화면 높이가 이만큼(px) 넘게 줄어야 키보드가 올라온 것으로 본다 (주소창이 숨고 나타나는 정도는 무시) */
export const KB_MIN_DROP = 120
/** 키보드가 다 올라오기까지 기다리는 시간(ms) — 그 뒤에 본문이 위에 오게 스크롤을 되돌린다 */
export const KB_SETTLE_MS = 300
/** 키보드가 올라와 있을 때 필사 화면에 붙는 이름 */
export const KB_CLASS = 'copy-kb'

/** 본문 칸이 넘치면, 맞게 쓴 데까지(지금 쓰는 자리)가 칸 안에 보이도록 내린다. 처음엔 절의 첫머리부터 */
export function keepInkInView(wrap: HTMLElement) {
  if (wrap.scrollHeight <= wrap.clientHeight) return
  const done = wrap.querySelector('.copy-focus-verse:not(.copy-ghost) .copy-done-part')
  const rects = done?.getClientRects()
  const lastLine = rects && rects.length ? rects[rects.length - 1] : null
  if (!lastLine) return
  const box = wrap.getBoundingClientRect()
  // 지금 쓰는 줄 아래로 한 줄쯤 더 보이게
  const bottom = lastLine.bottom - box.top + lastLine.height
  if (bottom > wrap.clientHeight) wrap.scrollTop += bottom - wrap.clientHeight
  else if (lastLine.top < box.top) wrap.scrollTop -= box.top - lastLine.top
}

/**
 * 필사 입력칸에 키보드 맞춤을 건다.
 * - input: 따라 적기 입력칸 · work: 머리~입력칸을 묶은 칸 · verse: 본문 칸(넘치면 그 안에서 스크롤)
 * - verseKey가 바뀌면(다음 절) 본문 칸을 처음으로, matched가 늘면 쓰는 자리를 따라간다
 */
export function useKeyboardFit(
  refs: { input: RefObject<HTMLTextAreaElement | null>; work: RefObject<HTMLElement | null>; verse: RefObject<HTMLElement | null> },
  verseKey: string,
  matched: number,
) {
  const { input, work, verse } = refs
  useEffect(() => {
    const vv = globalThis.visualViewport
    const el = input.current
    const screen = work.current?.closest<HTMLElement>('.copy-focus')
    if (!vv || !el || !screen) return
    /** 키보드가 없을 때의 보이는 높이 (가장 컸던 값) */
    let base = Math.max(globalThis.innerHeight || 0, vv.height)
    let open = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const toTop = () => {
      screen.scrollTop = 0
      const wrap = verse.current
      if (wrap) {
        wrap.scrollTop = 0
        keepInkInView(wrap)
      }
    }
    const apply = () => {
      base = Math.max(base, vv.height)
      const kb = document.activeElement === el && vv.height < base - KB_MIN_DROP
      if (kb) {
        // 소수점 흔들림으로 칸이 들썩이지 않게 정수로
        screen.style.setProperty('--vvh', `${Math.round(vv.height)}px`)
        screen.style.setProperty('--vvtop', `${Math.round(vv.offsetTop)}px`)
      }
      if (kb === open) return
      open = kb
      screen.classList.toggle(KB_CLASS, kb)
      if (kb) toTop()
      else {
        screen.style.removeProperty('--vvh')
        screen.style.removeProperty('--vvtop')
      }
    }
    /** 키보드가 다 올라온 뒤 한 번 더 맞추고, 브라우저가 내려 둔 스크롤을 본문 쪽으로 되돌린다 */
    const settle = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        apply()
        if (open) toTop()
      }, KB_SETTLE_MS)
    }
    const onResize = () => {
      apply()
      if (open) settle()
    }
    const onFocus = () => {
      apply()
      settle()
    }
    const onBlur = () => {
      clearTimeout(timer)
      apply()
    }
    // 화면을 돌리면 키보드 없는 높이를 새로 잰다
    let turnTimer: ReturnType<typeof setTimeout> | undefined
    const onTurn = () => {
      clearTimeout(turnTimer)
      turnTimer = setTimeout(() => {
        if (document.activeElement !== el) base = vv.height
        apply()
      }, KB_SETTLE_MS)
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', apply)
    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)
    globalThis.addEventListener('orientationchange', onTurn)
    if (document.activeElement === el) onFocus()
    return () => {
      clearTimeout(timer)
      clearTimeout(turnTimer)
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', apply)
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
      globalThis.removeEventListener('orientationchange', onTurn)
      screen.classList.remove(KB_CLASS)
      screen.style.removeProperty('--vvh')
      screen.style.removeProperty('--vvtop')
    }
  }, [input, work, verse])

  // 다음 절: 본문 칸을 절의 첫머리로
  useLayoutEffect(() => {
    const wrap = verse.current
    if (wrap) wrap.scrollTop = 0
  }, [verseKey, verse])
  // 쓰는 동안: 키보드가 올라와 본문 칸이 좁을 때만 쓰는 자리를 따라간다
  useLayoutEffect(() => {
    const wrap = verse.current
    if (wrap?.closest(`.${KB_CLASS}`)) keepInkInView(wrap)
  }, [matched, verse])
}
