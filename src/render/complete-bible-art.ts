import type { Avatar } from '../engine/avatar'
import type { Grade } from '../engine/library'
import type { Book } from '../engine/types'
import { drawLibraryFinale, type LibraryFinaleCast } from './library-finale-art'
import { drawScenicBench } from './stargazing-art'
import { writerPalette } from './sprites'
import { person } from './milestone-moments-art'
import { householdCradleFrame } from './village-followup-art'
import { withLookDefaults } from '../engine/avatar'
import { OT_LIBRARY_ROOF } from './library-roof-palette'

export const BIBLE_PHOTO_TIME = 22
export function completeBiblePhase(t: number): number { return t < 8 ? 0 : t < 18 ? 1 : t < 26 ? 2 : t < 34 ? 3 : 4 }
export const BIBLE_CAPTIONS = [
  '이웃들이 음식과 꽃을 가져왔다. 두 서고 사이에 작은 잔칫상이 차려졌다.',
  '누군가 책을 펼쳤다. 한 사람씩 곁에 앉아 함께 읽었다.\n내가 옮겨 적은 글이, 다른 사람의 하루가 되었다.',
  '함께 읽을 예순여섯 권, 함께 살아온 사람들.\n이 시간을 한 장의 사진으로 남겼다.',
  '처음 쓴 한 줄부터 오늘까지. 내가 살아온 마을의 기억을 펼쳤다.',
  '모든 책을 채웠지만, 마을의 아침은 계속되었다.',
]
const memoryPhase = (t:number) => t < 4 ? 0 : t < 9 ? 1 : t < 15 ? 2 : t < 21 ? 3 : 4

type Px = (x: number, y: number, c: string, w?: number, h?: number) => void
const ease = (n: number) => { const x = Math.max(0, Math.min(1, n)); return x * x * (3 - 2 * x) }

