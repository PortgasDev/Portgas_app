const $ = (id) => document.getElementById(id);
const artists = Array.from({length:20},()=>({name:'',url:'',image:null}));
let count=8, selected=0, pending=0, dragged=null, moving=null;
let deletedFrame=null;
const status=(text)=>{$('status').textContent=text;};
function updateProgress(){ $('progress').textContent=`${count} ${count===1?'artista':'artistas'} · ${artists.slice(0,count).filter(a=>a.url).length} fotos`; }
function render(){
  const grid=$('grid'); grid.replaceChildren();
  const layout=packLayout(artists.slice(0,count));
  artists.slice(0,count).forEach((artist,index)=>{
    const tile=document.createElement('div');tile.className='tile';tile.dataset.index=index;
    const slot=layout[index];tile.style.gridColumn=`${slot.column} / span ${slot.width}`;tile.style.gridRow=`${slot.row} / span ${slot.height}`;
    tile.classList.toggle('compact',slot.height===1);tile.classList.toggle('moving',moving===index);
    const resize=document.createElement('button');resize.className='resize-handle';resize.textContent='◢';resize.setAttribute('aria-label',`Redimensionar arte ${index+1}`);resize.title='Arraste para redimensionar. Use as setas do teclado para ajustar.';
    resize.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();artist.size={width:Math.max(3,Math.min(12,slot.width+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0))),height:Math.max(1,Math.min(5,slot.height+(e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0)))};render();$('grid').querySelectorAll('.resize-handle')[index].focus();};
    resize.onpointerdown=e=>{e.preventDefault();e.stopPropagation();resize.setPointerCapture(e.pointerId);const startX=e.clientX,startY=e.clientY;const css=getComputedStyle(grid),gap=parseFloat(css.columnGap)||0,unit=(grid.clientWidth+gap)/12,rowUnit=parseFloat(css.gridAutoRows)+gap;let next={width:slot.width,height:slot.height};
      resize.onpointermove=event=>{next={width:Math.max(3,Math.min(12,slot.width+Math.round((event.clientX-startX)/unit))),height:Math.max(1,Math.min(5,slot.height+Math.round((event.clientY-startY)/rowUnit)))};artist.size=next;const updated=packLayout(artists.slice(0,count));[...grid.children].forEach((el,i)=>{el.style.gridColumn=`${updated[i].column} / span ${updated[i].width}`;el.style.gridRow=`${updated[i].row} / span ${updated[i].height}`;});if(typeof refreshPhotos === 'function')refreshPhotos();};
      const finish=()=>{resize.onpointermove=null;resize.onpointerup=null;resize.onpointercancel=null;render();status('Tamanho atualizado e mosaico reorganizado.');};resize.onpointerup=finish;resize.onpointercancel=finish;
    };
    const button=document.createElement('button');button.className='photo-button';button.type='button';button.setAttribute('aria-label',`${artist.url?'Trocar':'Adicionar'} imagem do artista ${index+1}`);
    if(artist.url){const img=document.createElement('img');img.src=artist.url;img.alt=artist.name||`Referência ${index+1}`;button.append(img);const label=document.createElement('span');label.className='replace-label';label.textContent='Trocar imagem';button.append(label);}
    else{const number=document.createElement('span');number.className='tile-number';number.textContent=String(index+1).padStart(2,'0');const icon=document.createElement('span');icon.className='photo-icon';icon.textContent='+';const caption=document.createElement('span');caption.textContent='Adicionar imagem';button.append(number,icon,caption);}
    button.onclick=()=>{if(moving!==null){moveArtist(moving,index);return;}selected=index;$('upload').click();};tile.append(button);
    button.draggable=true;
    button.ondragstart=e=>startDrag(e,index);
    button.ondragend=clearDrag;
    const input=document.createElement('input');input.className='artist';input.type='text';input.maxLength=70;input.placeholder='Nome do artista';input.value=artist.name;input.setAttribute('aria-label',`Nome do artista ${index+1}`);input.oninput=()=>{artist.name=input.value;const img=button.querySelector('img');if(img)img.alt=artist.name||`Referência ${index+1}`;};tile.append(input);
    const remove=document.createElement('button');remove.className='remove';remove.textContent='×';remove.title='Excluir este quadro';remove.setAttribute('aria-label',`Excluir quadro ${index+1}`);remove.onclick=()=>deleteFrame(index);tile.append(remove);
    const moveHandle=button;
    moveHandle.onpointerdown=e=>{
      if(e.pointerType==='mouse'||pending)return;
      const x=e.clientX,y=e.clientY;let target=index,active=false;
      moveHandle.setPointerCapture(e.pointerId);
      moveHandle.onpointermove=event=>{
        if(!active&&Math.hypot(event.clientX-x,event.clientY-y)<8)return;
        active=true;tile.classList.add('dragging');
        const destination=document.elementFromPoint(event.clientX,event.clientY)?.closest('.tile');
        document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
        target=destination?Number(destination.dataset.index):index;
        if(destination)destination.classList.add('drop-target');
      };
      moveHandle.onpointerup=()=>{moveHandle.onpointermove=null;moveHandle.onpointerup=null;if(active){clearDrag();moveArtist(index,target);}};
      moveHandle.onpointercancel=()=>{moveHandle.onpointermove=null;moveHandle.onpointerup=null;clearDrag();};
    };
    if(artist.url){const crop=document.createElement('button');crop.className='crop-button';crop.setAttribute('aria-label',`Enquadrar imagem do artista ${index+1}`);crop.title='Enquadrar imagem: zoom e recorte';crop.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2v16h16M2 6h16v16"/></svg>';crop.onclick=()=>openCrop(index);tile.append(crop);}
    tile.append(resize);
    tile.ondragover=e=>{e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect=dragged!==null?'move':'copy';tile.classList.add('drop-target');};
    tile.ondragleave=e=>{if(!tile.contains(e.relatedTarget))tile.classList.remove('drop-target');};
    tile.ondrop=async e=>{e.preventDefault();e.stopPropagation();tile.classList.remove('drop-target');if(dragged!==null){moveArtist(dragged,index);clearDrag();return;}await dropFiles([...e.dataTransfer.files],index);};grid.append(tile);
  });
  $('plus').disabled=count===20;updateProgress();if(typeof refreshPhotos === 'function')refreshPhotos();
}
function changeCount(value){const parsed=Number(value);count=Number.isFinite(parsed)?Math.min(20,Math.max(1,Math.round(parsed))):8;moving=null;render();}
function deleteFrame(index){
  if(pending){status('Aguarde as imagens terminarem de carregar.');return;}
  if(deletedFrame?.artist.url)URL.revokeObjectURL(deletedFrame.artist.url);
  deletedFrame={artist:artists.splice(index,1)[0],index};
  artists.push({name:'',url:'',image:null});count=Math.max(0,count-1);moving=null;clearDrag();render();
  status('Quadro excluído. ');
  const undo=document.createElement('button');undo.className='undo-delete';undo.textContent='Desfazer';
  undo.onclick=()=>{
    if(!deletedFrame)return;
    const last=artists.pop();if(last.url)URL.revokeObjectURL(last.url);
    artists.splice(deletedFrame.index,0,deletedFrame.artist);count=Math.min(20,count+1);deletedFrame=null;render();status('Quadro restaurado.');
  };
  $('status').append(undo);
}
function startDrag(e,index){if(pending){e.preventDefault();return;}dragged=index;moving=null;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',`Artista ${index+1}`);e.currentTarget.closest('.tile').classList.add('dragging');}
function clearDrag(){dragged=null;document.querySelectorAll('.dragging,.drop-target').forEach(el=>el.classList.remove('dragging','drop-target'));}
function moveArtist(from,to){if(pending){status('Aguarde as imagens terminarem de carregar.');return;}if(from!==to){const layout=packLayout(artists.slice(0,count));artists.slice(0,count).forEach((artist,i)=>{if(!artist.size)artist.size={width:layout[i].width,height:layout[i].height};});const [artist]=artists.splice(from,1);artists.splice(to,0,artist);}moving=null;render();status(from===to?'Movimento cancelado.':'Quadro movido com seu tamanho, nome e foto. Mosaico reorganizado.');}
async function dropFiles(files,start){
  if(!files.length){status('Arraste um arquivo de imagem do computador. Para imagens de outro site, baixe a imagem primeiro.');return;}
  const images=files.filter(f=>['image/jpeg','image/png','image/webp','image/gif'].includes(f.type));
  if(!images.length){status('Escolha imagens JPG, PNG, WebP ou GIF.');return;}
  const targets=start===undefined?artists.slice(0,count).flatMap((a,i)=>a.url?[]:[i]):[start,...artists.slice(0,count).flatMap((a,i)=>i!==start&&!a.url?[i]:[])];
  if(!targets.length){status('Todos os quadros estão preenchidos. Solte a imagem sobre o quadro que deseja substituir.');return;}
  for(let i=0;i<Math.min(images.length,targets.length);i++)await loadPhoto(images[i],targets[i]);
  if(images.length>targets.length)status('Algumas imagens não couberam. Aumente a quantidade de artistas e arraste as imagens restantes.');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('.crop-dialog[open]')){moving=null;clearDrag();render();status('Movimento cancelado.');}});
