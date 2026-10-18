import {storyLocationContext,type StoryLocationState} from './story-location-context'
import {storyLayoutObjects,storyNewlandBuildings,drawStoryNewlandBuildings,drawStoryRoomLayout} from './story-layout-art'
import {HOUSE_ROOFS,HOUSE_WALLS} from '../engine/newland-house-look'
import {drawSharedStoryBackground} from './shared-story-background'
import {ROOMS} from '../engine/world'
import {INTERIOR_ENTRY,ROOM_SLOTS} from '../engine/newland-config'
import {facingArt} from './furniture-facing'
import {FURNITURE_ART,STYLE_PALETTES} from './furniture-art'
import {storyRoomFurnitureArt,enlargeStoryOrnament} from './story-room-furniture'

const state=(x:number,y:number,extra:Partial<StoryLocationState>={}):StoryLocationState=>({player:{x,y,facing:'down',path:[],walkTime:0},clock:{day:3,minute:900},...extra})
const build={id:'b3',kind:'home' as const,x:5,y:10,facing:'left' as const,state:'done' as const,orderedDay:1,paid:{coins:0,items:{}},slot:0,refunded:false,owner:'g-0042'}
it.each([[320,108],[320,374],[320,83]])('attaches the real back-row furniture to the visible wall at %i × floor %i',(w,ground)=>{
 const c=storyLocationContext(state(20,112)),before=JSON.stringify(c),objects=storyLayoutObjects(c,w,ground),seam=ground-42
 for(const id of ['homeBed','homeShelf','homeHearth']){
  const item=objects.find(o=>o.id===id)!
  expect(item.y).toBeLessThan(seam)
  expect(item.y+item.rows.length).toBe(seam+6)
 }
 const front=objects.find(o=>o.id==='homeDesk')!
 expect(front.y+front.rows.length).toBe(seam+30)
 // Walking within the same room must not detach the furnishings from its wall.
 for(const y of [111,113,114]){
  const moved=storyLayoutObjects(storyLocationContext(state(20,y)),w,ground)
  expect(moved.map(o=>[o.id,o.y])).toEqual(objects.map(o=>[o.id,o.y]))
 }
 const shifted={...c,layout:{...c.layout!,viewOffset:{x:3,y:12}}}
 const pixels:unknown[][]=[]
 drawStoryRoomLayout((x,y,color,a=1,b=1)=>pixels.push([x,y,color,a,b]),w,693,ground,shifted)
 expect(pixels).toContainEqual([0,seam+12,'#c5a17d',w,693-seam-12])
 expect(JSON.stringify(c)).toBe(before)
})
it.each([[320,180,108],[320,693,374],[320,120,83]])('keeps map perimeter walls off the event-camera floor at %i × %i', (w,h,ground)=>{
 const c=storyLocationContext(state(20,112,{homeLevel:1,room:[],homeWalls:{built:['20,111','20,112'],removed:[]}}))
 const paint=(context:typeof c)=>{
  const pixels=new Map<string,string>()
  drawStoryRoomLayout((x,y,color,width=1,height=1)=>{
   for(let yy=Math.max(0,y);yy<Math.min(h,y+height);yy++)for(let xx=Math.max(0,x);xx<Math.min(w,x+width);xx++)pixels.set(`${xx},${yy}`,color)
  },w,h,ground,context)
  return pixels
 }
 const before=JSON.stringify(c),pixels=paint(c)
 expect(pixels).toEqual(paint({...c,layout:{...c.layout!,roomTiles:undefined,homeWalls:undefined}}))
 expect(pixels.get('0,0')).toBe('#dfd2b9')
 const floorColors=new Set<string|undefined>()
 for(let y=ground-42;y<h;y++)for(let x=0;x<w;x++)floorColors.add(pixels.get(`${x},${y}`))
 expect([...floorColors].sort()).toEqual(['#b18a64','#c5a17d'])
 expect(JSON.stringify(c)).toBe(before)
})
it('uses moved home furniture once and keeps removed original fixtures removed',()=>{
 const s=state(20,112,{room:[{item:'homeDesk',x:21,y:113,facing:'left'},{item:'cushion',x:19,y:112,finish:'rose'}]})
 const before=JSON.stringify(s),c=storyLocationContext(s),objects=storyLayoutObjects(c,320,108)
 expect(c.layout?.fixed).toEqual([])
 expect(objects.map(o=>o.id).sort()).toEqual(['cushion','homeDesk'])
 expect(objects.find(o=>o.id==='homeDesk')?.rows).toEqual(storyRoomFurnitureArt('homeDesk','left')!.rows)
 const desk=objects.find(o=>o.id==='homeDesk')!
 expect(desk.rows[0].length).toBeGreaterThan(16)
 expect(desk.rows[0].length).toBeLessThan(storyRoomFurnitureArt('homeDesk','down')!.rows[0].length)
 expect(desk.y+desk.rows.length).toBe(88)
 expect(objects.find(o=>o.id==='cushion')?.palette).toMatchObject(STYLE_PALETTES.cushion.rose)
 expect(c.layout?.furniture[0]).not.toBe(s.room![0])
 expect(JSON.stringify(s)).toBe(before)
 expect(storyLayoutObjects(storyLocationContext({...s,room:[]}),320,108)).toEqual([])
})
it('filters home furniture to the actual extension part instead of the absent bounding-box corner',()=>{
 const s=state(20,106,{homeLevel:1,room:[{item:'jar',x:20,y:105},{item:'pot',x:20,y:112}]})
 expect(storyLocationContext(s).layout?.furniture.map(f=>f.item)).toEqual(['jar'])
 expect(storyLocationContext(state(10,106,{homeLevel:3})).layout?.bounds).toBeNull()
})
it.each([[320,108],[320,374],[320,83]])('keeps the actual spouse-room window on the event back wall at %i × floor %i',(w,ground)=>{
 for(const y of [105,106,107,108,109]){
  const s=state(21,y,{homeLevel:1,room:[]}),before=JSON.stringify(s),c=storyLocationContext(s)
  const window=storyLayoutObjects(c,w,ground).find(o=>o.id==='N')!
  expect(window).toBeDefined()
  expect(window.y+window.rows.length).toBe(ground-44)
  const view={...c,layout:{...c.layout!,viewOffset:{x:12,y:24}}}
  const moved=storyLayoutObjects(view,w,ground).find(o=>o.id==='N')!
  expect(moved.y).toBe(window.y+24);expect(moved.x).toBe(window.x+12)
  expect(moved.rows).toEqual(window.rows)
  expect(JSON.stringify(s)).toBe(before)
 }
})
it.each(['child','apothecary','fisher','beekeeper','acts','letters','rev','hebJud'])('uses original %s room contents rather than a generic invented family bookcase',owner=>{
 const room=ROOMS.find(r=>r.owner===owner)!,c=storyLocationContext(state(room.sit.x,room.sit.y))
 expect(c.layout?.fixed).toEqual(room.things.map(([x,y,ch])=>({x:room.x0+x,y:room.y0+y,ch})))
 expect(c.layout?.furniture.map(f=>f.item)).toEqual(room.decor.map(d=>d[2]))
 expect(c.layout?.bounds).toEqual({x0:room.x0,y0:room.y0,w:room.w,h:room.h})
})
it('preserves original mirrored decor and uses a native directional saved teapot',()=>{
 const room=ROOMS.find(r=>r.owner==='child')!,c=storyLocationContext(state(room.sit.x,room.sit.y)),objects=storyLayoutObjects(c,320,108)
 const flipped=c.layout!.furniture.find(f=>f.mirrorX)!
 expect(flipped.item).toBe('chair')
 expect(objects.some(o=>o.id==='chair'&&JSON.stringify(o.rows)===JSON.stringify(storyRoomFurnitureArt('chair','right')!.rows.map(r=>[...r].reverse().join(''))))).toBe(true)
 const custom=storyLocationContext(state(20,112,{room:[{item:'teapot',x:20,y:111,facing:'right',on:true}]}))
 expect(storyLayoutObjects(custom,320,108)[0].rows).toEqual(enlargeStoryOrnament(facingArt('teapot','right')?.rows??FURNITURE_ART.teapot.rows))
})
it('reads only the actual newland room key, with detached objects and no fabricated furnishings',()=>{
 const slot=ROOM_SLOTS[0],s=state(slot.entry.x,slot.entry.y,{map:'newland',newland:{builds:[build],tiles:{},nextId:4,settledDay:2},rooms:{'newland:b3':[{item:'jar',x:slot.x0+2,y:slot.y0+3}],'newland:b7':[{item:'pot',x:1,y:1}]}})
 const before=JSON.stringify(s),c=storyLocationContext(s)
 expect(c.layout?.furniture.map(f=>f.item)).toEqual(['jar'])
 expect(storyLayoutObjects(c,320,108).map(o=>o.id)).toEqual(['jar'])
 expect(c.layout?.builds[0]).not.toBe(build)
 expect(JSON.stringify(s)).toBe(before)
 expect(storyLocationContext({...s,rooms:{}}).layout?.furniture).toEqual([])
})
it('keeps archive saved furniture separate from fixed desk and shelf',()=>{
 const c=storyLocationContext(state(INTERIOR_ENTRY.x,INTERIOR_ENTRY.y,{map:'newland',rooms:{'newland:archive':[{item:'jar',x:18,y:33}]}}))
 expect(c.layout?.furniture).toEqual([{item:'jar',x:18,y:33}])
 expect(c.layout?.fixed.map(f=>f.ch)).toEqual(['d','s'])
})
it('lays installed rugs on the ground before solid furniture rather than placing an upright rug behind faces',()=>{
 const c=storyLocationContext(state(20,112,{room:[{item:'roundRug',x:20,y:111},{item:'table',x:21,y:112}]})),objects=storyLayoutObjects(c,320,108)
 const rug=objects.find(o=>o.id==='roundRug')!
 expect(rug.floor).toBe(true);expect(rug.y).toBeGreaterThanOrEqual(102)
 expect(objects[0]).toBe(rug)
})
it('renders original empty ground, construction and completed buildings according to the snapshot',()=>{
 const empty=storyLocationContext(state(5,10,{map:'newland'}))
 expect(storyNewlandBuildings(empty,320,108)).toEqual([])
 for(const phase of ['ordered','building','done'] as const){
  const c=storyLocationContext(state(5,10,{map:'newland',newland:{builds:[{...build,state:phase}],tiles:{},nextId:4,settledDay:2}}))
  const objects=storyNewlandBuildings(c,320,108)
  expect(objects.map(o=>[o.id,o.state])).toEqual([['b3',phase]])
  expect(objects[0].rows.length).toBe(64)
  expect(Number.isInteger(objects[0].x)&&Number.isInteger(objects[0].y)).toBe(true)
 }
})
it('keeps unlock snapshots detached and makes real room night colors differ without state writes',()=>{
 const s=state(20,112,{room:[],flags:{'unlock:lanterns':1,unrelated:4}}),c=storyLocationContext(s),before=JSON.stringify(s)
 expect(c.layout?.unlocks).toEqual({'unlock:lanterns':1})
 const colors=(minute:number)=>{const list:string[]=[];const g={fillStyle:'',fillRect(this:{fillStyle:string}){list.push(this.fillStyle)}} as unknown as CanvasRenderingContext2D;drawSharedStoryBackground(g,320,180,0,{...c,minute});return list}
 expect(colors(900)).not.toEqual(colors(1300))
 expect(JSON.stringify(s)).toBe(before)
})
it('uses the live native house renderer with saved width, roof, wall, window and trim choices',()=>{
 const look={roof:8,wall:1,window:1,trim:1},b={...build,size:8,look},s=state(7,14,{map:'newland',newland:{builds:[b],tiles:{},nextId:4,settledDay:2}}),before=JSON.stringify(s),c=storyLocationContext(s)
 const objects=storyNewlandBuildings(c,320,108),house=objects.find(o=>o.id==='b3')!
 expect(house.width).toBe(128);expect(house.house).toMatchObject({width:8,look})
 expect(c.layout?.builds[0].look).not.toBe(look)
 const colors:string[]=[],widths:number[]=[]
 drawStoryNewlandBuildings((_x,_y,color,w=1)=>{colors.push(color);widths.push(w)},320,108,c)
 expect(colors).toContain(HOUSE_ROOFS[8].colors[0]);expect(colors).toContain(HOUSE_WALLS[1].wall)
 expect(Math.max(...widths)).toBe(128)
 expect(JSON.stringify(s)).toBe(before)
})
