// Generates Sterith Workout PWA icons as PNGs (no external deps).
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function hex(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
const NAVY = hex('#14203a');
const GOLD = hex('#e7c987');
const GOLDD = hex('#b8934a');
const CREAM = hex('#eceadf');

function makeIcon(size, maskable){
  const buf = Buffer.alloc(size*size*4);
  const cx = size/2, cy = size/2;
  const radius = maskable ? size : size*0.22; // maskable = full bleed square
  function set(x,y,rgb,a=255){
    if(x<0||y<0||x>=size||y>=size) return;
    const i=(y*size+x)*4; buf[i]=rgb[0]; buf[i+1]=rgb[1]; buf[i+2]=rgb[2]; buf[i+3]=a;
  }
  // rounded-rect background (navy)
  for(let y=0;y<size;y++){
    for(let x=0;x<size;x++){
      let inside=true;
      if(!maskable){
        const r=radius;
        const dx=Math.max(r-x, x-(size-1-r), 0);
        const dy=Math.max(r-y, y-(size-1-r), 0);
        if(dx*dx+dy*dy > r*r) inside=false;
      }
      if(inside) set(x,y,NAVY,255); else set(x,y,CREAM,0);
    }
  }
  // Sterith Health brand mark: four ascending gold bars, tallest tipped by an arrow.
  const s = size/512; // scale factor from a 512 design grid
  function rect(x0,y0,x1,y1,rgb){
    for(let y=Math.floor(y0);y<Math.ceil(y1);y++)
      for(let x=Math.floor(x0);x<Math.ceil(x1);x++) set(x,y,rgb);
  }
  function tri(cx,ty,halfW,by,rgb){ // upward triangle, apex at (cx,ty), base at by
    for(let y=Math.floor(ty);y<Math.ceil(by);y++){
      const t=(y-ty)/(by-ty); const hw=halfW*t;
      for(let x=Math.floor(cx-hw);x<Math.ceil(cx+hw);x++) set(x,y,rgb);
    }
  }
  const baseline = 372*s;
  const w = 52*s, gap = 20*s;
  const total = 4*w + 3*gap;
  const x0 = (size - total)/2;
  const heights = [116,168,224,286].map(h=>h*s);
  const cols = ['#b8934a','#c9a557','#d8b76b','#e7c987'].map(hex);
  for(let i=0;i<4;i++){
    const bx = x0 + i*(w+gap);
    rect(bx, baseline-heights[i], bx+w, baseline, cols[i]);
  }
  // arrow on the 4th (tallest) bar
  const bx4 = x0 + 3*(w+gap);
  const cx4 = bx4 + w/2;
  const top4 = baseline-heights[3];
  tri(cx4, top4-58*s, 46*s, top4+6*s, cols[3]);

  return encodePNG(size,size,buf);
}

function encodePNG(w,h,rgba){
  // build raw with filter byte 0 per row
  const raw = Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){
    raw[y*(w*4+1)] = 0;
    rgba.copy(raw, y*(w*4+1)+1, y*w*4, (y+1)*w*4);
  }
  const idat = zlib.deflateSync(raw, {level:9});
  function chunk(type,data){
    const len=Buffer.alloc(4); len.writeUInt32BE(data.length,0);
    const t=Buffer.from(type,'ascii');
    const crc=Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([t,data]))>>>0,0);
    return Buffer.concat([len,t,data,crc]);
  }
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))]);
}
let crcTable;
function crc32(buf){
  if(!crcTable){ crcTable=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xedb88320^(c>>>1):c>>>1; crcTable[n]=c; } }
  let crc=0xffffffff;
  for(let i=0;i<buf.length;i++) crc=crcTable[(crc^buf[i])&0xff]^(crc>>>8);
  return crc^0xffffffff;
}

const dir=__dirname;
fs.writeFileSync(path.join(dir,'icon-192.png'), makeIcon(192,false));
fs.writeFileSync(path.join(dir,'icon-512.png'), makeIcon(512,false));
fs.writeFileSync(path.join(dir,'icon-maskable.png'), makeIcon(512,true));
console.log('icons written');