document.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files'))e.preventDefault();});
document.addEventListener('drop',e=>{e.preventDefault();if(dragged!==null){clearDrag();return;}dropFiles([...e.dataTransfer.files]);});
$('plus').onclick=()=>{if(count>=20)return;artists[count]={name:'',url:'',image:null};count++;moving=null;render();status('Novo quadro adicionado.');};
$('upload').onchange=async(e)=>{const file=e.target.files[0];const target=selected;e.target.value='';if(file)await loadPhoto(file,target);};
async function loadPhoto(file,index){
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)){status('Escolha uma imagem JPG, PNG, WebP ou GIF.');return;}
  if(file.size>25*1024*1024){status('Essa imagem é muito grande. Escolha um arquivo de até 25 MB.');return;}
  const artist=artists[index];const version=(artist.version||0)+1;artist.version=version;
  const url=URL.createObjectURL(file);pending++;$('download').disabled=true;
  try{const image=new Image();image.src=url;await image.decode();if(artist.version!==version){URL.revokeObjectURL(url);return;}if(artist.url)URL.revokeObjectURL(artist.url);artist.url=url;artist.image=image;artist.crop={zoom:1,x:0,y:0};status('Imagem adicionada. Arraste a foto para outro quadro para reorganizar.');}
  catch{URL.revokeObjectURL(url);status('Não foi possível abrir essa imagem. Tente outro arquivo.');}
  finally{pending--;if(!pending)$('download').disabled=false;}
  render();
}
async function getImage(src){const image=new Image();image.src=src;await image.decode();return image;}
function cover(ctx,image,x,y,w,h,crop){const ratio=Math.max(w/image.naturalWidth,h/image.naturalHeight)*(crop?.zoom||1);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-image.naturalWidth*ratio)*(1+(crop?.x||0))/2,y+(h-image.naturalHeight*ratio)*(1+(crop?.y||0))/2,image.naturalWidth*ratio,image.naturalHeight*ratio);ctx.restore();}
function wrap(ctx,text,width){const lines=[];let line='';for(const char of text){if(ctx.measureText(line+char).width>width&&line){lines.push(line);line=char;}else line+=char;}if(line)lines.push(line);return lines;}
$('download').onclick=async()=>{
  const button=$('download');button.disabled=true;status('Preparando seu board…');
  try{
    const [background,logo]=await Promise.all([getImage('assets/background.png'),getImage('assets/logo.png')]);
    const board=$('board'), bounds=board.getBoundingClientRect(), scale=1800/bounds.width;
    const stripHeight=$('plus').getBoundingClientRect().height+14;
    const exportHeight=bounds.height-stripHeight;
    const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=Math.ceil(exportHeight*scale);const ctx=canvas.getContext('2d');ctx.scale(scale,scale);cover(ctx,background,0,0,bounds.width,exportHeight);
    const relative=(element)=>{const r=element.getBoundingClientRect();return{x:r.x-bounds.x,y:r.y-bounds.y,w:r.width,h:r.height};};
    for(const el of [board.querySelector('.board-heading p'),$('board-name')]){const r=relative(el),css=getComputedStyle(el);ctx.font=`${css.fontWeight} ${css.fontSize} Arial`;ctx.fillStyle=css.color;ctx.textAlign='center';ctx.textBaseline='top';const lines=wrap(ctx,(el.value===undefined?el.textContent:(el.value.trim()||'SEU NOME')).toUpperCase(),r.w);const height=parseFloat(css.lineHeight)||parseFloat(css.fontSize)*1.2;lines.forEach((line,i)=>ctx.fillText(line,r.x+r.w/2,r.y+i*height));}
    [...$('grid').children].forEach((tile,i)=>{const r=relative(tile),artist=artists[i];if(artist.image)cover(ctx,artist.image,r.x,r.y,r.w,r.h,artist.crop);else{ctx.fillStyle='#30323e';ctx.fillRect(r.x,r.y,r.w,r.h);}const input=tile.querySelector('input'),css=getComputedStyle(input);ctx.font=`700 ${css.fontSize} Arial`;const lines=wrap(ctx,artist.name||'NOME DO ARTISTA',r.w-20);const lineHeight=parseFloat(css.fontSize)*1.25;const textHeight=lines.length*lineHeight;const gradient=ctx.createLinearGradient(0,r.y+r.h-textHeight-28,0,r.y+r.h);gradient.addColorStop(0,'#11121900');gradient.addColorStop(1,'#111219e8');ctx.fillStyle=gradient;ctx.fillRect(r.x,r.y+r.h-textHeight-28,r.w,textHeight+28);ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();ctx.fillStyle='white';ctx.textAlign='left';ctx.textBaseline='top';lines.forEach((line,j)=>ctx.fillText(line,r.x+10,r.y+r.h-textHeight-10+j*lineHeight));ctx.restore();});
    const lr=relative(board.querySelector('.board-footer img'));
    // Export omits the editing control and closes the space it occupies.
    lr.y-=stripHeight;
const logoScale=Math.min(lr.w/logo.naturalWidth,lr.h/logo.naturalHeight);ctx.drawImage(logo,lr.x+(lr.w-logo.naturalWidth*logoScale)/2,lr.y+(lr.h-logo.naturalHeight*logoScale)/2,logo.naturalWidth*logoScale,logo.naturalHeight*logoScale);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('export');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;const name=$('board-name').value.trim().replace(/[^\p{L}\p{N} -]/gu,'').slice(0,60)||'xuimart';a.download=`mapa-de-influencias-${name}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status('Board pronto! Confira a imagem nos seus downloads.');
  }catch{status('Não foi possível baixar o board. Suas imagens continuam aqui; tente novamente.');}finally{button.disabled=false;}
};
window.addEventListener('beforeunload',e=>{if(artists.some(a=>a.url||a.name)||$('board-name').value){e.preventDefault();e.returnValue='';}});
render();








