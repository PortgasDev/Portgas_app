(function (root) {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function rotate([x,y,z],yaw,pitch){
    const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
    return [xx,y*Math.cos(pitch)-zz*Math.sin(pitch),y*Math.sin(pitch)+zz*Math.cos(pitch)];
  }
  function inverse(m){
    const [a,b,c,d,e,f,g,h,i]=m;
    const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
    if(Math.abs(det)<1e-12)throw new Error('Degenerate projection');
    return [e*i-f*h,c*h-b*i,b*f-c*e,f*g-d*i,a*i-c*g,c*d-a*f,d*h-e*g,b*g-a*h,a*e-b*d].map(n=>n/det);
  }
  function project(h,x,y){const z=h[6]*x+h[7]*y+h[8];return{x:(h[0]*x+h[1]*y+h[2])/z,y:(h[3]*x+h[4]*y+h[5])/z};}
  function ellipseFromHomography(h){
    const inv=inverse(h),q=Array(9).fill(0);
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++)q[i*3+j]+=inv[k*3+i]*(k===2?-1:1)*inv[k*3+j];
    const a=q[0],b=q[1],c=q[4],d=q[2],e=q[5],f=q[8],det=a*c-b*b;
    const center={x:(b*e-c*d)/det,y:(b*d-a*e)/det};
    const k=-(f+d*center.x+e*center.y),delta=Math.hypot(a-c,2*b);
    return{center,a:Math.sqrt(k/((a+c-delta)/2)),b:Math.sqrt(k/((a+c+delta)/2)),angle:(Math.atan2(2*b,a-c)/2+Math.PI/2)*180/Math.PI};
  }
  function generate(level=0,random=Math.random){
    const sign=()=>random()<.5?-1:1;
    const yaw=(level===0?.18+random()*.5:level===1?.3+random()*.55:.75+random()*.43)*sign();
    const pitch=(level===0?.1+random()*.45:level===1?.2+random()*.6:.45+random()*.35)*sign();
    const u=rotate([1,0,0],yaw,pitch),v=rotate([0,1,0],yaw,pitch),depth=4.2+random()*1.3;
    const h=[u[0],v[0],0,-u[1],-v[1],0,level===0?0:u[2],level===0?0:v[2],depth];
    const coordinates=[[-1,-1],[1,-1],[1,1],[-1,1]];
    const raw=coordinates.map(([x,y])=>project(h,x,y));
    const minX=Math.min(...raw.map(p=>p.x)),maxX=Math.max(...raw.map(p=>p.x)),minY=Math.min(...raw.map(p=>p.y)),maxY=Math.max(...raw.map(p=>p.y));
    const scale=Math.min(540/(maxX-minX),370/(maxY-minY));
    const ox=450-scale*(minX+maxX)/2,oy=305-scale*(minY+maxY)/2;
    const transform=[scale*h[0]+ox*h[6],scale*h[1]+ox*h[7],ox*h[8],scale*h[3]+oy*h[6],scale*h[4]+oy*h[7],oy*h[8],...h.slice(6)];
    const face=coordinates.map(([x,y])=>project(transform,x,y));
    const target=Array.from({length:241},(_,i)=>project(transform,Math.cos(i/240*Math.PI*2),Math.sin(i/240*Math.PI*2)));
    const contacts=[[1,0],[0,1],[-1,0],[0,-1]].map(([x,y])=>project(transform,x,y));
    return{level,face,target,contacts,center:project(transform,0,0),ellipse:ellipseFromHomography(transform),transform};
  }
  function ellipsePoints(shape,count=240){
    const angle=shape.angle*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
    return Array.from({length:count+1},(_,i)=>{const t=i/count*Math.PI*2,x=shape.a*Math.cos(t),y=shape.b*Math.sin(t);return{x:shape.center.x+x*c-y*s,y:shape.center.y+x*s+y*c};});
  }
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function resample(points,step=5){
    const samples=[];
    for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.ceil(distance(a,b)/step);for(let j=0;j<n;j++){const t=(j+.5)/n;samples.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}
    return samples;
  }
  function nearest(p,points){let best=Infinity;for(let i=1;i<points.length;i++)best=Math.min(best,segmentDistance(p,points[i-1],points[i]));return best;}
  function assess(task,points){
    if(!points||points.length<3)return null;
    const drawing=resample(points),target=resample(task.target);
    if(!drawing.length)return null;
    const quality=d=>Math.exp(-.5*(d/10)**2);
    const coverage=target.reduce((s,p)=>s+quality(nearest(p,points)),0)/target.length;
    const precision=drawing.reduce((s,p)=>s+quality(nearest(p,task.target)),0)/drawing.length;
    const score=coverage+precision?Math.round(100*2*coverage*precision/(coverage+precision)):0;
    return{score,coverage:Math.round(coverage*100),precision:Math.round(precision*100),gap:distance(points[0],points[points.length-1])};
  }
  const api={clamp,distance,rotate,project,generate,ellipseFromHomography,ellipsePoints,segmentDistance,resample,assess};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EllipseCore=api;
})(typeof window!=='undefined'?window:globalThis);
