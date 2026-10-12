// 기존 생활 시나리오는 개편 이전 저장의 권한으로 검증한다. 새 해금은 late-growth.test.ts에서 검증한다.
import { legacyGame as newGame } from './growth-test-support'
import { describe, expect, it } from 'vitest'
import { CONTENT } from '../content/catalog'
import { ADULT_AT, HELPER_AT, TODDLER_AT, childMode, childStage, newChild } from './child'
import { canKidAct, deskKidReady, deskKidWith, doKidAct } from './family'

import { deserialize, serialize } from './save'

describe('아이 성장 경계와 재접속',()=>{
  it.each([
    [TODDLER_AT-1,'baby',false],
    [TODDLER_AT,'toddler',true],
    [HELPER_AT-1,'toddler',true],
    [HELPER_AT,'helper',true],
    [ADULT_AT-1,'helper',true],
    [ADULT_AT,'adult',false],
  ] as const)('나이 %i일: %s 단계의 활동 가능 여부는 저장 전후 같다',(age,stage,ready)=>{
    const base=newGame(CONTENT)
    const day=age+1
    const s={...base,scenes:[],clock:{day,minute:600},child:{...newChild(1,base.stats,undefined),mode:'roam' as const},flags:{...base.flags,deskKidDay:day}}
    const restored=deserialize(serialize(s),CONTENT)!
    for(const g of [s,restored]) {
      expect(childStage(g.child!,day)).toBe(stage)
      expect(deskKidReady(g)).toBe(ready)
      expect(deskKidWith(g)).toBe(ready)
      expect(canKidAct(g,'read')).toBe(ready?null:stage==='baby'?'baby':'grown')
      if(!ready) expect(doKidAct(g,'read',CONTENT)).toBeNull()
      const mode=childMode(g.child!,day)
      expect(mode).toBe(stage==='baby'?'cradle':stage==='toddler'?'follow':'roam')
    }
  })
  it('성인이 된 날에는 예전 함께하기 입력으로 경험치·물건·추억을 얻지 않는다',()=>{
    const base=newGame(CONTENT)
    const young={...base,scenes:[],clock:{day:ADULT_AT,minute:600},child:newChild(1,base.stats,undefined)}
    expect(canKidAct(young,'make')).toBeNull()
    const grown=deserialize(serialize({...young,clock:{day:ADULT_AT+1,minute:600}}),CONTENT)!
    for(const act of ['read','make','cook','walk','story'] as const) {
      expect(canKidAct(grown,act)).toBe('grown')
      expect(doKidAct(grown,act,CONTENT)).toBeNull()
    }
  })
})
