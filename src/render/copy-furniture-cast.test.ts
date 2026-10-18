import { copyFurnitureCast } from './copy-furniture-cast'
import { newGame, childTile } from '../engine/game'
import { CONTENT } from '../content/catalog'
import { withLookDefaults } from '../engine/avatar'
import { freshStats } from '../engine/stats'
import { TODDLER_AT } from '../engine/child'

it('does not invent participants, and uses the actual family appearance only nearby',()=>{
  const base=newGame(CONTENT,withLookDefaults({name:'보호자',look:'f',skin:3}))
  expect(copyFurnitureCast(base,{item:'copyBabyWash',x:1,y:1})).toEqual({})
  const s={...base,room:[{item:'homeCradle' as const,x:20,y:113}],child:{name:'아이',look:'boy' as const,born:base.clock.day,stats:freshStats(),lean:null},looks:{...base.looks,child:withLookDefaults({name:'아이',look:'m',skin:0,top:8,hairBack:0})}}
  const at=childTile(s)!
  const cast=copyFurnitureCast(s,{item:'copyBabyWash',...at})
  expect(cast.child?.stage).toBe('baby')
  expect(cast.child?.avatar.skin).toBe(3)
  expect(cast.child?.avatar.top).toBe(8)
  expect(copyFurnitureCast(s,{item:'copyBabyWash',x:at.x+5,y:at.y}).child).toBeUndefined()
  expect(copyFurnitureCast(s,{item:'copyChildPicture',...at}).child).toBeUndefined()
  expect(copyFurnitureCast(s,{item:'copyBabyRail',...at}).child).toBeUndefined()
  expect(copyFurnitureCast(s,{item:'copyBabyMeal',...at}).child).toBeUndefined()
  const older={...s,clock:{...s.clock,day:s.child.born+TODDLER_AT},child:{...s.child,mode:'home' as const}}
  const toddlerAt=childTile(older)!
  expect(copyFurnitureCast(older,{item:'copyBabyMeal',...toddlerAt}).child?.stage).toBe('toddler')
  expect(copyFurnitureCast(s,{item:'copyPetWater',...at}).pet).toBeUndefined()
})
