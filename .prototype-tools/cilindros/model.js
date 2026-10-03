(function(root){
 'use strict';
 const E=typeof module!=='undefined'&&module.exports?require('../elipse/model.js'):root.EllipseCore;
 const {clamp,distance,project,ellipseFromHomography,ellipsePoints,segmentDistance}=E;
 const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 const add=(a,b)=>a.map((v,i)=>v+b[i]);
 const mul=(a,s)=>a.map(v=>v*s);
 const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

 // Both end circles and the generators belong to one right circular cylinder.
 // Perspective changes their apparent size, never their physical radius.
 function generate(level=0,random=Math.random){
  const tilt=level===0?.95+random()*.2:level===1?.75+random()*.35:.48+random()*.27;
  const roll=(level===0?[-.45,0,.45][Math.floor(random()*3)]:random()*Math.PI*2);
  const c=Math.cos(roll),s=Math.sin(roll),sin=Math.sin(tilt),cos=Math.cos(tilt);
  const axis=[sin*c,sin*s,cos],u=[cos*c,cos*s,-sin],v=[-s,c,0];
  const length=level===2?2.8+random()*1.3:3.5+random(),depth=level===0?9:7.5+random()*2;
  const ends=[add([0,0,depth],mul(axis,-length/2)),add([0,0,depth],mul(axis,length/2))];
  const matrix=center=>[u[0],v[0],center[0],u[1],v[1],center[1],level===0?0:u[2],level===0?0:v[2],level===0?depth:center[2]];
  const raw=ends.map(matrix);
  const ring=h=>Array.from({length:241},(_,i)=>project(h,Math.cos(i*Math.PI/120),Math.sin(i*Math.PI/120)));
  const samples=raw.flatMap(ring),xs=samples.map(p=>p.x),ys=samples.map(p=>p.y);
  const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const scale=Math.min(620/(x1-x0),360/(y1-y0));
  const ox=450-scale*(x0+x1)/2,oy=280-scale*(y0+y1)/2;
  const transform=h=>[scale*h[0]+ox*h[6],scale*h[1]+ox*h[7],scale*h[2]+ox*h[8],scale*h[3]+oy*h[6],scale*h[4]+oy*h[7],scale*h[5]+oy*h[8],...h.slice(6)];
  const matrices=raw.map(transform),ellipses=matrices.map(ellipseFromHomography),rings=matrices.map(ring);
  // Surface normal at a silhouette point is orthogonal to the viewing ray.
  // Orthographic: n·view=0. Perspective: radial·(-end)=radius (here 1).
  const cameraVector=level===0?[0,0,-1]:mul(ends[0],-1);
  const a=dot(u,cameraVector),b=dot(v,cameraVector),phi=Math.atan2(b,a);
  const angle=Math.acos((level===0?0:1)/Math.hypot(a,b));
  const sides=[phi-angle,phi+angle].map(t=>matrices.map(h=>project(h,Math.cos(t),Math.sin(t))));
  const axisPoints=matrices.map(h=>project(h,0,0));
  const sections=[.25,.5,.75].map(t=>ring(transform(matrix(add(mul(ends[0],1-t),mul(ends[1],t))))));
  return{level,ellipses,matrices,rings,sides,axis:axisPoints,sections,parts:[...rings,...sides]};
 }

 // Arc-length sampling keeps pen event frequency from changing the grade.
 function resample(points,step=3){
  if(points.length<2)return[];
  const result=[points[0]];let carried=0;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],length=distance(a,b);if(!length)continue;
   for(let d=step-carried;d<=length;d+=step)result.push(lerp(a,b,d/length));
   carried=(carried+length)%step;
  }
  result.push(points[points.length-1]);return result;
 }
 function nearest(p,path){let d=Infinity;for(let i=1;i<path.length;i++)d=Math.min(d,segmentDistance(p,path[i-1],path[i]));return d;}
 function assessPart(target,drawing){
  if(!drawing||drawing.length<2||drawing.some(p=>!Number.isFinite(p.x+p.y)))return{score:0,error:null,coverage:0,gap:null};
  const samples=resample(drawing),reference=resample(target);
  if(samples.length<3)return{score:0,error:null,coverage:0,gap:null};
  const errors=samples.map(p=>nearest(p,target)),missing=reference.map(p=>nearest(p,drawing));
  const quality=values=>values.reduce((sum,d)=>sum+Math.exp(-.5*(d/5)**2),0)/values.length;
  const precision=quality(errors),coverage=quality(missing);
  return{score:Math.round(100*(precision+coverage?2*precision*coverage/(precision+coverage):0)),error:errors.reduce((s,d)=>s+d,0)/errors.length,coverage:Math.round(coverage*100),gap:distance(drawing[0],drawing[drawing.length-1])};
 }
 function assess(task,drawings){
  const parts=task.parts.map((target,i)=>assessPart(target,drawings[i]));
  // Side order is immaterial: either lateral may be drawn first.
  const swapped=[assessPart(task.parts[3],drawings[2]),assessPart(task.parts[2],drawings[3])];
  if(swapped[0].score+swapped[1].score>parts[2].score+parts[3].score)parts.splice(2,2,...swapped);
  return{score:Math.round(parts.reduce((s,p)=>s+p.score,0)/4),parts};
 }
 const api={generate,assess,assessPart,resample,ellipsePoints,clamp,distance};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CylinderCore=api;
})(typeof window!=='undefined'?window:globalThis);
