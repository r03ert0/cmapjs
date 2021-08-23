/* eslint-disable max-lines */

'use strict';

let brain; // template 3D data
const dim = [180, 216, 180]; // template dimensions, 1mm3
const M = Math.max(...dim); // maximum dimension
let loading = false;
let isMouseDown = false;
let lastReq, pendingReq;
let ws;
let myData; // cmap slice img data
const state = {
  seed:[22, 27, 22],
  target:[22, 27, 22],
  view:'sag'
};
let H, S, W; // cmap width and height
const negpos=[
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.0053, 0.0105, 0.0158, 0.0211, 0.0263, 0.0316, 0.0368, 0.0421, 0.0474, 0.0526, 0.0579, 0.0632, 0.0684, 0.0737, 0.0789, 0.0842, 0.0895, 0.0947, 0.1000, 0.1053, 0.1105, 0.1158, 0.1211, 0.1263, 0.1316, 0.1368, 0.1421, 0.1474, 0.1526, 0.1579, 0.1632, 0.3368, 0.3474, 0.3579, 0.3684, 0.3789, 0.3895, 0.4000, 0.4105, 0.4211, 0.4316, 0.4421, 0.4526, 0.4632, 0.4737, 0.4842, 0.4947, 0.5053, 0.5158, 0.5263, 0.5368, 0.5474, 0.5579, 0.5684, 0.5789, 0.5895, 0.6000, 0.6105, 0.6211, 0.6316, 0.6421, 0.6526, 0.6632, 0.6737, 0.6842, 0.6947, 0.7053, 0.7158, 0.7263, 0.7368, 0.7474, 0.7579, 0.7684, 0.7789, 0.7895, 0.8000, 0.8105, 0.8211, 0.8316, 0.8421, 0.8526, 0.8632, 0.8737, 0.8842, 0.8947, 0.9053, 0.9158, 0.9263, 0.9368, 0.9474, 0.9579, 0.9684, 0.9789, 0.9895, 1.0000,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3316, 0.3263, 0.3211, 0.3158, 0.3105, 0.3053, 0.3000, 0.2947, 0.2895, 0.2842, 0.2789, 0.2737, 0.2684, 0.2632, 0.2579, 0.2526, 0.2474, 0.2421, 0.2368, 0.2316, 0.2263, 0.2211, 0.2158, 0.2105, 0.2053, 0.2000, 0.1947, 0.1895, 0.1842, 0.1789, 0.1737, 0.1684, 0.3263, 0.3158, 0.3053, 0.2947, 0.2842, 0.2737, 0.2632, 0.2526, 0.2421, 0.2316, 0.2211, 0.2105, 0.2000, 0.1895, 0.1789, 0.1684, 0.1579, 0.1474, 0.1368, 0.1263, 0.1158, 0.1053, 0.0947, 0.0842, 0.0737, 0.0632, 0.0526, 0.0421, 0.0316, 0.0211, 0.0105, 0, 0, 0.0105, 0.0211, 0.0316, 0.0421, 0.0526, 0.0632, 0.0737, 0.0842, 0.0947, 0.1053, 0.1158, 0.1263, 0.1368, 0.1474, 0.1579, 0.1684, 0.1789, 0.1895, 0.2000, 0.2105, 0.2211, 0.2316, 0.2421, 0.2526, 0.2632, 0.2737, 0.2842, 0.2947, 0.3053, 0.3158, 0.3263, 0.1684, 0.1737, 0.1789, 0.1842, 0.1895, 0.1947, 0.2000, 0.2053, 0.2105, 0.2158, 0.2211, 0.2263, 0.2316, 0.2368, 0.2421, 0.2474, 0.2526, 0.2579, 0.2632, 0.2684, 0.2737, 0.2789, 0.2842, 0.2895, 0.2947, 0.3000, 0.3053, 0.3105, 0.3158, 0.3211, 0.3263, 0.3316, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  1.0000, 0.9895, 0.9789, 0.9684, 0.9579, 0.9474, 0.9368, 0.9263, 0.9158, 0.9053, 0.8947, 0.8842, 0.8737, 0.8632, 0.8526, 0.8421, 0.8316, 0.8211, 0.8105, 0.8000, 0.7895, 0.7789, 0.7684, 0.7579, 0.7474, 0.7368, 0.7263, 0.7158, 0.7053, 0.6947, 0.6842, 0.6737, 0.6632, 0.6526, 0.6421, 0.6316, 0.6211, 0.6105, 0.6000, 0.5895, 0.5789, 0.5684, 0.5579, 0.5474, 0.5368, 0.5263, 0.5158, 0.5053, 0.4947, 0.4842, 0.4737, 0.4632, 0.4526, 0.4421, 0.4316, 0.4211, 0.4105, 0.4000, 0.3895, 0.3789, 0.3684, 0.3579, 0.3474, 0.3368, 0.1632, 0.1579, 0.1526, 0.1474, 0.1421, 0.1368, 0.1316, 0.1263, 0.1211, 0.1158, 0.1105, 0.1053, 0.1000, 0.0947, 0.0895, 0.0842, 0.0789, 0.0737, 0.0684, 0.0632, 0.0579, 0.0526, 0.0474, 0.0421, 0.0368, 0.0316, 0.0263, 0.0211, 0.0158, 0.0105, 0.0053, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];

