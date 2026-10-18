import type {GameState} from '../engine/game'
import {childStage} from '../engine/child'
import {playerChildAvatar,playerChildSprite} from './player-child-look'

/** 선택 중인 아이가 막내여도 출생 순서와 각 아이의 옷차림으로 배역을 정한다. */
export function birthFamilyCast(game:Pick<GameState,'child'|'siblings'|'avatar'|'looks'|'clock'>){
 const kids=[...(game.child?[game.child]:[]),...(game.siblings??[])].sort((a,b)=>a.born-b.born)
 const describe=(kid:typeof game.child)=>{
  const dressed=kid===game.child?game.looks?.child:kid?.wardrobe
  const avatar=playerChildAvatar({child:kid,avatar:game.avatar,looks:dressed?{child:dressed as NonNullable<GameState['looks']>['child']}:undefined})
  const stage=kid?childStage(kid,game.clock.day):'helper'
  return {avatar,...playerChildSprite(stage,!!dressed),baby:stage==='baby'}
 }
 return {firstborn:describe(kids[0]??null),older:describe(kids.length>1?kids[0]:null),newborn:describe(kids.at(-1)??null)}
}
