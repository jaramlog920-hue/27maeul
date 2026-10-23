import type {GameState} from './game'
import {otBookFinished} from './books'
import {OT_BOOKS, OT_ROOMS} from './ot-books'
import {BOOKS} from './types'

/** 실제 완료 전환에서만 예약한다. 이미 완성한 옛 저장에는 소급하지 않는다. */
export function otMilestoneScenes(before:GameState,next:GameState):GameState {
  let state=next
  const enqueue=(id:string)=>{
    const scenes=[...state.scenes],at=scenes.lastIndexOf('bookBound')
    if(at>=0)scenes.splice(at,1,id);else scenes.push(id)
    return scenes
  }
  const first=OT_BOOKS.find(book=>!otBookFinished(before,book)&&otBookFinished(next,book))
  if(first&&!before.flags.firstOtBookScene&&!OT_BOOKS.some(book=>otBookFinished(before,book)))
    state={...state,scenes:enqueue('firstOtBook'),flags:{...state.flags,firstOtBookScene:1,firstOtBookIndex:OT_BOOKS.indexOf(first)}}
  if(!before.flags.psalmRestScene&&!otBookFinished(before,'psa')&&otBookFinished(next,'psa'))
    state={...state,scenes:enqueue('psalmRest'),flags:{...state.flags,psalmRestScene:1}}
  // 구약 서고 방 하나(범위)를 다 채운 날 (2026-10-21 점검: 929장 동안 중간에 돌려받는 게 거의 없었다)
  for(const room of OT_ROOMS){
    const key=`otRoomScene:${room.id}`
    if(before.flags[key]||room.books.every(b=>otBookFinished(before,b))||!room.books.every(b=>otBookFinished(next,b)))continue
    state={...state,scenes:enqueue(`otRoom:${room.id}`),flags:{...state.flags,[key]:1}}
  }
  return state
}

/** 실제로 첫 책을 놓았을 때만. 내리기·가득 찬 책장·미완성 책은 제외한다. */
export function homeBookMilestone(before:GameState,next:GameState):GameState {
  if(before.flags.firstHomeBookScene||before.homeShelf.length||next.homeShelf.length!==1)return next
  const book=next.homeShelf[0]
  return {...next,scenes:[...next.scenes,'firstHomeBook'],flags:{...next.flags,firstHomeBookScene:1,firstHomeBookIndex:BOOKS.indexOf(book)}}
}

