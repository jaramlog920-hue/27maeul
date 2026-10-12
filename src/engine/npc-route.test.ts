import {describe,it,expect,vi} from 'vitest'
import * as movement from './movement'
import {route} from './neighbors'
describe('막힌 주민 목적지의 길찾기',()=>{
 it('사람이 목적지에 서 있으면 다른 집의 문까지 탐색하지 않는다',()=>{
  const spy=vi.spyOn(movement,'findPath')
  try {
   expect(route({x:24,y:26},{x:30,y:25},new Set(['30,25']))).toBeNull()
   expect(spy).not.toHaveBeenCalled()
  } finally {spy.mockRestore()}
 })
 it('이미 도착한 칸이 점유됐다고 자기 자리에서 다시 길을 찾지 않는다',()=>{
  expect(route({x:30,y:25},{x:30,y:25},new Set(['30,25']))).toEqual([])
 })
})
