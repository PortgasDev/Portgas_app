'use strict';
const TrailModel=(()=>{
  function blank(){return {format:'xuim-trilha',schema:1,curriculum:'xuim-48-semanas-v1',module:1,selected:1,active:null,records:{},updatedAt:null};}
  const validWeek=id=>Number.isInteger(Number(id))&&Number(id)>=1&&Number(id)<=48;
  const record=(state,id)=>state.records[id]||{started:false,completed:false,review:false,note:''};
  const completed=state=>Object.values(state.records).filter(r=>r.completed).length;
  const reviews=state=>Object.entries(state.records).filter(([,r])=>r.review).map(([id])=>Number(id)).sort((a,b)=>a-b);
  const next=state=>{if(state.active&&!record(state,state.active).completed)return state.active;for(let id=1;id<=48;id++)if(!record(state,id).completed)return id;return null;};
  function update(state,id,patch){if(!validWeek(id))throw new Error('Semana inválida.');state.records[id]={...record(state,id),...patch};state.updatedAt=new Date().toISOString();}
  function complete(state,id,value=true){update(state,id,{completed:value,started:true});if(state.active===id&&value)state.active=null;}
  function validate(data){
    if(!data||data.format!=='xuim-trilha'||data.schema!==1||data.curriculum!=='xuim-48-semanas-v1'||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('Escolha uma cópia desta trilha Xuim. O backup do ateliê e o caderno de revisão são arquivos diferentes.');
    if(!Number.isInteger(data.module)||data.module<1||data.module>6||!validWeek(data.selected)||data.active!==null&&!validWeek(data.active))throw new Error('A posição na trilha é inválida.');
    const result=blank();result.module=data.module;result.selected=Number(data.selected);result.active=data.active===null?null:Number(data.active);
    for(const [id,r] of Object.entries(data.records)){
      if(!validWeek(id)||String(Number(id))!==id||!r||typeof r!=='object'||['started','completed','review'].some(key=>typeof r[key]!=='boolean')||typeof r.note!=='string'||r.note.length>10000)throw new Error('Esta cópia tem registros inválidos. Seu percurso não foi alterado.');
      result.records[id]={started:r.started,completed:r.completed,review:r.review,note:r.note};
    }
    result.updatedAt=typeof data.updatedAt==='string'?data.updatedAt:null;return result;
  }
  return {blank,record,completed,reviews,next,update,complete,validate};
})();
if(typeof module!=='undefined')module.exports=TrailModel;
