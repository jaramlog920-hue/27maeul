import {C} from '../../src/render/world-ground-art'
export function drawOldWall(g:Pick<CanvasRenderingContext2D,'fillStyle'|'fillRect'>,x:number,y:number,tileAt:(x:number,y:number)=>string){
 const px=x*16,py=y*16
 const r=(color:string,dx:number,dy:number,w:number,h:number)=>{g.fillStyle=color;g.fillRect(px+dx,py+dy,w,h)}
      // 집 안 벽: 크림 회벽과 나무 들보.
      // 옆벽(위아래가 벽으로 이어진 칸)은 세로로 한 장처럼 — 칸마다 가로줄을 긋지 않고, 방 쪽 가장자리에만 밝은 선
      const wallAt = (xx: number, yy: number) => '#SNVFJKMCQY'.includes(tileAt(xx, yy))
      const vertical = wallAt(x, y - 1) && wallAt(x, y + 1) && !(wallAt(x - 1, y) && wallAt(x + 1, y))
      r(C.wall, 0, 0, 16, 16)
      if (vertical) {
        const inRight = !wallAt(x + 1, y) && tileAt(x + 1, y) !== '_'
        const inLeft = !wallAt(x - 1, y) && tileAt(x - 1, y) !== '_'
        if (inRight) r(C.wallTop, 14, 0, 2, 16)
        if (inLeft) r(C.wallTop, 0, 0, 2, 16)
        if (!inLeft) r(C.wallDark, 0, 0, 1, 16)
        if (!inRight) r(C.wallDark, 15, 0, 1, 16)
      } else {
        r(C.wallTop, 0, 0, 16, 2)
        r(C.wallDark, 0, 15, 16, 1)
      }
}
