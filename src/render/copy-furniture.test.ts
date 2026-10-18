import { COPY_FURNITURE } from '../engine/copy-furniture'
import { withLookDefaults } from '../engine/avatar'
import { COPY_FURNITURE_DIRECTIONS, copyFurnitureObjectFrame } from './copy-furniture-art'
import { copyFurnitureUseFrame } from './copy-furniture-motion'
import { FURNI_PALETTE } from './furniture-art'
import { sizeOf } from '../engine/room'
import { newbornArt } from './newborn-art'
import { copyFurnitureChildStage, copyFurnitureFacings } from '../engine/copy-furniture-views'
import { hasFacingArt, furnitureFacings } from './furniture-facing'
import { spriteRows } from './sprites'

const directions=['down','up','left','right'] as const
it('renders every stage in four directions with valid native dimensions and shared source art',()=>{
  const before=JSON.stringify(COPY_FURNITURE_DIRECTIONS),avatar=withLookDefaults({look:'f',name:'검토',skin:3,top:7,hairBack:3})
  for(const item of COPY_FURNITURE)for(const facing of directions){
    const unique=new Set<string>()
    for(let phase=0;phase<4;phase++){
      const art=copyFurnitureObjectFrame(item.id,facing,phase),scene=copyFurnitureUseFrame(item.id,facing,phase,{actor:{avatar,frame:0,blink:false},child:{avatar,stage:copyFurnitureChildStage(item.id)},pet:{kind:'dog',baby:false}})
      expect({w:art.w,h:art.h}).toEqual(sizeOf(item.id,facing))
      expect(art.rows).toHaveLength(art.h*16)
      for(const row of art.rows){expect(row).toHaveLength(art.w*16);for(const c of row)if(c!=='.')expect(FURNI_PALETTE[c],`${item.id}/${c}`).toBeDefined()}
      for(const layer of scene.layers){expect(layer.rows).toHaveLength(96);for(const row of layer.rows){expect(row).toHaveLength(96);for(const c of row)if(c!=='.')expect(layer.palette[c],`${item.id}/${c}`).toBeDefined()}}
      unique.add(JSON.stringify(scene.layers))
      expect(copyFurnitureUseFrame(item.id,facing,phase+4,{actor:{avatar,frame:0,blink:false}})).toEqual(copyFurnitureUseFrame(item.id,facing,phase,{actor:{avatar,frame:0,blink:false}}))
    }
    expect(unique.size,`${item.id}/${facing}`).toBeGreaterThanOrEqual(3)
  }
  expect(JSON.stringify(COPY_FURNITURE_DIRECTIONS)).toBe(before)
})
it('never invents babies, children or pets when none are supplied',()=>{
  for(const {id} of COPY_FURNITURE){const scene=copyFurnitureUseFrame(id,'down',1);expect(scene.participants).toEqual({baby:false,child:false,pet:false});expect(scene.layers.slice(2,5).every(l=>l.rows.every(r=>/^\.+$/.test(r)))).toBe(true)}
})
it('uses the exact shared newborn rows and palette for each infant-care direction',()=>{
  const avatar=withLookDefaults({look:'m',name:'아기',skin:2}),source=newbornArt(avatar,0)
  for(const id of ['copyBabyWash','copyBabyNap'] as const)for(const facing of directions){
    const scene=copyFurnitureUseFrame(id,facing,0,{child:{avatar,stage:'baby'}}),layer=scene.layers[3]
    const art=scene.object,x=48-art.w*8+6,y=55
    expect(layer.rows.slice(y,y+source.rows.length).map(r=>r.slice(x,x+source.rows[0].length))).toEqual(source.rows)
    expect(layer.palette).toEqual(source.palette)
    expect(copyFurnitureUseFrame(id,facing,0,{child:{avatar,stage:'adult'}}).participants.baby).toBe(false)
  }
})

it('does not manufacture unnecessary directions or offer rotation for fixed pieces',()=>{
  for(const {id} of COPY_FURNITURE){
    const expected=id==='copyBabyNap'||id==='copyChangingScreen'?['down','right']:['down']
    expect(copyFurnitureFacings(id)).toEqual(expected)
    expect(furnitureFacings(id)).toEqual(expected)
    expect(hasFacingArt(id)).toBe(expected.length>1)
    if(expected.length===1){expect(COPY_FURNITURE_DIRECTIONS[id].up).toBe(COPY_FURNITURE_DIRECTIONS[id].down);expect(COPY_FURNITURE_DIRECTIONS[id].left).toBe(COPY_FURNITURE_DIRECTIONS[id].down)}
  }
})

it('feeds seated toddlers, never newborns, and keeps sample people separate',()=>{
  const avatar=withLookDefaults({look:'f',name:'아이'})
  for(let phase=0;phase<4;phase++){
    expect(copyFurnitureUseFrame('copyBabyMeal','down',phase,{child:{avatar,stage:'baby'}}).participants).toMatchObject({baby:false,child:false})
    const fed=copyFurnitureUseFrame('copyBabyMeal','down',phase,{child:{avatar,stage:'toddler'}})
    expect(fed.participants).toMatchObject({baby:false,child:true})
    const native=spriteRows('writer','left',{avatar,short:0,growth:2,frame:0,blink:phase===3,season:'spring'})
    // The sitting adjustment cannot remove even one head/torso row from the native toddler.
    expect(fed.layers[2].rows.slice(64-native.length,63).map(r=>r.slice(41,51))).toEqual(native.slice(0,-1))
  }
  for(const {id} of COPY_FURNITURE)for(const facing of copyFurnitureFacings(id))for(let phase=0;phase<4;phase++){
    const scene=copyFurnitureUseFrame(id,facing,phase,{child:{avatar,stage:copyFurnitureChildStage(id)},pet:{kind:'cat',baby:true}})
    const people=scene.layers.slice(1,5)
    const clashes: string[]=[]
    for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(people.filter(l=>l.rows[y][x]!=='.').length>1)clashes.push(`${x},${y}`)
    expect(clashes,`${id}/${phase}: overlapping people`).toEqual([])
    // No one sinks below the common ground baseline (stepping up is allowed).
    for(const l of people)expect(l.rows.slice(64).every(r=>/^\.+$/.test(r)),`${id}: feet below ground`).toBe(true)
    const props=scene.layers[5]
    for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(props.rows[y][x]!=='.')expect(people.every(l=>l.rows[y][x]==='.')).toBe(true)
  }
})
