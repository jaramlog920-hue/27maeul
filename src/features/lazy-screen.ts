// 나중에 받는 화면 (React.lazy). 한 번 받은 화면은 그다음부터 바로 그린다 — 테스트는 preloadScreens로 미리 받아 둔다
import { createElement, lazy, type ComponentType } from 'react'

type Loader<P> = () => Promise<ComponentType<P>>
const loaders: (() => Promise<unknown>)[] = []

export function lazyScreen<P extends object>(load: Loader<P>): ComponentType<P> {
  let ready: ComponentType<P> | null = null
  const fetch = () => load().then((c) => (ready = c))
  loaders.push(fetch)
  const Lazy = lazy(() => fetch().then((c) => ({ default: c })))
  const Screen = (props: P) => createElement((ready ?? Lazy) as ComponentType<P>, props)
  return Screen
}

/** 나중에 받는 화면을 모두 미리 받는다 (테스트 준비) */
export function preloadScreens(): Promise<unknown> {
  return Promise.all(loaders.map((f) => f()))
}
