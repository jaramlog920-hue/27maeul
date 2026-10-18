type Pixel=(x:number,y:number,c:string,w?:number,h?:number)=>void
/** 기존 둘만의 차 장면의 찻집 처마·창·길 배경. */
export function drawTeaFrontBackground(p:Pixel,w:number,h:number,f:number){
 const cx=Math.round(w/2)
 p(0,0,'#817f91',w,h);p(0,f-14,'#799077',w,h-f+14);p(0,f+4,'#b6a382',w,h-f-4)
 // 저녁 찻집 처마와 따뜻한 창. 메뉴판은 비워 둔 채 벽에 남긴다.
 p(cx-117,f-91,'#c4b291',101,95);p(cx-121,f-100,'#74604d',109,12)
 p(cx-100,f-71,'#806547',50,43);p(cx-97,f-68,'#e8c793',44,37)
 p(cx-77,f-68,'#a18a64',3,37);p(cx-97,f-49,'#a18a64',44,2)
 p(cx-103,f-28,'#ad8d62',56,3);p(cx-37,f-62,'#806547',15,27);p(cx-35,f-60,'#584f43',11,23)
 p(cx+97,f-36,'#77674e',4,41);p(cx+80,f-68,'#647761',34,13);p(cx+75,f-55,'#536c59',43,19)
}
