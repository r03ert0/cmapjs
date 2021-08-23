/* eslint-disable no-sync */
'use strict';

/*
-----------------------
      cmap.js
-----------------------
*/

const fs = require('fs');
// const jpeg = require('jpeg-js'); // jpeg-js library: https://github.com/eugeneware/jpeg-js
const StreamZip = require('node-stream-zip');

let data; // where the cmap data is extracted to
let jpg; // jpg made out of the cmap data
let txt; // where the top100 data is extracted to
let info; // info on number of experiments
var dim=[45, 54, 45]; // dimension of the cmap
let view = 'sag';
let seed=[22, 27, 22];
let target=[22, 27, 22];
let prevSeed = [22, 27, 22];
let prevTarget = [22, 27, 22];

var coincidencesZip;
//const cpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/coincidences.zip"
const cpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2017/coincidences.zip";

let top100Zip;
// var tpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/top100.zip"
const tpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/top100.zip";

// load sum
//var spath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/sum.img";
const spath="/Users/roberto/Documents/2010_10Coactivations/coincidences2017/sum.img";

const castInt16Array = (buff) => {
  const arr = new Int16Array(buff.length/2);
  for(let i=0; i<arr.length; i++) { arr[i]=buff.readInt16LE(i*2); }

  return arr;
};

const sum = castInt16Array(fs.readFileSync(spath));

// Web socket
const http = require('http');
const server = http.createServer();
const WebSocketServer = require('ws').Server;
const port = 8084;
const websocket = new WebSocketServer({server: server});
server.listen(port, function() {
  console.log('Listening on '+server.address().port, server.address());
});

const loadCMap = (filePath) => new Promise((resolve, reject) => {
  coincidencesZip = new StreamZip({
    file: filePath,
    storeEntries: true
  });
  coincidencesZip.on('error', function(err) {
    reject(err);
  });
  coincidencesZip.on('ready', function() {
    resolve();
  });
});

const loadTop100 = (filePath) => new Promise((resolve, reject) => {
  top100Zip = new StreamZip({
    file: filePath,
    storeEntries: true
  });
  top100Zip.on('error', function(err) {
    reject(err);
  });
  top100Zip.on('ready', function() {
    resolve();
  });
});

const getViewDimensions = () => {
  let w;
  let h;

  switch(view) {
  case 'sag': [, w, h] = dim; break;
  case 'cor': [w, , h] = dim; break;
  case 'axi': [w, h] = dim; break;
  }

  return {w, h};
};

// const phiCorrelation = (a, b, k, N) => {
//   var den, num, r;
//   if(a === 0 || b === 0) { return 0; }
//   num=((N*k)/(a*b)-1)**2;
//   den=((N-a)*(N-b))/(a*b);
//   r=Math.sqrt(num/den)*Math.sign(N*k-a*b);

//   return r;
// };

const likelihoodRatio = (a, b, k, N) => {
  // H1 = p(b|a)=p(b|-a)=p
  // H2 = p(b|a)=p1 ≠ p2=p(b|-a)
  // lr=-2log(L(H1)/L(H2)), where L(H) is the likelihood of H

  if(a === 0 || b === 0) { return 0; }

  const p=b/N;
  const p1=k/a;
  const p2=(b-k)/(N-a);
  const e=0.0001;
  const lr = (-k*Math.log(e+p ) - (a-k)*Math.log(e+1-p ) - (b-k)*Math.log(e+p ) - (N-a-b+k)*Math.log(e+1-p )
    +k*Math.log(e+p1) + (a-k)*Math.log(e+1-p1) + (b-k)*Math.log(e+p2) + (N-a-b+k)*Math.log(e+1-p2))*2;

  return lr;
};

const voxelIndex = (x, y) => {
  let i;
  switch(view) {
  case 'sag': i = target[0] + x*dim[0] + y*dim[0]*dim[1]; break;
  case 'cor': i = x + target[1]*dim[0] + y*dim[0]*dim[1]; break;
  case 'axi': i = x + y*dim[0] + target[2]*dim[0]*dim[1]; break;
  }

  return i;
};