// Stereotaxic viewer canvas
const cn=document.getElementById('viewer'); // viewer canvas
const cx=cn.getContext('2d'); // viewer canvas's context
const mimg=cx.createImageData(M, M);
const data2=mimg.data;

// send requestData message
const requestData = (req) => {
  let str;

  if(req) {
    str = req;
  } else {
    str = JSON.stringify(state);
  }

  // send a request only if the previous one returned
  if(loading === false) {
    // send a request only if it's different from the previous one
    if(str !== lastReq) {
      ws.send(str);
      lastReq = str;
      pendingReq = null;
      loading = true;
    }
  } else {
    // otherwise, keep it
    pendingReq = str;
  }
};

const imgOnLoad = (spriteImg, scn, scx, img, ncol) => {
  scn.width=img.width;
  scn.height=img.height;
  scx.drawImage(img, 0, 0);
  spriteImg = scx.getImageData(0, 0, img.width, img.height);
  ncol = ~~spriteImg.width/dim[1];
  brain = new Uint8Array(dim[0]*dim[1]*dim[2]);
  // convert sprite image to volume
  for(let i=0; i<img.width; i++) {
    for(let j=0; j<img.height; j++) {
      const x = Math.floor(i/dim[1]) + Math.floor(j/dim[2])*ncol;
      const y = i%dim[1];
      const z = j%dim[2];
      const val = spriteImg.data[4*(i+j*img.width)];

      brain[x+y*dim[0]+z*dim[0]*dim[1]] = val; //val===255?0:val;
    }
  }
};

/**
 * Load sprite image for template, convert it to volume, store in `brain`
 * @returns {void}
 */
const loadTemplate = () => {
  let spriteImg;
  let ncol;
  const scn=document.createElement('canvas'); // sprite offscreen canvas
  const scx=scn.getContext('2d'); // sprite offscreen canvas's context
  const img=new Image(); // img containing the template sprite

  return new Promise((resolve) => {
    img.onload = () => {
      imgOnLoad(spriteImg, scn, scx, img, ncol);
      resolve();
    };
    img.src = 'img/sprite.jpg';
  });
};

const colormap = (val) => {
  const n = 192;
  const i = Math.floor(val*(n-1));
  const c=[];
  const cm = negpos;

  c[0]=255 * (cm[i]+(val-i/(n-1)) * (cm[i+1]-cm[i]));
  c[1]=255 * (cm[n+i]+(val-i/(n-1)) * (cm[n+i+1]-cm[n+i]));
  c[2]=255 * (cm[2*n+i]+(val-i/(n-1)) * (cm[2*n+i+1]-cm[2*n+i]));
  c[3]=255;

  return c;
};

const updateCursor = (el, pos) => {
  let x, y;
  switch(state.view) {
  case 'sag': ([x, y] = [pos[1], pos[2]]); break;
  case 'cor': ([x, y] = [pos[0], pos[2]]); break;
  case 'axi': ([x, y] = [pos[0], pos[1]]); break;
  }
  const width = document.querySelector("#viewer").clientWidth;
  const height = document.querySelector("#viewer").clientHeight;
  x = Math.floor(x/W*width);
  y = height - Math.floor((y+1)/H*height);
  el.style.top = `${y}px`;
  el.style.left = `${x}px`;
};

