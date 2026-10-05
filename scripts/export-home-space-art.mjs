// 실제 게임 원본에서 무손실 PNG를 내보낸다. 외부 이미지 라이브러리 불필요.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { HOME_SPACE_ART } from '../src/render/home-space-art.ts'
import { registerHooks } from 'node:module'
// 앱의 확장자 없는 TS import를 이 내보내기 도구에서만 Node에 맞춰 해석한다.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !path.extname(specifier)) return nextResolve(`${specifier}.ts`, context)
  return nextResolve(specifier, context)
} })
const { HOME_SPACE_DIRECTIONS, FURNITURE_FACINGS, HOME_SPACE_LEGACY_FACING } = await import('../src/render/home-space-directions.ts')
const { REMAINING_FURNITURE_ART, REMAINING_FURNITURE_DIRECTIONS, REMAINING_FIXTURE_DIRECTIONS } = await import('../src/render/remaining-furniture-art.ts')

const source = fs.readFileSync('src/render/furniture-art.ts', 'utf8')
const palette = Object.fromEntries([...source.matchAll(/^  (\w): '(#[0-9a-f]{6})'/gm)].map(m => [m[1], [...m[2].slice(1).match(/../g)].map(c => parseInt(c, 16)).concat(255)]))
palette.z = [90, 70, 50, 56]
const remaining = process.argv.includes('--remaining')
const fixtures = process.argv.includes('--fixtures')
const directional = process.argv.includes('--directions') || remaining || fixtures
const out = fixtures ? 'assets/furniture/remaining/fixtures' : remaining ? 'assets/furniture/remaining' : directional ? 'assets/furniture/directional' : 'assets/furniture/game-ready'
fs.mkdirSync(out, { recursive: true })
function crc32(bytes) {
  let crc = 0xffffffff
  for (const b of bytes) {
    crc ^= b
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const name = Buffer.from(type)
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([size, name, data, crc])
}
function png(file, width, height, rgba) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4)
  header[8] = 8; header[9] = 6
  const scan = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) Buffer.from(rgba.slice(y * width * 4, (y + 1) * width * 4)).copy(scan, y * (width * 4 + 1) + 1)
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',header), chunk('IDAT',zlib.deflateSync(scan)), chunk('IEND',Buffer.alloc(0))]))
}
function draw(target, width, art, ox, oy, scale = 1) {
  art.rows.forEach((row,y) => [...row].forEach((c,x) => {
    if (c === '.') return
    const color = palette[c]
    if (!color) throw Error(`Unknown palette character ${c}`)
    for (let dy=0;dy<scale;dy++) for(let dx=0;dx<scale;dx++)
      target.set(color, ((oy+y*scale+dy)*width+ox+x*scale+dx)*4)
  }))
}
const entries = directional
  ? Object.entries(fixtures ? REMAINING_FIXTURE_DIRECTIONS : remaining ? REMAINING_FURNITURE_DIRECTIONS : HOME_SPACE_DIRECTIONS).flatMap(([id, views]) => FURNITURE_FACINGS.map(facing => [`${id}-${facing}`, views[facing]]))
  : Object.entries(HOME_SPACE_ART)
const cols = directional ? 4 : 5
const cellWidth = Math.max(40, ...entries.map(([, art]) => art.w * 16 + 8))
const cellHeight = Math.max(directional ? 40 : 24, ...entries.map(([, art]) => art.h * 16 + 8))
const scale = directional ? 3 : 6
const width = cols * cellWidth, height = Math.ceil(entries.length / cols) * cellHeight
const atlas = new Uint8Array(width * height * 4)
const preview = new Uint8Array(width * height * 4 * scale * scale)
// 배경은 미리보기만 크림색. 개별 PNG와 원본 시트에는 실제 투명 alpha를 쓴다.
for(let i=0;i<preview.length;i+=4) preview.set([245,240,222,255],i)
entries.forEach(([id,art],i) => {
  const rgba = new Uint8Array(art.w*16*art.h*16*4)
  draw(rgba,art.w*16,art,0,0)
  png(path.join(out,`${id}.png`),art.w*16,art.h*16,rgba)
  const x = (i%cols)*cellWidth + Math.floor((cellWidth-art.w*16)/2), y = Math.floor(i/cols)*cellHeight + Math.floor((cellHeight-art.h*16)/2)
  draw(atlas,width,art,x,y)
  draw(preview,width*scale,art,x*scale,y*scale,scale)
})
png(path.join(out,'atlas.png'),width,height,atlas)
png(path.join(out,`preview-${scale}x.png`),width*scale,height*scale,preview)
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({tileSize:16,columns:cols,cellWidth,cellHeight,directions:directional?FURNITURE_FACINGS:undefined,legacyFacing:remaining||fixtures?undefined:directional?HOME_SPACE_LEGACY_FACING:undefined,items:entries.map(([id,a],i)=>({id,file:`${id}.png`,width:a.w*16,height:a.h*16,footprint:{w:a.w,h:a.h},x:(i%cols)*cellWidth+Math.floor((cellWidth-a.w*16)/2),y:Math.floor(i/cols)*cellHeight+Math.floor((cellHeight-a.h*16)/2)}))},null,2))
console.log(`Exported ${entries.length} native pixel sprites, atlas and preview to ${out}`)
