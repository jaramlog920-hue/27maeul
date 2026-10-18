type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** 기존 서고 완성 장면의 벽·바닥·문·창·화분을 재사용한다. */
export function drawLibraryRoomBackground(p:Pixel,w:number,h:number,floor:number,plain=false){
    p(0,0,'#c9b79b',w,h)
    p(-100, floor, '#ac8d69', w + 200, h)
    p(-100, floor - 3, '#80664e', w + 200, 3)
    for (let y = floor + 6; y < floor + h; y += 9) p(-100, y, '#977956', w + 200)
    // 나무 문과 햇빛, 선반 위 작은 잎 장식.
    p(17, floor - 68, '#927351', 32, 70); p(21, floor - 64, '#6d5842', 24, 66)
    const door = 24
    p(21, floor - 64, '#aa875c', door, 64)
    if(plain)return
    p(w - 53, floor - 74, '#927351', 36, 44); p(w - 50, floor - 71, '#e9d1a8', 30, 38)
    p(w - 36, floor - 71, '#aa8963', 2, 38); p(w - 50, floor - 53, '#aa8963', 30, 2)
    p(w - 40, floor - 25, '#8b704f', 14, 10); p(w - 34, floor - 35, '#698459', 2, 12); p(w - 41, floor - 33, '#8fa078', 7, 3); p(w - 33, floor - 37, '#8fa078', 7, 3)
}
