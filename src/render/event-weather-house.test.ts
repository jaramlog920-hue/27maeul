import {drawWindowPrecipitation} from './event-precipitation'
import {drawFisherHouse} from './fisher-house-background'
import {HOUSES,TILE} from '../engine/world'
import {houseWallTile,drawRoof,HOUSE_STYLES} from './house-exterior-art'

it('window rain moves while staying inside the glass and off its crossbars',()=>{
 for(const t of [0,.1,4,100]){
 const cells:number[][]=[]
 drawWindowPrecipitation((x,y)=>{cells.push([x,y])},10,20,37,29,t,(x,y)=>x!==25&&y!==35)
 expect(cells.length).toBeGreaterThan(0)
 for(const [x,y] of cells){expect(x).toBeGreaterThanOrEqual(10);expect(x).toBeLessThan(47);expect(y).toBeGreaterThanOrEqual(20);expect(y).toBeLessThan(49);expect(x).not.toBe(25);expect(y).not.toBe(35)}
 }
})
it('fisher exterior uses the actual village roof, round windows and door without changing the map',()=>{
 const h=HOUSES.find(h=>h.id==='fisher')!,before=JSON.stringify(HOUSES),expected:unknown[]=[],actual:unknown[]=[]
 const g={fillStyle:'',fillRect(x:number,y:number,w:number,height:number){expected.push([(x-h.x0*TILE)*2+15,(y-(h.y1+1)*TILE)*2+140,this.fillStyle,w*2,height*2])}}
 for(let y=h.y1-1;y<=h.y1;y++)for(let x=h.x0;x<=h.x1;x++)houseWallTile(g,x,y,x===h.doorX&&y===h.y1?'D':'S','fisher',h)
 drawRoof(g,h.x0,h.y0,h.x1,h.y1-2,HOUSE_STYLES.fisher.roof)
 drawFisherHouse((...args)=>actual.push(args),15,140)
 expect(actual).toEqual(expected)
 expect(JSON.stringify(HOUSES)).toBe(before)
})
