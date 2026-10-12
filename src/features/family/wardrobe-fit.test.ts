// 2026-10-12 휴대폰 점검 MOB-03: 옷장은 창 높이 안에서 스크롤돼야 한다 (주인공 만들기의 max-height: none이 옷장에도 걸려 위가 잘렸다)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('옷장 창에는 화면 높이 제한과 세로 스크롤이 있다', () => {
  const css = readFileSync(resolve('src/app/parts.css'), 'utf8')
  const rule = /\.dialog\.creator\.wardrobe\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
  expect(rule).toMatch(/max-height:\s*88dvh/)
  expect(rule).toMatch(/overflow-y:\s*auto/)
})
