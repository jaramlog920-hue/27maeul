// 막힌 단추 규칙(aria-disabled + 누르면 까닭 한 줄)을 한곳에서 지킨다.
// 그냥 disabled로 두면 눌러도 아무 반응이 없어 처음 하는 사람이 "왜 안 되지?"에서 멈춘다 (2026-10-26 감사 A02)
import type { ButtonHTMLAttributes } from 'react'
import { useGame } from '../store/game-store'
import { t } from './i18n'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  /** 지금 못 하는 까닭 — null·undefined가 아니면 막힌 단추 (빈 글이면 두루 쓰는 한 줄을 띄운다) */
  why: string | null | undefined
}

export function BlockedButton({ why, onClick, ...rest }: Props) {
  const blocked = why !== null && why !== undefined
  return (
    <button
      {...rest}
      aria-disabled={blocked ? true : undefined}
      onClick={(e) => (blocked ? useGame.getState().say(why || t('why.notNow'), 2800) : onClick?.(e))}
    />
  )
}
