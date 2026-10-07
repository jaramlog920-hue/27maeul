import { VISITOR_KINDS } from './village-followup-art'
import { visitorWalkFrame,joinedPathRows,pathShapeLabel,JOIN_PATH_PALETTE,EVENT_MEMORIES,eventMemoryRows,RANGE_SHELVES,rangeShelfRows,ARCHIVE_PROP_PALETTE,GUEST_GIFT_IDS,guestGiftIconRows } from './archive-followup-art'
const dirs=['down','up','left','right'] as const
function valid(rows:string[],w:number,h:number,pal:Record<string,string>){expect(rows.length).toBe(h);for(const row of rows){expect(row.length).toBe(w);for(const c of row)expect(c==='.'||c in pal,`색 ${c}`).toBe(true)}}
describe('서고·길·정원 자산 후속',()=>{
 it('방문객은 기존 외형으로 네 방향에서 발을 번갈아 움직이고 앵커가 고정이다',()=>{
  for(const kind of VISITOR_KINDS)for(const d of dirs){const anchors=[];for(let f=0;f<4;f++){const a=visitorWalkFrame(kind,d,f);valid(a.actor,24,24,a.palette);anchors.push(JSON.stringify(a.anchor))}expect(new Set(anchors).size).toBe(1);expect(visitorWalkFrame(kind,d,1).actor).not.toEqual(visitorWalkFrame(kind,d,3).actor)}
 })
 it('모래·돌 각각 16개 이음 조각이 있고 연결 방향만 타일 경계에 닿는다',()=>{
  for(const material of ['sand','stone'] as const)for(let mask=0;mask<16;mask++){
   const rows=joinedPathRows(material,mask);valid(rows,16,16,JOIN_PATH_PALETTE)
   const edges=[rows[0].slice(4,12),rows.slice(4,12).map(r=>r[15]).join(''),rows[15].slice(4,12),rows.slice(4,12).map(r=>r[0]).join('')]
   for(const [i,bit]of [1,2,4,8].entries())expect(edges[i].includes('.')).toBe(!(mask&bit))
  }
  expect([0,1,5,3,7,15].map(pathShapeLabel)).toEqual(['독립 칸','끝 조각','일자','모서리','T자','교차'])
 })
 it('기념물 6종은 서로 구별되고 1칸 안에서 작은 꽃 움직임을 가진다',()=>{
  expect(new Set(EVENT_MEMORIES.map(k=>eventMemoryRows(k).join(''))).size).toBe(6)
  for(const k of EVENT_MEMORIES)for(let f=0;f<4;f++)valid(eventMemoryRows(k,f),16,16,ARCHIVE_PROP_PALETTE)
 })
 it('범위 책장 4종은 각각 다른 그림이며 0~12칸 채움이 유효하다',()=>{
  expect(new Set(RANGE_SHELVES.map(k=>rangeShelfRows(k).join(''))).size).toBe(4)
  for(const k of RANGE_SHELVES){for(let n=0;n<=12;n++)valid(rangeShelfRows(k,n),16,16,ARCHIVE_PROP_PALETTE);expect(rangeShelfRows(k,0)).not.toEqual(rangeShelfRows(k,12));expect(rangeShelfRows(k,-4)).toEqual(rangeShelfRows(k,0));expect(rangeShelfRows(k,30)).toEqual(rangeShelfRows(k,12))}
 })
 it('선물 3종은 8px·16px 모두 별도의 손그림이고 서로 다르다',()=>{
  for(const size of [8,16] as const){expect(new Set(GUEST_GIFT_IDS.map(id=>guestGiftIconRows(id,size).join(''))).size).toBe(3);for(const id of GUEST_GIFT_IDS)valid(guestGiftIconRows(id,size),size,size,ARCHIVE_PROP_PALETTE)}
 })
})
