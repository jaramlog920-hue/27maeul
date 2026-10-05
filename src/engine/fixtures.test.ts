import { CONTENT, piecesOf } from '../content/catalog'
import { bindMinutes, canSeal, chapterCost, chooseBook, newGame, sealBook, setArrangement, submitChapter, lightLamp, finishCraft } from './game'
import { deserialize, serialize } from './save'
import { canonicalOrder } from './scroll'
import { currentChapter } from './offers'
import type { GameState } from './game'
const at=(s:GameState,minute:number):GameState=>({...s,clock:{...s.clock,minute}})

describe('기록 설비 제거', () => {
  it('옛 설비가 있어도 잉크 제조량과 필사 속도에 효과가 없다', () => {
    const s=newGame(CONTENT);const old={...s,inv:{soot:2,water:2},flags:{...s.flags,'fix:inkStand':1,'fix:desk':2}};
    expect(finishCraft(old,'ink').inv.ink).toBe(1);expect(bindMinutes(old)).toBe(bindMinutes(s));
  });
  it('기름 없이 밤에 조명이 켜지고 재고가 유지된다', () => {
    const s=at({...newGame(CONTENT),inv:{oil:2}},1200);const lit=lightLamp(s);expect(lit.inv).toEqual(s.inv);expect(lit.lampLitDay).toBe(s.clock.day);
  });
  it('옛 설비 주문은 불러온 뒤 새로 설치되지 않는다', () => {
    const s=newGame(CONTENT);const old={...s,flags:{...s.flags,'fixOrder:lamp':1},scenes:['fixed:lamp:1']};const loaded=deserialize(serialize(old),CONTENT)!;
    expect(loaded.flags['fixOrder:lamp']).toBeUndefined();expect(loaded.scenes).not.toContain('fixed:lamp:1');
    expect(loaded.coins).toBe(s.coins+60);expect(deserialize(serialize(loaded),CONTENT)!.coins).toBe(loaded.coins);
  });
});

describe('장 엮기와 봉인 (정성 등급은 없앴다)', () => {
  it('등불·좋은 파피루스와 상관없이 한 장은 늘 파피루스 하나·잉크 하나, 정성 기록은 남지 않는다', () => {
    let s = chooseBook(newGame(CONTENT), 'mk', CONTENT)
    const pieces = piecesOf('mk')
    const ch = currentChapter(pieces, [])!
    s = { ...setArrangement(s, 'mk', ch, canonicalOrder(pieces, ch)), collected: pieces.filter((p) => p.chapter === ch).map((p) => p.id) }
    s = { ...at(s, 10 * 60), inv: { papyrus: 1, ink: 1, finePapyrus: 1 }, flags: { ...s.flags, useFine: 1 } }
    expect(chapterCost(s)).toEqual({ papyrus: 1, ink: 1 })
    const { state, result } = submitChapter(s, 'mk', ch, CONTENT)
    expect(result.kind).toBe('done')
    expect(state.careful.mk ?? []).toEqual([])
    expect(state.inv.finePapyrus).toBe(1)
  })

  it('봉인: 서고에 꽂은 책을 봉인용 밀랍으로 한 번', () => {
    const s = { ...newGame(CONTENT), shelved: { mk: 2 as const }, inv: { sealWax: 1 } }
    expect(canSeal({ ...s, shelved: {} }, 'mk')).toBe('notShelved')
    expect(canSeal({ ...s, inv: {} }, 'mk')).toBe('noWax')
    const sealed = sealBook(s, 'mk')
    expect(sealed.sealed).toEqual(['mk'])
    expect(sealed.inv.sealWax ?? 0).toBe(0)
    expect(canSeal(sealed, 'mk')).toBe('sealed')
  })
})