function drawBibleMemory(g: CanvasRenderingContext2D, w: number, h: number, t: number, avatar: Avatar | null, grades: Partial<Record<Book, Grade>>, cast: LibraryFinaleCast, hidePlayer=false) {
  const phase = memoryPhase(t), cx = Math.round(w / 2), floor = Math.round(h * .68)
  g.imageSmoothingEnabled = false
  const p: Px = (x, y, c, a = 1, b = 1) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(a), Math.ceil(b)) }
  if (phase === 0) {
    p(0, 0, '#c9b79b', w, h); p(0, floor, '#aa8c69', w, h - floor)
    for (let y = floor + 7; y < h; y += 9) p(0, y, '#957657', w)
    const wx = Math.round(w * .17), wy = floor - 62
    p(wx - 3, wy - 3, '#8c6e50', 43, 43); p(wx, wy, '#d5decc', 37, 37)
    p(wx, wy + 25, '#a4b695', 37, 12); p(wx + 18, wy, '#ad906c', 2, 37); p(wx, wy + 18, '#ad906c', 37, 2)
    p(cx - 34, floor - 17, '#b4956e', 68, 11); p(cx - 34, floor - 6, '#74573d', 68, 3)
    p(cx - 29, floor - 3, '#74573d', 3, 11); p(cx + 27, floor - 3, '#74573d', 3, 11)
    p(cx + 10, floor - 19, '#8c7657', 18, 9); p(cx + 11, floor - 20, '#eddfbd', 16, 9)
    p(cx - 13, floor - 3, '#8a6a49', 26, 3); p(cx - 10, floor, '#74573d', 3, 7); p(cx + 7, floor, '#74573d', 3, 7)
    drawScenicBench(g, cx, floor + 5, avatar, null, false)
    const pal = writerPalette('spring', avatar ? withLookDefaults(avatar) : undefined)
    p(cx + 8, floor - 14, pal.r, 4, 3); p(cx + 12, floor - 14, pal.s, 2, 2); p(cx + 14, floor - 17, '#5f4e3b', 1, 5)
  } else if (phase === 1) {
    drawLibraryFinale(g, w, h, 5 + Math.min(2, t - 4), avatar, grades, 26, { ...cast, guests: [], spouse: null, child: null })
  } else if (phase === 2) {
    // 기존 구약 전시의 파스텔 배색·띠/줄/점/마름모를 따른다. 13권씩 세 단, 총 39권.
    p(0, 0, '#bfc2b3', w, h); p(0, floor, '#9d896b', w, h - floor); p(0, floor - 3, '#7f7764', w, 3)
    for (let y = floor + 7; y < h; y += 9) p(0, y, '#8b765d', w)
    const sx = cx - 81, sy = floor - 78
    p(sx - 7, sy - 8, '#756951', 176, 90); p(sx - 3, sy - 4, '#b5a78b', 168, 84); p(sx, sy, '#514a3e', 162, 78)
    const colors = [['#c9d8c5', '#8fae8a'], ['#d9cbb0', '#b39a78'], ['#c5d2e0', '#8da4bf'], ['#e0cfd2', '#bf9aa1'], ['#d6d3e6', '#a29cc4']]
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 13; col++) {
        const i = row * 13 + col, x = sx + 4 + col * 12, y = sy + 5 + row * 25, [spine, accent] = colors[i % 5]
        p(x, y, spine, 8, 17)
        if (i % 4 === 0) { p(x, y + 3, accent, 8, 2); p(x, y + 13, accent, 8, 2) }
        else if (i % 4 === 1) p(x + 2, y + 2, accent, 1, 13)
        else if (i % 4 === 2) for (let j = 0; j < 3; j++) p(x + 3, y + 4 + j * 4, accent, 2, 2)
        else { p(x + 3, y + 4, accent, 2, 1); p(x + 2, y + 5, accent, 4, 2); p(x + 1, y + 7, accent, 6, 3); p(x + 2, y + 10, accent, 4, 2); p(x + 3, y + 12, accent, 2, 1) }
      }
      p(sx - 3, sy + 23 + row * 25, '#b5a78b', 168, 3)
    }
    p(18, floor - 68, '#8f826c', 29, 68); p(22, floor - 64, '#6e6757', 21, 64)
    p(w - 43, floor - 64, '#8f826c', 29, 39); p(w - 40, floor - 61, '#dae0d0', 23, 33); p(w - 29, floor - 61, '#a5997e', 2, 33)
    person(p, cx - 10 + Math.round(ease((t - 9) / 5) * 3), floor + 14, avatar, 'up')
  } else {
    const lights = phase === 4 ? 1 : ease((t - 15) / 6)
    p(0, 0, '#687083', w, h); p(0, h * .25, '#948a94', w, h * .22); p(0, h * .47, '#b4a091', w, h * .21)
    p(0, floor, '#879174', w, h - floor)
    // 같은 서고 외관을 두 번 그린다. 구약 서고는 지붕 배색만 다르다.
    const library = (x: number, roof: readonly [string, string, string]) => {
      const y = floor - 43
      p(x, y, '#f4e0c0', 112, 44); p(x - 3, y - 26, roof[1], 118, 27)
      for (let yy = y - 23; yy < y; yy += 5) p(x, yy, roof[0], 112, 2)
      p(x - 5, y + 1, '#765e43', 122, 3); p(x - 3, y - 29, roof[2], 118, 3)
      p(x + 44, y + 15, '#906040', 24, 29); p(x + 48, y + 18, lights > .25 ? '#e3c68d' : '#796b58', 16, 26)
      for (const dx of [10, 80]) { p(x + dx, y + 16, '#ac7444', 20, 20); p(x + dx + 2, y + 18, lights > .2 ? '#f2d49c' : '#aaa58a', 16, 16); p(x + dx + 2, y + 14, '#ac7444', 16, 2); p(x + dx + 5, y + 12, '#ac7444', 10, 2); p(x + dx + 9, y + 18, '#b48e61', 2, 16) }
    }
    library(12, ['#58984c', '#488040', '#6cac5c'])
    library(w - 124, OT_LIBRARY_ROOF)
    // 가운데 길은 두 문에서 이어진다. 화면은 두 지역을 담은 기념 구도이며 지도 지형을 바꾸지 않는다.
    p(0, floor + 2, '#b8aa86', w, 17)
    for (let y = floor + 19; y < h; y++) { const half = 28 + (y - floor - 19) * .6; p(cx - half, y, '#c3b38f', half * 2, 1) }
    for (let i = 0; i < 8; i++) {
      const x = 7 + i * (w - 18) / 7, lit = lights > i / 9
      p(x, floor - 14, '#715f49', 2, 26); p(x - 3, floor - 19, '#967b56', 8, 9)
      p(x - 1, floor - 17, lit ? '#f0d298' : '#8b8470', 4, 5)
      if (lit) { p(x - 5, floor + 12, '#c8b790', 12, 2); p(x - 3, floor + 14, '#c8b790', 8, 2) }
    }
    const gather = (i: number) => phase === 4 ? 1 : ease((t - 16 - i * .4) / 3)
    cast.guests.forEach((guest, i) => { const a = gather(i); if (a) person(p, 14 + (cx - 32 - i * 26 - 14) * a, floor + 20, guest.avatar, a < 1 ? 'right' : 'up', guest.who, false, a < 1, t) })
    const a = phase === 4 ? 1 : ease((t - 15) / 4)
    if(!hidePlayer) person(p, cx - 29 + a * 24, floor + 20, avatar, a < 1 ? 'right' : 'up', 'writer', false, a < 1, t)
    if (cast.spouse) { const a = gather(2); if (a) person(p, cx + 22 + 26 * (1 - a), floor + 20 + 7 * (1 - a), cast.spouse.avatar, a < 1 ? 'left' : 'up', cast.spouse.who, false, a < 1, t) }
    if (cast.child && t > 18) {
      if (cast.baby) {
        const av = withLookDefaults(cast.child.avatar ?? { look: 'f', name: cast.babyName }), crib = householdCradleFrame({ look: av.look, name: cast.babyName, hair: av.hairColor, avatar: { skin: av.skin } }, 0, true)
        for (const [rows, palette] of [[crib.back, crib.propPalette], [crib.actor, crib.actorPalette], [crib.front, crib.propPalette]] as const) rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.' && palette[c]) p(cx + 48 + x * 2, floor - 6 + y * 2, palette[c], 2, 2) }))
      } else { const a = gather(4); person(p, cx + 49 + 18 * (1 - a), floor + 20 + 7 * (1 - a), cast.child.avatar, a < 1 ? 'left' : 'up', cast.child.who, false, a < 1, t, 1, cast.child.short) }
    }
    if (phase === 4) for (let i = 0; i < 24; i++) p(8 + (i * 43 + i * i * 17) % Math.max(1, w - 16), 6 + (i * 7 + i * i * 11) % Math.max(1, Math.round(h * .22)), '#d4cebb')
  }
  // 장소가 바뀌는 세 순간을 짧게 어둡게 연결한다.
  for (const cut of [4, 9, 15]) if (Math.abs(t - cut) < .3) { g.fillStyle = `rgba(35,37,39,${1 - Math.abs(t - cut) / .3})`; g.fillRect(0, 0, w, h) }
}

