from pathlib import Path
root=Path(__file__).parent
p=root/'management.js';s=p.read_text(encoding='utf-8')
a=s.index('function renderGallery(){');b=s.index('function showArt(id){',a);s=s[:a]+s[b:]
s=s.replace('initManagement();','')
s=s.replace('GALDRABOK / ', 'ATELIÊ / ')
s=s.replace("const evaluated=studentDeliveries(student.id).reduce((sum,item)=>sum+asNumber(item.review?.xp),0);", "const evaluated=latestDeliveries(studentDeliveries(student.id).filter(item=>item.review)).reduce((sum,item)=>sum+asNumber(item.review?.xp),0);")
s=s.replace("deliveries.filter(item=>deliveryStatus(item)==='pending')", "latestDeliveries(deliveries).filter(item=>deliveryStatus(item)==='pending')")
s=s.replace("classDeliveries().filter(item=>deliveryStatus(item)==='pending')", "latestDeliveries(classDeliveries()).filter(item=>deliveryStatus(item)==='pending')")
s=s.replace("const all=classDeliveries().filter(item=>item.task||item.assignmentId)", "const all=latestDeliveries(classDeliveries()).filter(item=>item.task||item.assignmentId)")
s=s.replace('function showUpload(fromTask){','function showUpload(fromTask,context={}){')
s=s.replace("const assignment=activeAssignment(),person=currentLearner();", "const parent=allDeliveries().find(item=>item.id===context.parentId);const assignment=school().assignments.find(item=>item.id===(context.assignmentId||parent?.assignmentId))||activeAssignment(),person=getStudent(context.studentId)||currentLearner();")
s=s.replace("openModal(fromTask?'Registrar entrega':'Adicionar ao sketchbook'", "openModal(parent?'Enviar nova versão':fromTask?'Enviar estudo da tarefa':'Adicionar estudo livre'")
s=s.replace("<label class=\"field wide\">Título do estudo<input id=\"study-title\"", "<label class=\"field wide\" id=\"study-step-field\">Etapa do exercício<select id=\"study-step\"></select></label><label class=\"field wide\">Título do estudo<input id=\"study-title\"")
s=s.replace("escapeHTML(fromTask?assignment?.title||'':'')", "escapeHTML(parent?.title||(fromTask?assignment?.title||'':''))")
s=s.replace("const file=$('#study-file').files[0],note=", "const stepId=$('#study-step').value;const file=$('#study-file').files[0],note=")
s=s.replace("classId,studentId,assignmentId,task:!!assignmentId,review:null", "classId,studentId,assignmentId,stepId,task:!!assignmentId,review:null,parentId:parent?.id||'',rootId:parent?studyRoot(parent):'',version:parent?(parent.version||1)+1:1")
needle=" $('#upload-form').onsubmit=async event=>"
insert=""" const refreshSteps=()=>{const selected=school().assignments.find(item=>item.id===$('#study-assignment').value);$('#study-step-field').hidden=!selected;$('#study-step').required=!!selected;$('#study-step').innerHTML=selected?selected.steps.map(step=>`<option value="${escapeHTML(step.id)}" ${step.id===(context.stepId||parent?.stepId)?'selected':''}>${escapeHTML(step.title)}</option>`).join(''):'<option value="">Estudo livre</option>';};
 $('#study-assignment').onchange=refreshSteps;refreshSteps();if(parent){$('#study-assignment').disabled=true;if($('#study-student'))$('#study-student').disabled=true;$('#study-step').disabled=true;}
"""
s=s.replace(needle,insert+needle)
s=s.replace("bindSchoolLinks($('#modal-body'));\n}", "bindSchoolLinks($('#modal-body'));\n}")
s=s.replace(" $('#review-on-board').onclick=", " augmentReview(item);\n $('#review-on-board').onclick=")
s=s.replace("button.hidden=!item||item.title!==state.customBoard?.title;", "button.hidden=!item||item.classId!==currentClass().id||item.title!==state.customBoard?.title;")
s=s.replace("button.onclick=()=>showReview(school().boardDeliveryId);", "button.onclick=()=>showReview(school().boardDeliveryId);let attach=$('#attach-correction');if(!attach){attach=document.createElement('button');attach.id='attach-correction';attach.className='btn small primary';attach.textContent='Anexar correção';$('.drawing-tools').append(attach);}attach.hidden=button.hidden||state.role!=='teacher';attach.onclick=attachBoardCorrection;")
s=s.replace("$('.mini-avatars').setAttribute('aria-label',", "showReturnToReview();$('.mini-avatars').setAttribute('aria-label',")
s=s.replace("logSchool('Novo estudo: '+title,studentId);", "sketchbookStudent=studentId;sketchbookMode=assignmentId?'week':'all';if(assignmentId)school().selectedAssignment=assignmentId;logSchool((parent?'Nova versão: ':'Novo estudo: ')+title,studentId);")
s=s.replace("if(item.review&&(", "if(item.correction&&!validImage(item.correction))fail();if(item.review&&(")
s=s.replace("analyticsStudent=''", "")
s=s.replace(",;", ";").replace("; ;", ";")
s=s.replace("reviewSearch='';='';", "reviewSearch='';")
# Attach the sample studies to a concrete stage without changing older user uploads.
s=s.replace(" $('#class-select').onchange=", " school().deliveries.forEach(item=>{if(!item.stepId)item.stepId=school().assignments.find(a=>a.id===item.assignmentId)?.steps[0]?.id||'';});\n $('#class-select').onchange=")
p.write_text(s,encoding='utf-8')
p=root/'prototype.html';s=p.read_text(encoding='utf-8').replace('GESTÃO · GALDRABOK','ACOMPANHAR A TURMA');p.write_text(s,encoding='utf-8')
p=root/'app.js';s=p.read_text(encoding='utf-8').replace('${student.name}', '${escapeHTML(student.name)}').replace('${student.initials}', '${escapeHTML(student.initials)}')
a=s.index("$('#export-board').onclick=async()=>{");b=s.index('async function readImage(file){',a)
s=s[:a]+'''async function makeBoardImage(){
 await $('#board-reference').decode();
 const output=document.createElement('canvas'),scale=Math.min(2,1800/canvasWidth);output.width=Math.round(canvasWidth*scale);output.height=Math.round(canvasHeight*scale);const ctx=output.getContext('2d');ctx.fillStyle='#eeece8';ctx.fillRect(0,0,output.width,output.height);
 const frame=referenceFrame();ctx.drawImage($('#board-reference'),frame.x*scale,frame.y*scale,frame.width*scale,frame.height*scale);ctx.drawImage(canvas,0,0,output.width,output.height);ctx.fillStyle='#777078';ctx.font=`${Math.max(10,9*scale)}px sans-serif`;ctx.fillText('XUIM ART · PRANCHA DE ESTUDO',16*scale,output.height-12*scale);return output.toDataURL('image/png');
}
$('#export-board').onclick=async()=>{const button=$('#export-board');button.disabled=true;try{download(await makeBoardImage(),'xuim-prancha-de-estudo.png');toast('Prancha exportada em PNG.');}catch{toast('Não foi possível exportar a imagem. Tente abrir a referência novamente.');}finally{button.disabled=false;}};
'''+s[b:]
s=s.replace("renderCanvas();}\nconst canvas=", "renderCanvas();if(state.school)showReturnToReview();}\nconst canvas=")
p.write_text(s,encoding='utf-8')
