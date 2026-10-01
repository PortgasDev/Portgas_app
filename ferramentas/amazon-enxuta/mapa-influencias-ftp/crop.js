let cropArtist=null,cropDraft=null;
const cropDialog=document.createElement('dialog');cropDialog.className='crop-dialog';
cropDialog.innerHTML='<form method="dialog"><div class="crop-heading"><h2>Enquadrar imagem</h2><button value="cancel" aria-label="Fechar editor">×</button></div><p>Arraste a imagem para escolher o recorte.</p><div class="crop-preview" tabindex="0" role="img" aria-label="Prévia do recorte. Arraste ou use as setas para posicionar."><img alt="" draggable="false"></div><label for="crop-zoom">Zoom <output id="crop-value">100%</output></label><input id="crop-zoom" type="range" min="1" max="4" step="0.01" value="1"><div class="crop-actions"><button type="button" id="crop-reset">Restaurar</button><button value="cancel">Cancelar</button><button type="button" id="crop-apply">Aplicar recorte</button></div></form>';
document.body.append(cropDialog);
const cropPreview=cropDialog.querySelector('.crop-preview'),cropImage=cropPreview.querySelector('img'),cropZoom=cropDialog.querySelector('#crop-zoom');
function cropGeometry(image,width,height,crop={}){
  crop=crop||{};
  const zoom=crop.zoom||1,scale=Math.max(width/image.naturalWidth,height/image.naturalHeight)*zoom;
  const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  return {width:w,height:h,x:(width-w)*(1+(crop.x||0))/2,y:(height-h)*(1+(crop.y||0))/2};
}
function positionPhoto(img,source,crop,width,height){const g=cropGeometry(source,width,height,crop);Object.assign(img.style,{width:g.width+'px',height:g.height+'px',left:g.x+'px',top:g.y+'px',right:'auto',bottom:'auto',objectFit:'fill'});}
function refreshPhotos(){document.querySelectorAll('#grid .tile').forEach((tile,index)=>{const img=tile.querySelector('.photo-button img');if(img&&artists[index].image)positionPhoto(img,artists[index].image,artists[index].crop,tile.clientWidth,tile.clientHeight);});}
new ResizeObserver(refreshPhotos).observe(document.getElementById('grid'));
function updateCropPreview(){if(!cropArtist)return;positionPhoto(cropImage,cropArtist.image,cropDraft,cropPreview.clientWidth,cropPreview.clientHeight);cropZoom.value=cropDraft.zoom;document.getElementById('crop-value').textContent=Math.round(cropDraft.zoom*100)+'%';}
function openCrop(index){cropArtist=artists[index];if(!cropArtist.image)return;cropDraft={zoom:1,x:0,y:0,...cropArtist.crop};const tile=document.querySelectorAll('#grid .tile')[index];cropPreview.style.aspectRatio=`${tile.clientWidth} / ${tile.clientHeight}`;cropImage.onload=updateCropPreview;cropImage.src=cropArtist.url;cropDialog.showModal();cropPreview.style.width=Math.min(330,cropDialog.clientWidth-44,window.innerHeight*.48*tile.clientWidth/tile.clientHeight)+'px';updateCropPreview();}
cropZoom.oninput=()=>{cropDraft.zoom=Number(cropZoom.value);updateCropPreview();};
cropPreview.onpointerdown=e=>{e.preventDefault();cropPreview.focus();cropPreview.setPointerCapture(e.pointerId);let lastX=e.clientX,lastY=e.clientY;
  cropPreview.onpointermove=event=>{const g=cropGeometry(cropArtist.image,cropPreview.clientWidth,cropPreview.clientHeight,cropDraft);const excessX=g.width-cropPreview.clientWidth,excessY=g.height-cropPreview.clientHeight;if(excessX>0)cropDraft.x=Math.max(-1,Math.min(1,cropDraft.x-2*(event.clientX-lastX)/excessX));if(excessY>0)cropDraft.y=Math.max(-1,Math.min(1,cropDraft.y-2*(event.clientY-lastY)/excessY));lastX=event.clientX;lastY=event.clientY;updateCropPreview();};
  cropPreview.onpointerup=cropPreview.onpointercancel=()=>{cropPreview.onpointermove=null;};
};
cropPreview.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();cropDraft.x=Math.max(-1,Math.min(1,cropDraft.x+(e.key==='ArrowLeft'?.05:e.key==='ArrowRight'?-.05:0)));cropDraft.y=Math.max(-1,Math.min(1,cropDraft.y+(e.key==='ArrowUp'?.05:e.key==='ArrowDown'?-.05:0)));updateCropPreview();};
document.getElementById('crop-reset').onclick=()=>{cropDraft={zoom:1,x:0,y:0};updateCropPreview();};
document.getElementById('crop-apply').onclick=()=>{cropArtist.crop={...cropDraft};cropDialog.close();render();status('Recorte aplicado. A imagem original foi preservada.');};
new ResizeObserver(()=>{if(cropDialog.open)updateCropPreview();}).observe(cropPreview);

