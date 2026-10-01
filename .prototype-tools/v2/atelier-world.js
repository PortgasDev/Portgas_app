// Geometry is shared by the scene and the movement engine.
const ATELIER_ROOMS = {
  hall: {name:'Entre os espaços', x:512, y:368},
  classroom: {name:'Sala de aula', x:272, y:272, bounds:[48,48,416,256]},
  desks: {name:'Mesas de estudo', x:784, y:272, bounds:[560,48,416,256]},
  gallery: {name:'Galeria', x:272, y:560, bounds:[48,432,416,224]},
  cafe: {name:'Café', x:784, y:592, bounds:[560,432,416,224]}
};
const ATELIER_WALLS = [
  [32,32,448,16],[32,48,16,272],[464,48,16,272],[32,304,192,16],[320,304,160,16],
  [544,32,448,16],[544,48,16,272],[976,48,16,272],[544,304,192,16],[832,304,160,16],
  [32,416,192,16],[320,416,160,16],[32,432,16,240],[464,432,16,240],[32,656,448,16],
  [544,416,192,16],[832,416,160,16],[544,432,16,240],[976,432,16,240],[544,656,448,16]
];
const ATELIER_FURNITURE = [
  {kind:'board', x:128,y:60,w:256,h:24},
  {kind:'teacher',x:192,y:112,w:128,h:40},
  {kind:'desk',x:96,y:208,w:96,h:40}, {kind:'desk',x:352,y:208,w:80,h:40},
  {kind:'drafting',x:608,y:112,w:112,h:48},{kind:'drafting',x:832,y:112,w:112,h:48},
  {kind:'drafting',x:608,y:240,w:112,h:48},{kind:'shelf',x:864,y:240,w:80,h:32},
  {kind:'bench',x:192,y:592,w:128,h:32},
  {kind:'sofa',x:608,y:480,w:112,h:48},{kind:'sofa',x:832,y:480,w:112,h:48},
  {kind:'coffee',x:752,y:528,w:48,h:32},{kind:'counter',x:608,y:608,w:112,h:32},
  {kind:'plant',x:64,y:64,w:32,h:32},{kind:'plant',x:416,y:64,w:32,h:32},
  {kind:'plant',x:928,y:608,w:32,h:32},{kind:'plant',x:64,y:592,w:32,h:32}
];
class AtelierWorld {
  constructor(){this.width=1024;this.height=704;this.cell=32;this.radius=10;this.obstacles=[...ATELIER_WALLS,...ATELIER_FURNITURE.map(item=>[item.x,item.y,item.w,item.h])];}
  walkable(x,y){
    const r=this.radius;
    return Number.isFinite(x)&&Number.isFinite(y)&&x>=24&&y>=24&&x<=1000&&y<=680&&!this.obstacles.some(([a,b,w,h])=>x>a-r&&x<a+w+r&&y>b-r&&y<b+h+r);
  }
  clear(a,b){
    const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5);
    for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(!this.walkable(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t))return false;}return true;
  }
  cellAt(x,y){return {x:Math.floor(x/32)*32+16,y:Math.floor(y/32)*32+16};}
  nearest(x,y,from=null){
    let best=null,distance=Infinity;
    for(let row=1;row<21;row++)for(let col=1;col<31;col++){
      const point={x:col*32+16,y:row*32+16},d=Math.hypot(point.x-x,point.y-y);
      if(d<distance&&this.walkable(point.x,point.y)&&(!from||this.clear(from,point))){best=point;distance=d;}
    }return best;
  }
  path(from,to){
    const start=this.nearest(from.x,from.y,from),end=this.nearest(to.x,to.y);
    if(!start||!end)return [];
    const key=p=>p.x+','+p.y,queue=[start],previous=new Map([[key(start),null]]),points=new Map([[key(start),start]]);
    for(let index=0;index<queue.length;index++){
      const point=queue[index];if(key(point)===key(end))break;
      for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){
        const next={x:point.x+dx,y:point.y+dy},id=key(next);
        if(previous.has(id)||!this.walkable(next.x,next.y)||!this.clear(point,next))continue;
        previous.set(id,key(point));points.set(id,next);queue.push(next);
      }
    }
    if(!previous.has(key(end)))return [];
    const route=[];for(let id=key(end);id;id=previous.get(id))route.unshift(points.get(id));
    if(this.walkable(to.x,to.y)&&this.clear(end,to))route.push(to);
    return route;
  }
  move(position,dx,dy){
    let {x,y}=position;
    if(this.clear({x,y},{x:x+dx,y}))x+=dx;
    if(this.clear({x,y},{x,y:y+dy}))y+=dy;
    return {x,y};
  }
  room(position){return Object.keys(ATELIER_ROOMS).find(key=>{const b=ATELIER_ROOMS[key].bounds;return b&&position.x>=b[0]&&position.x<=b[0]+b[2]&&position.y>=b[1]&&position.y<=b[1]+b[3];})||'hall';}
}
