// Conversation state is independent of the current page and of lesson attendance.
const StudyModel = {
  statuses: {process:'Em processo', help:'Pedido de ajuda', submitted:'Para avaliar', revision:'Próximo passo', complete:'Concluído'},
  migrate(deliveries) {
    const groups = new Map();
    for (const item of deliveries) {
      const root = item.rootId || item.id;
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(item);
    }
    return [...groups].map(([id, versions]) => {
      versions.sort((a,b) => (a.version || 1) - (b.version || 1) || a.date.localeCompare(b.date));
      const first = versions[0], last = versions.at(-1), posts = [];
      for (const item of versions) {
        posts.push({id:'post-'+item.id, role:'student', authorId:item.studentId, text:item.id==='demo-lia' && !item.review ? 'Estou preso na sombra do cilindro. Ela acompanha a curva ou fica reta? Ainda estou construindo os volumes.' : item.note || 'Compartilhei meu estudo.', kind:'process', deliveryId:item.id, createdAt:item.date});
        if (item.review) posts.push({id:'review-'+item.id, role:'teacher', authorId:'teacher', text:item.review.feedback, kind:item.review.status==='approved'?'complete':'guidance', deliveryId:item.id, createdAt:item.review.date || item.date, assessment:{...item.review,criteria:{...item.review.criteria}}});
        if (item.correction) posts.push({id:'correction-'+item.id, role:'teacher', authorId:'teacher', text:'Anotação visual do professor.', kind:'correction', deliveryId:item.id, createdAt:item.review?.date || item.date});
      }
      return {id, title:first.title, classId:first.classId, studentId:first.studentId, assignmentId:first.assignmentId || '', stepId:first.stepId || '', status:last.review ? (last.review.status==='approved'?'complete':'revision') : first.id==='demo-lia'?'help':'submitted', posts, updatedAt:posts.at(-1).createdAt};
    });
  },
  addPost(thread, post) {
    if (!post.text?.trim() && !post.deliveryId && !post.image) throw new Error('Escreva uma mensagem ou anexe uma imagem.');
    if (post.role==='student') {
      if (post.kind==='help') thread.status='help';
      else if (post.kind==='submit') thread.status='submitted';
      else if (post.kind==='resolve' || post.deliveryId) thread.status='process';
    } else {
      if (['message','correction'].includes(post.kind) && thread.status==='help') thread.status='process';
      if (post.kind==='guidance') thread.status='revision';
      if (post.kind==='complete') thread.status='complete';
    }
    thread.posts.push(post);
    thread.updatedAt=post.createdAt;
    return thread;
  },
  needsTeacher(thread) {
    const last = thread.posts.at(-1);
    return thread.status==='submitted' || (thread.status!=='complete' && last?.role==='student');
  },
  unread(thread, viewer, seen) {
    const index=seen[viewer+'|'+thread.id] || 0;
    return thread.posts.slice(index).filter(post => viewer==='teacher' ? post.role==='student' : post.role==='teacher').length;
  },
  validate(data, school, deliveries) {
    if (!data || data.version!==2 || !Array.isArray(data.threads) || data.threads.length>1000) throw new Error('Sketchbooks incompatíveis nesta cópia.');
    const ids = new Set(), works=new Map(deliveries.map(d=>[d.id,d]));
    for (const thread of data.threads) {
      const person=school.students.find(p=>p.id===thread.studentId);
      if (typeof thread.id!=='string' || ids.has(thread.id) || !person || person.classId!==thread.classId || typeof thread.title!=='string' || !Object.hasOwn(this.statuses, thread.status) || !Array.isArray(thread.posts) || thread.posts.length>1000) throw new Error('Estudo inválido na cópia.');
      ids.add(thread.id);
      if (thread.assignmentId && !school.assignments.some(a=>a.id===thread.assignmentId && a.classId===thread.classId)) throw new Error('Exercício inválido na cópia.');
      for (const post of thread.posts) {
        const work=works.get(post.deliveryId);
        if (typeof post.id!=='string' || !['teacher','student'].includes(post.role) || typeof post.text!=='string' || typeof post.kind!=='string' || !Number.isFinite(Date.parse(post.createdAt)) || (post.deliveryId && (!work || work.studentId!==thread.studentId || work.classId!==thread.classId))) throw new Error('Mensagem inválida na cópia.');
        if (post.image && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(post.image)) throw new Error('Imagem inválida na conversa.');
      }
    }
    for (const key of ['seen','drafts','locations','roomMessages','publications','boards','liveLessons']) if (!data[key] || typeof data[key]!=='object' || Array.isArray(data[key])) throw new Error('Contexto incompleto na cópia.');
    const image=value=>typeof value==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
    for(const draft of Object.values(data.drafts)) if(!draft||typeof draft!=='object'||draft.text!==undefined&&typeof draft.text!=='string'||draft.image&&!image(draft.image)) throw new Error('Rascunho inválido na cópia.');
    for(const location of Object.values(data.locations)) if(!location||!['hall','classroom','desks','gallery','cafe'].includes(location.space)||!['hall','classroom','desks','gallery','cafe','table-1','table-2'].includes(location.group)||typeof location.joined!=='boolean'||!location.position||![location.position.x,location.position.y].every(Number.isFinite)) throw new Error('Espaço inválido na cópia.');
    for(const messages of Object.values(data.roomMessages)) if(!Array.isArray(messages)||messages.length>2000||messages.some(m=>!m||typeof m.text!=='string'||typeof m.name!=='string'||!Number.isFinite(Date.parse(m.createdAt)))) throw new Error('Conversa de espaço inválida na cópia.');
    for(const [threadId,workId] of Object.entries(data.publications)) if(!ids.has(threadId)||!works.has(workId)||(works.get(workId).rootId||works.get(workId).id)!==threadId) throw new Error('Publicação inválida na cópia.');
    for(const board of Object.values(data.boards)) if(!board||board.customBoard&&!image(board.customBoard.image)||!Array.isArray(board.strokes)||board.strokes.length>1000||board.strokes.some(s=>!s||!['pen','eraser'].includes(s.tool)||!['#de2246','#29272d','#327abd'].includes(s.color)||!Number.isFinite(s.size)||s.size<=0||!Array.isArray(s.points)||s.points.length>20000||s.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(n=>Number.isFinite(n)&&n>=-10&&n<=10)))) throw new Error('Anotação inválida na cópia.');
    return data;
  }
};
