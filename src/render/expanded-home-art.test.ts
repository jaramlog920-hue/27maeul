import {it,expect} from 'vitest'
import {homeHouse} from '../engine/world'
import {homeRoofParts,homeAdditionArt,homeAdditionSnowRows,homeRoofJoinRows} from './expanded-home-art'
it('preserves the original main roof and adds rear, right and deep left wings in room order',()=>{
  const original=homeRoofParts(homeHouse(0))[0]
  for(const level of [1,2,3]){
    const parts=homeRoofParts(homeHouse(level)),main=parts.at(-1)!
    expect(main).toEqual(original)
    expect(parts).toHaveLength(level+1)
    expect(parts.slice(0,-1).every(p=>!p.chimney)).toBe(true)
    expect(parts.some(p=>p.y0<main.y0&&p.x1>=main.x0)).toBe(true)
    expect(parts.some(p=>p.x0>main.x1)).toBe(level>=2)
    if(level===3){
      const left=parts.find(p=>p.x0<main.x0)!,right=parts.find(p=>p.x0>main.x1)!
      expect(left.x1-left.x0).toBeGreaterThan(right.x1-right.x0)
      expect(left.y1-left.y0).toBeGreaterThan(right.y1-right.y0)
    }
  }
})
it('softens only internal roof joins without covering walls or the original unexpanded house',()=>{
  expect(homeRoofJoinRows(homeHouse(0)).every(row=>/^\.+$/.test(row))).toBe(true)
  for(const level of [1,2,3]){
    const h=homeHouse(level),joins=homeRoofJoinRows(h)
    for(let y=0;y<joins.length;y++)for(let x=0;x<joins[y].length;x++)if(joins[y][x]!=='.'){
      const gy=h.y0*16+y
      expect(gy).toBeLessThan(6*16)
    }
  }
})
it('keeps addition pixels in their footprints and clips snow to the actual stepped roofs',()=>{
  for(const part of homeRoofParts(homeHouse(3))){
    if(part.chimney){expect(()=>homeAdditionArt(part)).toThrow();continue}
    const art=homeAdditionArt(part),snow=homeAdditionSnowRows(part)
    expect(art.rows).toHaveLength((part.y1-part.y0+1)*16)
    for(let y=0;y<art.rows.length;y++){
      expect(art.rows[y]).toHaveLength((part.x1-part.x0+1)*16)
      for(let x=0;x<art.rows[y].length;x++){
        const c=art.rows[y][x]
        if(c!=='.')expect(art.palette[c]).toBeDefined()
        if(snow[y][x]!=='.')expect('rRhtd').toContain(c)
      }
    }
    expect(art.rows[0][0]).toBe('.')
    expect(snow[0][0]).toBe('.')
  }
})
