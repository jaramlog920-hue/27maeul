import { CRAFT_ACTIONS,CRAFT_PALETTE,craftFollowupFrame,CURTAIN_COLORS,WINDOW_PALETTE,curtainRows,windowRows } from './craft-followup-art'
import { withLookDefaults } from '../engine/avatar'
function valid(rows:string[],w:number,h:number,pal:Record<string,string>){expect(rows.length).toBe(h);for(const r of rows){expect(r.length).toBe(w);for(const c of r)expect(c==='.'||c in pal,`색 ${c}`).toBe(true)}}
describe('제작·두루마리·창가 미연결 자산',()=>{
 it('인물 16동작은 네 방향 모두 크기·색·앵커가 유효하다',()=>{
  expect(CRAFT_ACTIONS.length).toBe(16)
  for(const action of CRAFT_ACTIONS)for(const d of ['down','up','left','right'] as const){const anchors=[];for(let f=0;f<4;f++){
   const a=craftFollowupFrame(action,d,f);valid(a.actor,32,32,a.palette);valid(a.propBack,32,32,CRAFT_PALETTE);valid(a.propFront,32,32,CRAFT_PALETTE);anchors.push(JSON.stringify(a.anchor))
  }expect(new Set(anchors).size).toBe(1)}
 })
 it('모든 작업물이 프레임마다 변하고 실제 인물 외형을 유지할 수 있다',()=>{
  for(const action of CRAFT_ACTIONS)expect(new Set([0,1,2,3].map(f=>craftFollowupFrame(action,'down',f).propFront.join(''))).size,action).toBeGreaterThan(1)
  const avatar=withLookDefaults({look:'m',name:'예시',skin:6,hairFront:10,top:10,bottom:2}),a=craftFollowupFrame('spinThread','right',2,avatar);valid(a.actor,32,32,a.palette)
 })
 it('두루마리 펼치기와 말기는 작업물 단계가 정확히 역순이다',()=>{
  for(let f=0;f<4;f++){
   // 받침과 두루마리만 있는 소품 레이어를 비교한다.
   expect(craftFollowupFrame('unroll','down',f).propFront).toEqual(craftFollowupFrame('roll','down',3-f).propFront)
  }
 })
 it('커튼 3색과 창문은 열기/닫기 역순이고 외곽·받침을 보존한다',()=>{
  for(const color of CURTAIN_COLORS)for(let f=0;f<4;f++){
   const rows=curtainRows(color,'open',f);valid(rows,32,16,WINDOW_PALETTE);expect(rows).toEqual(curtainRows(color,'close',3-f));expect(rows.slice(0,3)).toEqual(curtainRows(color,'open',0).slice(0,3))
  }
  expect(new Set(CURTAIN_COLORS.map(c=>curtainRows(c,'open',3).join(''))).size).toBe(3)
  for(let f=0;f<4;f++){const rows=windowRows('open',f);valid(rows,32,32,WINDOW_PALETTE);expect(rows).toEqual(windowRows('close',3-f));expect(rows.slice(28)).toEqual(windowRows('open',0).slice(28))}
  expect(windowRows('open',0)).not.toEqual(windowRows('open',3))
 })
})
