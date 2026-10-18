import {drawOneThread} from './one-thread-art'

function paint(t:number,beat:number,choice?:number){
 const marks:{x:number;y:number;color:string}[]=[],g={fillStyle:'',fillRect(x:number,y:number){marks.push({x,y,color:this.fillStyle})}}
 drawOneThread(g as unknown as CanvasRenderingContext2D,320,180,t,null,{avatar:null,who:'writer'},beat,choice)
 return marks
}
it('실을 감은 마지막 답변에서 시간 초기화로 풀린 실이 다시 나타나지 않는다',()=>{
 const loose=(marks:ReturnType<typeof paint>)=>marks.filter(p=>p.color==='#8baabd'&&p.x>=194&&p.y>=98)
 expect(loose(paint(0,0))).not.toHaveLength(0)
 expect(loose(paint(0,2,0))).not.toHaveLength(0)
 expect(loose(paint(0,3,1))).toHaveLength(0)
 expect(loose(paint(8,3,1))).toHaveLength(0)
})
