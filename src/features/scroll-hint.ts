import { T } from '../content/text'

/** 스크롤되는 창: 모든 창(.dialog)과 창 안의 본문 칸 */
const SCROLLERS = '.dialog, .passage-body'
/** 끝에서 이만큼(px) 안이면 끝까지 내린 것으로 본다 */
const END_SLACK = 4

/** 아래에 더 있으면 class `more-below`를 붙인다 (CSS가 창 아래에 옅은 그라데이션과 안내 문구를 그린다) */
export function markMoreBelow(el: HTMLElement) {
  const more = el.scrollHeight - el.scrollTop - el.clientHeight > END_SLACK
  el.classList.toggle('more-below', more)
  if (more && el.dataset.more !== T.ui.moreBelow) el.dataset.more = T.ui.moreBelow
}

/**
 * root 안의 스크롤되는 창을 모두 살핀다: 스크롤할 때, 화면 크기가 바뀔 때, 창의 내용이 바뀔 때.
 * 그만 살필 때 부를 함수를 돌려준다.
 */
export function watchScrollHints(root: HTMLElement): () => void {
  const update = () => root.querySelectorAll<HTMLElement>(SCROLLERS).forEach(markMoreBelow)
  // scroll은 버블되지 않으므로 잡는 단계에서 듣는다
  const onScroll = (e: Event) => {
    if (e.target instanceof HTMLElement && e.target.matches(SCROLLERS)) markMoreBelow(e.target)
  }
  root.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', update)
  // 탭을 바꾸거나 글이 더해지면 길이가 바뀐다 (class를 바꾸는 것은 살피지 않으므로 되먹임이 없다)
  const mutations = new MutationObserver(update)
  mutations.observe(root, { childList: true, subtree: true, characterData: true })
  const sizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
  sizes?.observe(root)
  update()
  // 글꼴·그림이 늦게 자리 잡는 경우를 위해 한 번 더
  const frame = requestAnimationFrame(update)
  return () => {
    root.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', update)
    mutations.disconnect()
    sizes?.disconnect()
    cancelAnimationFrame(frame)
  }
}