export function drawBibleLastLetter(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,grades:Partial<Record<Book,Grade>>,cast:LibraryFinaleCast) {
  drawBibleMemory(g,w,h,Math.min(3,t),avatar,grades,cast)
  if(t<=2){const cx=Math.round(w/2),floor=Math.round(h*.68);g.fillStyle='#907a58';for(let i=0;i<3;i++)g.fillRect(cx+13,floor-18+i*2,11,1)}
  if(t>2){const cx=Math.round(w/2),floor=Math.round(h*.68);g.fillStyle='#8c7657';g.fillRect(cx+10,floor-20,18,9);g.fillStyle='#b9a27b';g.fillRect(cx+11,floor-20,16,2)}
}

function endingCradle(p:Px,x:number,foot:number,cast:LibraryFinaleCast) {
  if(!cast.child||!cast.baby)return
  const av=withLookDefaults(cast.child.avatar??{look:'f',name:cast.babyName})
  const crib=householdCradleFrame({look:av.look,name:cast.babyName,hair:av.hairColor,avatar:{skin:av.skin}},0,true)
  for(const [rows,pal] of [[crib.back,crib.propPalette],[crib.actor,crib.actorPalette],[crib.front,crib.propPalette]] as const)
    rows.forEach((row,y)=>[...row].forEach((c,xx)=>{if(c!=='.'&&pal[c])p(x+xx*2,foot-32+y*2,pal[c],2,2)}))
}

