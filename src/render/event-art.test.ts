import{describe,it,expect}from'vitest'
import{WEDDING_PROPS,WEDDING_ARCH,WEDDING_ACTIONS,weddingActorFrame}from'./wedding-art'
import{EVENT_PROPS}from'./event-art'
import{FURNI_PALETTE}from'./furniture-art'
import{writerPalette}from'./sprites'
describe('event native art',()=>{
 it('fits all props and arch views within their tile canvases',()=>{for(const a of [...Object.values(WEDDING_PROPS),...Object.values(WEDDING_ARCH),...Object.values(EVENT_PROPS)]){expect(a.rows).toHaveLength(a.h*16);for(const r of a.rows){expect(r).toHaveLength(a.w*16);for(const c of r)if(c!=='.')expect(FURNI_PALETTE[c]).toBeDefined()}}})
 it('provides bounded actor and separate props in every direction',()=>{for(const action of WEDDING_ACTIONS)for(const facing of ['down','up','left','right'] as const)for(let f=0;f<4;f++){const a=weddingActorFrame('writer',facing,action,f,{frame:0,blink:false});for(const[rows,pal]of [[a.actor,writerPalette('spring')],[a.propBack,FURNI_PALETTE],[a.propFront,FURNI_PALETTE]] as const){expect(rows).toHaveLength(24);for(const r of rows){expect(r).toHaveLength(24);for(const c of r)if(c!=='.')expect(pal[c]).toBeDefined()}}}})
})
