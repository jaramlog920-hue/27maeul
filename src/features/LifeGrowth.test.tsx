import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, it, expect } from 'vitest'
import { CONTENT } from '../content/catalog'
import { newGame } from '../engine/game'
import { useGame } from '../store/game-store'
import { CookingView } from './cooking/CookingView'
import { ClubForm } from './clubs/ClubForm'
import { TravelView } from './talk/TravelView'
import { Library } from './library/Library'
import { FestList } from './fest/FestList'
import { Settings } from './play/Settings'

afterEach(cleanup)
function load(chapters: number) {
  const game = newGame(CONTENT)
  game.progress.mt.completed = Array.from({ length: chapters }, (_, i) => i + 1)
  useGame.getState().load(game)
}
it('요리 체험에는 허브차와 정식 해금 안내가 보인다', () => {
  load(15)
  render(<CookingView />)
  expect(screen.getByRole('status')).toHaveTextContent('18장')
  expect(screen.getByRole('button', { name: '허브 차' })).toBeInTheDocument() // 요리 목록은 아이콘 칸 (2026-10-12)
  expect(screen.queryByRole('button', { name: '콩 요리' })).toBeNull()
})
it('소모임 체험의 활동 선택은 차 모임만 보인다', () => {
  load(20)
  render(<ClubForm onClose={() => undefined} />)
  expect(screen.getByRole('status')).toHaveTextContent('25장')
  expect(screen.getByRole('button', { name: '차 모임' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: '바느질' })).toBeNull()
})
it('아직 열리지 않은 여행은 필요한 장 수를 알려 준다', () => {
  load(0)
  render(<TravelView />)
  expect(screen.getByRole('status')).toHaveTextContent('40장')
  expect(screen.getAllByRole('button', { name: '떠나기' }).every(b => b.hasAttribute('disabled'))).toBe(true)
})

it('7장 기록 꾸러미는 제본·서고 전시와 별개로 보인다', () => {
  load(6)
  const view = render(<Library />)
  expect(screen.queryByRole('img', { name: /기록 꾸러미/ })).toBeNull()
  view.unmount()
  load(7)
  render(<Library />)
  expect(screen.getByRole('img', { name: '완료한 7장의 기록 꾸러미' })).toBeInTheDocument()
  expect(Object.keys(useGame.getState().game.shelved)).toHaveLength(0)
})
it('행사와 자율 생활의 잠긴 화면에 필요한 장 수가 보인다', () => {
  load(0)
  const view = render(<FestList />)
  expect(screen.getByText('신약 85장을 마치면 열려요.')).toBeInTheDocument()
  view.unmount()
  render(<Settings />)
  fireEvent.click(screen.getByRole('tab', { name: '게임' }))
  expect(screen.getByText('신약 75장을 마치면 열려요.')).toBeInTheDocument()
})
