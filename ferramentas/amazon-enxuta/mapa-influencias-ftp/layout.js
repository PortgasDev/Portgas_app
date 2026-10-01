// Each group fills a rectangle; explicit coordinates preserve reading order.
function mosaicLayout(count) {
  const result=[]; let row=1, group=0;
  while(count>0){
    const size=Math.min(4,count);
    const shapes=size===4 ? (group%2===0
      ? [[1,0,6,3],[7,0,6,2],[7,2,3,1],[10,2,3,1]]
      : [[1,0,4,3],[5,0,4,2],[9,0,4,2],[5,2,8,1]])
      : size===3 ? [[1,0,6,3],[7,0,6,2],[7,2,6,1]]
      : size===2 ? [[1,0,7,3],[8,0,5,3]] : [[1,0,12,2]];
    for(const [column,offset,width,height] of shapes)result.push({column,row:row+offset,width,height});
    row+=size===1?2:3;count-=size;group++;
  }
  return result;
}
function packLayout(items) {
  const defaults=mosaicLayout(items.length);
  if(items.every(item=>!item.size))return defaults;
  const occupied=new Set();
  return items.map((item,index)=>{
    const width=Math.max(3,Math.min(12,Math.round(item.size?.width||defaults[index].width)));
    const height=Math.max(1,Math.min(5,Math.round(item.size?.height||defaults[index].height)));
    for(let row=1;;row++)for(let column=1;column<=13-width;column++){
      let fits=true;
      for(let y=row;y<row+height&&fits;y++)for(let x=column;x<column+width;x++)if(occupied.has(`${x},${y}`)){fits=false;break;}
      if(!fits)continue;
      for(let y=row;y<row+height;y++)for(let x=column;x<column+width;x++)occupied.add(`${x},${y}`);
      return {column,row,width,height};
    }
  });
}
if(typeof module!=='undefined')module.exports={mosaicLayout,packLayout};
