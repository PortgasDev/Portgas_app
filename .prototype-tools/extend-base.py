from pathlib import Path
import re

root = Path(__file__).parent
p = root / 'app.js'
s = p.read_text(encoding='utf-8')
for start, end in [('function renderGallery(){','function feedbackFor('),('function showArt(id){','const taskItems='),('function renderJourney(){','let mapPosition='),('function renderStudents(){','function renderAnnouncements(){'),('function renderAnnouncements(){','function showHelp(){')]:
    a, b = s.index(start), s.index(end)
    s = s[:a] + s[b:]
s = re.sub(r'const students=\[.*?\];', 'let students=[];', s, flags=re.S)
s = s.replace("students:['acompanhar turma','users']", "overview:['visão geral','grid'],students:['alunos & evolução','users'],schedule:['cronograma','clock'],reviews:['entregas & avaliações','image'],analytics:['presença & evolução','route']")
s = s.replace("if(next==='students'&&state.role==='student')", "if(['overview','students','reviews','analytics'].includes(next)&&state.role==='student')")
s = s.replace("students:renderStudents,announcements:renderAnnouncements", "students:renderStudents,announcements:renderAnnouncements,overview:renderOverview,schedule:renderSchedule,reviews:renderReviews,analytics:renderAnalytics")
s = s.replace("view=next;", "view=next;state.school.lastView=next;syncSchoolChrome();")
s = s.replace("if(!teacher&&view==='students')navigate('journey');", "$$('[data-teacher-only]').forEach(el=>el.hidden=!teacher);syncSchoolChrome();if(!teacher&&['overview','students','reviews','analytics'].includes(view))navigate('journey');")
s = s.replace("state.messages.map(message=>messageHTML", "state.messages.filter(message=>!message.classId||message.classId===state.school.activeClass).map(message=>messageHTML")
s = s.replace("state.messages.push({text:text.slice(0,1200),role:state.role,time:", "state.messages.push({classId:state.school.activeClass,text:text.slice(0,1200),role:state.role,time:")
s = s.replace("...seedMessages", "...seedMessages")
s = s.replace("seedMessages.map(messageHTML).join('')", "(state.school.activeClass==='aurora'?seedMessages:[]).map(messageHTML).join('')")
s = s.replace("const student=students[index];return", "const student=students[index];if(!student)return '';return")
s = s.replace("navigate('journey');requestAnimationFrame", "state.school.selectedAssignment=assignmentsForClass().find(a=>a.lessonId===activeLesson()?.id)?.id||assignmentsForClass()[0]?.id||'';navigate('journey');requestAnimationFrame")
s = s.replace("()=>$('#weekly-task').scrollIntoView", "()=>$('#weekly-task')?.scrollIntoView")
s = s.replace("applyRole();updateReference();renderMessages();requestAnimationFrame(resizeCanvas);", "")
s = s.replace("Na visão de professor, acompanhe as fichas fictícias da turma.", "Na visão de professor, cadastre turmas e alunos, edite aulas, registre presença e avalie entregas. As alterações atualizam o painel e a jornada do aluno.")
s = s.replace("participantes, presença, microfone", "participantes conectados, microfone")
s = s.replace("No armazenamento", "No armazenamento")
s = s.replace("tarefas, XP local e movimento do avatar.", "tarefas, XP local, movimento do avatar, turmas, cronograma, presença manual e avaliações por critérios.")
p.write_text(s, encoding='utf-8')
p = root / 'prototype.html'
s = p.read_text(encoding='utf-8')
s = s.replace('</style>', '/* MANAGEMENT_CSS */\n</style>', 1)
s = s.replace('<div class="course"><div class="course-head">', '<div class="course"><div class="course-head">', 1)
s = s.replace('<strong>Fundamentos 01</strong><p>Turma Aurora · 2026</p>', '<label class="sr-only" for="class-select">Turma ativa</label><select id="class-select" aria-label="Turma ativa"></select><p id="course-caption">Fundamentos 01</p>')
s = s.replace('<div class="nav-label" id="management-label">GALDRABOK <span>⌄</span></div>\n  <button class="nav-item" data-view="students" id="students-nav"><svg class="icon"><use href="#i-users"/></svg>acompanhar turma</button>', '''<div class="nav-label" id="management-label">GESTÃO · GALDRABOK <span>⌄</span></div>
  <button class="nav-item" data-view="overview" data-teacher-only><svg class="icon"><use href="#i-grid"/></svg>visão geral</button>
  <button class="nav-item" data-view="students" id="students-nav" data-teacher-only><svg class="icon"><use href="#i-users"/></svg>alunos &amp; evolução</button>
  <button class="nav-item" data-view="schedule"><svg class="icon"><use href="#i-clock"/></svg>cronograma</button>
  <button class="nav-item" data-view="reviews" data-teacher-only><svg class="icon"><use href="#i-image"/></svg>entregas &amp; avaliações<span class="badge" id="review-count">3</span></button>
  <button class="nav-item" data-view="analytics" data-teacher-only><svg class="icon"><use href="#i-route"/></svg>presença &amp; evolução</button>
  <button class="nav-item" data-action="backup" data-teacher-only><svg class="icon"><use href="#i-download"/></svg>salvar meus testes</button>''')
s = s.replace('<section class="view" id="view-students"', '\n'.join(f'<section class="view" id="view-{name}" aria-label="{label}" hidden></section>' for name,label in [('overview','Visão geral'),('schedule','Cronograma'),('reviews','Entregas e avaliações'),('analytics','Presença e evolução')])+'\n <section class="view" id="view-students"')
s = s.replace('<span class="demo-label">PROTÓTIPO LOCAL</span>', '<span class="demo-label">DADOS LOCAIS</span><select id="learner-select" class="role-select" aria-label="Aluno da prévia" hidden></select>')
s = s.replace('<input id="board-file"', '<input id="backup-file" type="file" accept="application/json,.json" hidden>\n<input id="board-file"')
p.write_text(s,encoding='utf-8')
print('Base extended. Final output remains atelie-xuim.html.')