export function drawCompleteBible(g:CanvasRenderingContext2D,w:number,h:number,t:number,avatar:Avatar|null,grades:Partial<Record<Book,Grade>>,cast:LibraryFinaleCast) {
  const phase=completeBiblePhase(t),cx=Math.round(w/2),floor=Math.round(h*.68)
  const p:Px=(x,y,c,a=1,b=1)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.ceil(a),Math.ceil(b))}
  const empty={...cast,guests:[],spouse:null,child:null}
  if(phase===0){
    drawBibleMemory(g,w,h,23,avatar,grades,empty,true)
    const ground=floor+19
    endingCradle(p,cx+96,ground+25,cast)
    cast.guests.forEach((guest,i)=>person(p,cx-60+i*34,ground,guest.avatar,'down',guest.who))
    p(cx-66,ground-5,'#ba9a70',132,12);p(cx-66,ground+7,'#75573c',132,3)
    p(cx-61,ground+10,'#75573c',3,12);p(cx+56,ground+10,'#75573c',3,12)
    for(let i=0;i<5;i++)if(t>=i*.4){const x=cx-57+i*25;p(x,ground-8,'#e4d3ae',17,3);p(x+3,ground-12,i%2?'#81a15c':'#bd9159',11,5);p(x+17,ground-9,'#e9d9b8',4,4)}
    for(const x of [cx-72,cx+71]){p(x,ground-20,'#a89169',6,6);p(x+2,ground-27,'#72935b',2,8);p(x-1,ground-29,'#dfb2ad',8,3)}
    person(p,cx-89,ground+7,avatar,'right')
    if(cast.spouse)person(p,cx+67,ground+7,cast.spouse.avatar,'left',cast.spouse.who)
    if(cast.child&&!cast.baby)person(p,cx+93,ground+18,cast.child.avatar,'left',cast.child.who,false,false,t,1,cast.child.short)
  }else if(phase===1){
    p(0,0,'#c0b89e',w,h);p(0,floor,'#ac916d',w,h-floor)
    for(let y=floor+7;y<h;y+=10)p(0,y,'#987b5b',w)
    for(const x of [cx-116,cx+45]){p(x,floor-70,'#846b4e',70,67);p(x+4,floor-66,'#65573f',62,58);for(let row=0;row<3;row++){for(let col=0;col<7;col++)p(x+7+col*8,floor-62+row*19,['#c9d8c5','#d9cbb0','#c5d2e0','#e0cfd2'][col%4],5,13);p(x+4,floor-47+row*19,'#b29974',62,3)}}
    endingCradle(p,cx+91,floor+20,cast)
    const reader=cast.child&&!cast.baby?cast.child:cast.guests[0]??{avatar,who:'writer' as const}
    const seat=(x:number)=>{p(x-2,floor+2,'#bdab83',25,8);p(x,floor+3,'#d3c29b',21,5)}
    seat(cx-9);person(p,cx-6,floor+8,reader.avatar,'down',reader.who,true,false,t,1,reader.short)
    const open=ease((t-8)/2),bw=Math.round(6+9*open)
    p(cx-3,floor-2,'#967957',bw,6);p(cx-2,floor-3,'#eee0bd',Math.max(1,bw-2),5);if(open>.5)p(cx+4,floor-3,'#a08e6e',1,5)
    person(p,cx-43,floor+13,avatar,'right')
    const others=cast.guests.filter(guest=>guest!==reader)
    others.slice(0,2).forEach((guest,i)=>{seat(cx+31+i*28);person(p,cx+34+i*28,floor+9,guest.avatar,'left',guest.who,true)})
    if(cast.spouse)person(p,cx-72,floor+13,cast.spouse.avatar,'right',cast.spouse.who)
  }else if(phase===2||phase===3){
    drawBibleMemory(g,w,h,23,avatar,grades,cast)
    if(phase===3){g.fillStyle='rgba(30,40,36,.4)';g.fillRect(0,0,w,h)}
  }else{
    p(0,0,'#e4d4b6',w,h);p(0,floor,'#b79a76',w,h-floor)
    for(let y=floor+7;y<h;y+=9)p(0,y,'#9e7f5c',w)
    p(cx-91,floor-67,'#ad8d63',43,43);p(cx-88,floor-64,'#dfe4c6',37,37);p(cx-88,floor-46,'#b7c89a',37,19);p(cx-71,floor-64,'#bd9d72',2,37);p(cx-88,floor-46,'#bd9d72',37,2)
    p(cx+20,floor-24,'#b4956e',52,10);p(cx+24,floor-14,'#74573d',3,17);p(cx+66,floor-14,'#74573d',3,17);p(cx+31,floor-28,'#8f7958',20,5)
    endingCradle(p,cx-72,floor+18,cast)
    person(p,cx-10,floor+9,avatar,'right')
    if(cast.spouse)person(p,cx+21,floor+12,cast.spouse.avatar,'left',cast.spouse.who)
    if(cast.child&&!cast.baby)person(p,cx-39,floor+15,cast.child.avatar,'right',cast.child.who,false,false,t,1,cast.child.short)
  }
}