const brainVoxel = (view, x, y) => {
  let i;
  switch(view) {
  case 'sag': i = 4*state.target[0] + x*dim[0] + y*dim[0]*dim[1]; break;
  case 'cor': i = x + 4*state.target[1]*dim[0] + y*dim[0]*dim[1]; break;
  case 'axi': i = x + y*dim[0] + 4*state.target[2]*dim[0]*dim[1]; break;
  }

  return brain[i];
};

// draw brain template image
const drawTemplate = () => {
  let alpha, px;

  // draw cmap over template
  for(let x=0; x<cn.width; x++) {
    for(let y=0; y<cn.height; y++) {
      const svox = brainVoxel(state.view, x, y);

      // transform coordinates from 1mm^2 template to 4mm^3 cmap
      const i=Math.floor(x/4)+W*Math.floor(y/4);

      // get value from cmap
      const val=myData ? (myData[4*i+0]+myData[4*i+1])/255 : 0;

      // reinforce small values
      // val = Math.pow(val,1/4);

      // use value as opacity index
      alpha=val;

      // convert value to color
      px = colormap(val);

      data2[4*(x+(cn.height-1-y)*M)+0]=alpha*px[0] + svox*(1-alpha);
      data2[4*(x+(cn.height-1-y)*M)+1]=alpha*px[1] + svox*(1-alpha);
      data2[4*(x+(cn.height-1-y)*M)+2]=alpha*px[2] + svox*(1-alpha);
      data2[4*(x+(cn.height-1-y)*M)+3]=255;
    }
  }

  cx.putImageData(mimg, 0, 0, 0, 0, cn.width, cn.height);

  // update seed and target cursors
  updateCursor(document.querySelector("#seed"), state.seed);
  updateCursor(document.querySelector("#target"), state.target);
};

const receiveBinaryData = (data) => {
  const fileReader = new FileReader();
  fileReader.onload = function () {
    // console.timeEnd('draw A');
    myData = new Uint8Array(this.result);
    loading = false;
    if(pendingReq && pendingReq !== lastReq ) {
      requestData(pendingReq);
    }
    drawTemplate();
  };
  // console.time('draw A');
  fileReader.readAsArrayBuffer(data);
};

const receiveTextData = (data) => {
  const o = JSON.parse(data);

  if(o.top) {
    const arr = o.top.split("\n").map((oo) => {
      const r=oo.split("\t");

      return [parseFloat(r[0]), r[1]];
    });

    document.querySelector("#top100").innerHTML = arr.map(
      (row) => {
        const corr = `${row[0]}      `.slice(0, 6);
        const [, text] = row;

        return `<pre class="corr">${corr}  </pre>${text}`;
      }
    ).join("<br />");
  }

  if(o.info) {
    document.querySelector("#info").innerText = `a:${o.info[0]} b:${o.info[1]} k:${o.info[2]} lr:${o.info[3].toFixed(4)}`;
  }
};

const receive = (msg) => {
  if(msg.data instanceof Blob) {
    // data is binary (cmap)
    receiveBinaryData(msg.data);
  } else {
    // data is text (top100 or info)
    receiveTextData(msg.data);
  }
};

// change seed or target position
const changeSeed = (x, param, updateSliders, doNotRequestData) => {
  const sync = document.querySelector("#sync").checked;

  // update seed value
  switch(param) {
  case 'sx': state.seed[0] = parseInt(x, 10); break;
  case 'sy': state.seed[1] = parseInt(x, 10); break;
  case 'sz': state.seed[2] = parseInt(x, 10); break;
  case 'xyz': state.seed = [x[0], x[1], x[2]]; break;
  }

  // if sync is checked, update the target too
  if(sync && !doNotRequestData) {
    changeTarget(state.seed, "xyz", true, true);
  }

  // update the sliders
  if(updateSliders) {
    [
      document.querySelector("#sx").value,
      document.querySelector("#sy").value,
      document.querySelector("#sz").value
    ] = state.seed;
  }

  // update the seed cursor
  updateCursor(document.querySelector("#seed"), state.seed);

  // request data
  if(typeof doNotRequestData === "undefined") { requestData(); }
};

