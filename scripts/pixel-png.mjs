import fs from 'node:fs'
import zlib from 'node:zlib'
function crc32(bytes) { let c=0xffffffff; for(const b of bytes) {c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0)}return(c^0xffffffff)>>>0 }
function chunk(t,d){const n=Buffer.from(t),l=Buffer.alloc(4),c=Buffer.alloc(4);l.writeUInt32BE(d.length);c.writeUInt32BE(crc32(Buffer.concat([n,d])));return Buffer.concat([l,n,d,c])}
export function png(file,w,h,p){const hd=Buffer.alloc(13);hd.writeUInt32BE(w);hd.writeUInt32BE(h,4);hd[8]=8;hd[9]=6;const scan=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)Buffer.from(p.slice(y*w*4,(y+1)*w*4)).copy(scan,y*(w*4+1)+1);fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hd),chunk('IDAT',zlib.deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]))}
export function draw(p,w,rows,palette,ox=0,oy=0,scale=1){rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='.')return;const hex=palette[c];if(!hex)throw Error(`Unknown color ${c}`);const color=hex.slice(1).match(/../g).map(v=>parseInt(v,16)).concat(255);for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++)p.set(color,((oy+y*scale+dy)*w+ox+x*scale+dx)*4)}))}

