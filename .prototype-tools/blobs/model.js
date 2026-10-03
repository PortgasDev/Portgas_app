(function(root){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function seeded(text){let a=2166136261;for(const c of String(text))a=Math.imul(a^c.charCodeAt(0),16777619);return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
 function inside(p,polygon){let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
 function intersects(a,b,c,d){
  const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  return cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8;
 }
 function simple(points){
  const n=points.length-1;
  for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){if(i===0&&j===n-1)continue;if(intersects(points[i],points[i+1],points[j],points[j+1]))return false;}
  return true;
 }
 function generate(level=0,seed='preview'){
  level=clamp(Math.floor(level),0,2);const random=seeded(seed),sign=()=>random()*2-1;
  const length=level===0?380+random()*120:450+random()*100,base=level===0?100+random()*25:85+random()*25;
  let bend=sign()*[32,65,100][level],wave=sign()*[0,20,36][level];
  const waist=[.09,.22,.3][level],phase=random()*Math.PI*2,roll=random()*Math.PI*2;
  const radius=t=>base*Math.sqrt(Math.max(0,1-(2*t-1)**2))*(1+waist*Math.cos(4*Math.PI*t+phase)+.09*Math.sin(2*Math.PI*t));
  const center=t=>({x:(t-.5)*length,y:bend*Math.sin(Math.PI*t)+wave*Math.sin(2*Math.PI*t)});
  const tangent=t=>{const dy=bend*Math.PI*Math.cos(Math.PI*t)+wave*2*Math.PI*Math.cos(2*Math.PI*t),n=Math.hypot(length,dy);return{x:length/n,y:dy/n};};
  const boundary=(t,side)=>{const c=center(t),d=tangent(t),r=radius(t);return{x:c.x-d.y*r*side,y:c.y+d.x*r*side};};
  let raw=[];
  for(let attempt=0;attempt<8;attempt++){
   raw=Array.from({length:361},(_,i)=>{const a=i*Math.PI/180,t=(1-Math.cos(a))/2;return boundary(t,Math.sin(a)>=0?1:-1);});
   if(simple(raw))break;bend*=.65;wave*=.65;
  }
  const rotate=p=>({x:p.x*Math.cos(roll)-p.y*Math.sin(roll),y:p.x*Math.sin(roll)+p.y*Math.cos(roll)});
  const rotated=raw.map(rotate),xs=rotated.map(p=>p.x),ys=rotated.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(620/(maxX-minX),410/(maxY-minY));
  const transform=p=>{const q=rotate(p);return{x:450+(q.x-(maxX+minX)/2)*scale,y:300+(q.y-(maxY+minY)/2)*scale};};
  const outline=raw.map(transform),axis=Array.from({length:81},(_,i)=>transform(center(i/80)));
  // Illustrative cross contours, with both readings available. No grading target.
  const readings=[1,-1].map(direction=>{
   const front=[],back=[];
   for(const t of[.18,.34,.5,.66,.82]){
    const c=center(t),d=tangent(t),r=radius(t)*.99;
    for(let opening=.5;opening>=.06;opening*=.7){
     const arc=side=>Array.from({length:65},(_,i)=>{const a=i*Math.PI/64,n=r*Math.cos(a),u=r*opening*Math.sin(a)*side;return transform({x:c.x-d.y*n+d.x*u,y:c.y+d.x*n+d.y*u});});
     const f=arc(direction),b=arc(-direction);
     if([...f,...b].every(p=>inside(p,outline))){front.push(f);back.push(b);break;}
    }
   }
   return{front,back};
  });
  return{level,seed:String(seed),outline,axis,readings};
 }
 function linePath(points,closed=false){return points.length?points.map((p,i)=>(i?'L':'M')+p.x.toFixed(2)+','+p.y.toFixed(2)).join(' ')+(closed?'Z':''):'';}
 function smoothPath(points){
  if(points.length<3)return linePath(points);
  let d='M'+points[0].x+','+points[0].y;
  for(let i=1;i<points.length-1;i++){const a=points[i],b=points[i+1];d+=' Q'+a.x+','+a.y+' '+((a.x+b.x)/2)+','+((a.y+b.y)/2);}
  const last=points[points.length-1];return d+' L'+last.x+','+last.y;
 }
 function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 function hitStroke(p,stroke,tolerance=10){for(let i=1;i<stroke.points.length;i++)if(segmentDistance(p,stroke.points[i-1],stroke.points[i])<tolerance+stroke.width/2)return true;return false;}
 function validStrokes(value){
  if(!Array.isArray(value)||value.length>180)return null;
  const strokes=[];
  for(const s of value){
   if(!s||!Array.isArray(s.points)||s.points.length<2||s.points.length>3000||![2,3.5,5].includes(s.width)||typeof s.dashed!=='boolean')return null;
   if(s.points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>900||p.y<0||p.y>600))return null;
   strokes.push({width:s.width,dashed:s.dashed,points:s.points.map(p=>({x:p.x,y:p.y}))});
  }
  return strokes;
 }
 const api={generate,seeded,inside,simple,linePath,smoothPath,hitStroke,validStrokes,distance,clamp};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.BlobCore=api;
})(typeof window!=='undefined'?window:globalThis);