const clamp = (val, min, max) => {
  if(val>max) { val=max; }
  if(val<min) { val=min; }

  return val;
};

const colormap = (val) => [
  (val>=0)?(255*val):0,
  (val<0)?(-255*val):0,
  0, 0xff
];

const drawSlice = () => {
  const {w, h} = getViewDimensions(view);
  const frameData = Buffer.alloc(w * h * 4);
  const i1=seed[0] + seed[1]*dim[0] + seed[2]*dim[0]*dim[1];
  let j, val;

  j=0;
  for(let y=0; y<h; y++) {
    for(let x=0; x<w; x++) {
      const i = voxelIndex(x, y);
      val = likelihoodRatio(sum[i1], sum[i], data[i], 21602);
      val = clamp(Math.log(Math.abs(val)+1)/8, -1, 1);
      [
        frameData[4*j+0], // red
        frameData[4*j+1], // green
        frameData[4*j+2], // blue
        frameData[4*j+3] // alpha (ignored in JPEGs)
      ] = colormap(val);
      j++;
    }
  }

  var rawImageData = {
    data: frameData,
    width: w,
    height: h
  };

  //jpg = jpeg.encode(rawImageData,99);
  jpg = rawImageData;
};

const getInfo = () => {
  var i1=seed[0] + seed[1]*dim[0] + seed[2]*dim[0]*dim[1];
  var i2=target[0] + target[1]*dim[0] + target[2]*dim[0]*dim[1];
  var val;
  var arr;

  // use likelihood ratio
  val = likelihoodRatio(sum[i1], sum[i2], data[i2], 21602);

  arr = [sum[i1], sum[i2], data[i2], val];

  info = arr;
};

// const saveSlice = (jpg) => {
//   fs.writeFileSync('slice.jpg', jpg.data);
// };

const sendSlice = (s) => {
  try {
    s.send(jpg.data, {binary: true, mask:false});
    s.send(JSON.stringify({top:txt}));
    s.send(JSON.stringify({info:info}));
  } catch(e) {
    console.log("ERROR: Cannot send slice to user", e);
  }
};

const socketMessage = (msg, socket) => {
  ({seed, target, view} = JSON.parse(msg));

  // seed change
  if(!seed.every((v, i) => v === prevSeed[i])) {
    // different seed
    const name = ("000"+seed[0]).slice(-3)
                  + ("000"+seed[1]).slice(-3)
                  + ("000"+seed[2]).slice(-3);
    try {
      data = castInt16Array(coincidencesZip.entryDataSync(name+".img"));
      txt = top100Zip.entryDataSync(name + ".top100.0.txt").toString()
        .split('\n')
        .splice(1, 21)
        .join('\n');
    } catch(e) {
      // continue regardless of error
    }
    prevSeed = [...seed];
  }

  // target change
  if(!target.every((v, i) => v === prevTarget[i])) {
    // different target
    prevTarget = [...target];
  }
  // console.time('draw');
  drawSlice(data);
  getInfo();
  sendSlice(socket);
  // console.timeEnd('draw');
  // console.log("mem:", process.memoryUsage().heapUsed);
};

loadCMap(cpath)
  .then(function () { return loadTop100(tpath); })
  .then(function () {
    console.log("ready to rock");
    var name = ("000"+seed[0]).slice(-3)
               + ("000"+seed[1]).slice(-3)
               + ("000"+seed[2]).slice(-3);
    try {
      data = castInt16Array(coincidencesZip.entryDataSync(name+".img"));
      txt = top100Zip.entryDataSync(name+".top100.0.txt").toString()
        .split('\n')
        .splice(1, 11)
        .join('\n');
    } catch(e) {
      // continue regardless of error
    }
  });

websocket.on("connection", (socket) => {
  socket.on('message', (msg) => { socketMessage(msg, socket); });
});
