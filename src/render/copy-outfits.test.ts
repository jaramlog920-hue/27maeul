import {COPY_OUTFITS,copyOutfitTop} from '../engine/copy-outfits'
import {withLookDefaults} from '../engine/avatar'
import {spriteRows,writerPalette} from './sprites'
import type {Facing} from '../engine/types'

it.each(COPY_OUTFITS.flatMap(o=>(['down','left','up','right'] as Facing[]).flatMap(facing=>(['stand','wave','crouch'] as const).flatMap(pose=>[0,3].flatMap(skin=>[0,6].map(hairBack=>({o,facing,pose,skin,hairBack})))))))('$o.name $facing $pose skin $skin hair $hairBack: original head, hands, feet and valid pixels',({o,facing,pose,skin,hairBack})=>{
 const a=withLookDefaults({name:'나',look:o.look,skin,hairBack}),b={...a,top:copyOutfitTop(o.id)}
 const plain=spriteRows('writer',facing,{avatar:a,pose,frame:0,blink:false}),rows=spriteRows('writer',facing,{avatar:b,pose,frame:0,blink:false}),pal=writerPalette('spring',b)
 expect(rows.length).toBe(plain.length)
 for(let y=0;y<7;y++)for(let x=0;x<10;x++)if('sh01o+25'.includes(plain[y][x]))expect(rows[y][x]).toBe(plain[y][x])
 expect(rows.at(-1)).toBe(plain.at(-1))
 for(let y=7;y<plain.length;y++)for(let x=0;x<10;x++)if(plain[y][x]==='s'||plain[y][x]==='5')expect(rows[y][x]).toBe(plain[y][x])
 for(const row of rows)for(const c of row)if(c!=='.')expect(pal[c],c).toBeTruthy()
 expect(rows.join('')).not.toBe(plain.join(''))
})