const changeTarget = (x, param, updateSliders, doNotRequestData) => {
  const sync = document.querySelector("#sync").checked;

  // update target value
  switch(param) {
  case 'tx': state.target[0] = parseInt(x, 10); break;
  case 'ty': state.target[1] = parseInt(x, 10); break;
  case 'tz': state.target[2] = parseInt(x, 10); break;
  case 'xyz': state.target = [x[0], x[1], x[2]]; break;
  }

  // if sync, update the seed too
  if(sync && !doNotRequestData) {
    changeSeed(state.target, "xyz", true, true);
  }

  // update the sliders
  if(updateSliders) {
    [
      document.querySelector("#tx").value,
      document.querySelector("#ty").value,
      document.querySelector("#tz").value
    ] = state.target;
  }

  // update the target cursor
  updateCursor(document.querySelector("#target"), state.target);

  // request data
  if(typeof doNotRequestData === "undefined") { requestData(); }
};

// change view plane
const changeView = (param) => {
  state.view=param;
  switch(state.view) {
  case 'sag': ([W, H, S] = [dim[1], dim[2], state.target[0]]); break;
  case 'cor': ([W, H, S] = [dim[0], dim[2], state.target[1]]); break;
  case 'axi': ([W, H, S] = [dim[0], dim[1], state.target[2]]); break;
  }
  cn.width=W;
  cn.height=H;
  W/=4; console.log(dim, W);
  H/=4; console.log(dim, H);
  requestData();

  // update button selection
  document.querySelectorAll(".plane").forEach((el) => el.classList.remove("selected"));
  document.querySelector(`#${state.view}`).classList.add("selected");
};

// mouse/touch events
const mousedown = (e) => {
  const rect = document.querySelector("#viewer").getBoundingClientRect();
  const left = rect.x;
  const top = rect.y;
  const width = document.querySelector("#viewer").clientWidth;
  const height = document.querySelector("#viewer").clientHeight;
  const x = e.clientX - left;
  const y = e.clientY - top;

  const i = Math.floor(W*(x/width));
  const j = H-1-Math.floor(H*(y/height));

  switch(state.view) {
  case 'sag': changeTarget([state.target[0], i, j], 'xyz', true); break;
  case 'cor': changeTarget([i, state.target[1], j], 'xyz', true); break;
  case 'axi': changeTarget([i, j, state.target[2]], 'xyz', true); break;
  }

  isMouseDown = true;
};

const mousemove = (e) => {
  if(isMouseDown === false) { return; }

  const rect = document.querySelector("#viewer").getBoundingClientRect();
  const left = rect.x;
  const top = rect.y;
  const width = document.querySelector("#viewer").clientWidth;
  const height = document.querySelector("#viewer").clientHeight;
  const x = e.clientX - left;
  const y = e.clientY - top;

  const i = Math.floor(W*(x/width));
  const j = H-1-Math.floor(H*(y/height));

  switch(state.view) {
  case 'sag': changeTarget([state.target[0], i, j], 'xyz', true); break;
  case 'cor': changeTarget([i, state.target[1], j], 'xyz', true); break;
  case 'axi': changeTarget([i, j, state.target[2]], 'xyz', true); break;
  }
};

const mouseup = () => {
  isMouseDown = false;
};

const init = async () => {
  await loadTemplate();

  // add mouse/touch listeners to 'viewer' canvas
  document.querySelector('#viewer').addEventListener('mousedown', mousedown);
  document.querySelector('#viewer').addEventListener('mousemove', mousemove);
  document.querySelector('#viewer').addEventListener('mouseup', mouseup);
  document.querySelector("body").addEventListener('mouseleave', (e) => {
    const clickedElement = e.target;
    const matchingChild = clickedElement.closest("#viewer");
    if (matchingChild) {
      mouseup(e);
    }
  });

  // open websocket
  // const host = "ws://" + window.location.hostname + ":8084/";
  // const host = "wss://brainspell.org/cmapjs";
  const res = await fetch("./cfg.json");
  const {host, clientPort: port} = await res.json();
  console.log({host, port});

  if (port) {
    ws = new WebSocket(`${host}:${port}`);
  } else {
    ws = new WebSocket(`${host}`);
  }

  ws.onopen = () => {
    drawTemplate();
    changeView('sag');
    document.querySelector("#seed").style.display = "block";
    document.querySelector("#target").style.display = "block";
  };
  ws.onmessage = receive;
};

init();
