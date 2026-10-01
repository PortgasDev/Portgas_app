const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(__dirname+'/atelier-world.js','utf8')+'\nthis.world=new AtelierWorld();this.rooms=ATELIER_ROOMS;',context);
const {world,rooms}=context;
let routes=0;
for(const from of Object.values(rooms))for(const to of Object.values(rooms)){
  const path=world.path(from,to);assert(path.length,'Every room must be reachable');
  let previous=from;
  for(const point of path){assert(world.walkable(point.x,point.y));assert(world.clear(previous,point),'Route cannot cross a wall or furniture');previous=point;}
  assert.equal(world.room(path.at(-1)),world.room(to));routes++;
}
// Walking into a desk and an outer wall must stop outside their collision bounds.
let position={x:144,y:272};
for(let i=0;i<100;i++){position=world.move(position,0,-4);assert(world.walkable(position.x,position.y));}
assert(position.y>=258,'Desk blocks upward movement');
position={x:512,y:368};
for(let i=0;i<1000;i++){position=world.move(position,-5,0);assert(world.walkable(position.x,position.y));}
assert(position.x>=24,'World boundary blocks movement');
// Clicking furniture chooses a reachable nearby floor tile.
const blockedRoute=world.path(rooms.hall,{x:208,y:130});
assert(blockedRoute.length);assert(world.walkable(blockedRoute.at(-1).x,blockedRoute.at(-1).y));
assert(!world.walkable(NaN,0));assert(!world.walkable(4000,4000));
// Exercise routes from non-grid-aligned keyboard positions around each room.
for(const origin of Object.values(rooms))for(const [dx,dy] of [[4,7],[-7,4],[13,-5]]){
  const start=world.move(origin,dx,dy);
  for(const to of Object.values(rooms)){
    let current=start;const path=world.path(start,to);assert(path.length);
    for(const target of path){let limit=1000;while(Math.hypot(target.x-current.x,target.y-current.y)>2.8&&limit--){const d=Math.hypot(target.x-current.x,target.y-current.y);current=world.move(current,(target.x-current.x)/d*2.8,(target.y-current.y)/d*2.8);}assert(limit>0,'Animated route cannot get stuck');current=target;}routes++;
  }
}
console.log(`PASS: ${routes} inter-room routes, furniture collision, boundary collision, blocked destination, and continuous movement.`);
