'use strict';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mustacheExpress = require('mustache-express');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.engine('mustache', mustacheExpress());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

/*
-----------------------
      cmap.js
-----------------------
*/

var fs = require('fs');
var jpeg=require('jpeg-js'); // jpeg-js library: https://github.com/eugeneware/jpeg-js
var StreamZip = require('node-stream-zip');

var data;           // where the cmap data is extracted to
var jpg;            // jpg made out of the cmap data
var txt;            // where the top100 data is extracted to
var info;           // info on number of experiments
var dim=[45,54,45]; // dimension of the cmap
var state;          // state
var seed=[22,27,22];
var target=[22,27,22];

var coincidences_zip;
//var cpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/coincidences.zip"
var cpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2017/coincidences.zip"

var top100_zip;
var tpath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/top100.zip"

// load sum
//var spath="/Users/roberto/Documents/2010_10Coactivations/coincidences2013/sum.img";
var spath="/Users/roberto/Documents/2010_10Coactivations/coincidences2017/sum.img";
var sum=castInt16Array(fs.readFileSync(spath));

// Web socket
var http = require('http');
var server =  http.createServer();
var server = http.createServer();
var WebSocketServer = require('ws').Server;
var websocket;
var port = 8080;
websocket = new WebSocketServer({server:server});
server.listen(port,function(){
    console.log('Listening on '+server.address().port,server.address())
});
websocket.on("connection",function connection_fromInitSocketConnection(s) {
    s.on('message',function(msg) {
        process.stdout.write([".","+","-",","][Math.floor(Math.random()*4)]);
        msg=JSON.parse(msg);
        
        state = msg;
        
        // seed change
        if(!state.seed.every(function(v,i){return v==seed[i]})) {
            // different seed
            seed=state.seed;
            var name = ("000"+seed[0]).slice(-3)
                       + ("000"+seed[1]).slice(-3)
                       + ("000"+seed[2]).slice(-3);
            try {
                data = castInt16Array(coincidences_zip.entryDataSync(name+".img"));
                txt = top100_zip.entryDataSync(name+".top100.0.txt").toString().split('\n').splice(1,11).join('\n');
            } catch(e) {
            }
        }

        // target change
        if(!state.target.every(function(v,i){return v==target[i]})) {
            // different target
            target=state.target;
        }
        console.time('draw');
        drawSlice(data);
        getInfo();
        sendSlice(s);
        console.timeEnd('draw');
        
        console.log("mem:",process.memoryUsage().heapUsed);
    });
});

// Unzip
function castInt16Array(buff) {
    var i,arr=new Int16Array(buff.length/2);
    for(i=0;i<arr.length;i++)
        arr[i]=buff.readInt16LE(i*2);
    return arr;
}
function loadCMap(path) {
	return new Promise(function(resolve, reject) {
        coincidences_zip = new StreamZip({  
            file: path,  
            storeEntries: true    
        });
        coincidences_zip.on('error', function(err) {
            console.log("ERROR:",err);
            reject();
        });
        coincidences_zip.on('ready', function() {
            resolve();
        });
    })
}
function loadTop100(path) {
	return new Promise(function(resolve, reject) {
        top100_zip = new StreamZip({  
            file: path,  
            storeEntries: true    
        });
        top100_zip.on('error', function(err) {
            console.log("ERROR:",err);
            reject();
        });
        top100_zip.on('ready', function() {
            resolve();
        });
    })
}
function drawSlice() {
	var frameData;
	var i,j,x,y,z,w,h,val,pixel;
	
	switch(state.view) {
	    case 'sag': w=dim[1]; h=dim[2]; break;
	    case 'cor': w=dim[0]; h=dim[2]; break;
	    case 'axi': w=dim[0]; h=dim[1]; break;
	}
	
	var i1=state.seed[0] + state.seed[1]*dim[0] + state.seed[2]*dim[0]*dim[1];

	frameData = new Buffer(w * h * 4);
	j=0;
	for(y=0;y<h;y++)
	for(x=0;x<w;x++) {
	    switch(state.view) {
	        case 'sag': i=state.target[0] + x*dim[0] + y*dim[0]*dim[1]; break;
	        case 'cor': i=x + state.target[1]*dim[0] + y*dim[0]*dim[1]; break;
	        case 'axi': i=x + y*dim[0] + state.target[2]*dim[0]*dim[1]; break;
	    }
		
		// phi correlation with old cmap
		//val=phi_correlation(sum[i1],sum[i],data[i],16395);
		
		// phi correlation with new cmap
		//val=phi_correlation(sum[i1],sum[i],data[i],21602);
		
		// likelihood ratio with new cmap
		val=likelihood_ratio(sum[i1],sum[i],data[i],21602);
        //val/=400; // clamp
        val = Math.log(Math.abs(val)+1)/8;
        if(val>1)	val=1;
        if(val<-1)	val=-1;

		// change transfer function to reinforce small values
		//val=Math.sign(val)*Math.pow(Math.abs(val),1/3);
		
		pixel=[
		    (val>=0)?(255*val):0,
		    (val<0)?(-255*val):0,
    		0 // 255*(Math.abs(255*val)-Math.floor(Math.abs(255*val))) // less significant part
    	];
		frameData[4*j+0] = pixel[0]; // red
		frameData[4*j+1] = pixel[1]; // green
		frameData[4*j+2] = pixel[2]; // blue
		frameData[4*j+3] = 0xFF;     // alpha - ignored in JPEGs
		j++;
	}
	
	var rawImageData = {
	  data: frameData,
	  width: w,
	  height: h
	};
    
	//jpg = jpeg.encode(rawImageData,99);
	jpg=rawImageData;
}
function getInfo() {
	var i1=state.seed[0] + state.seed[1]*dim[0] + state.seed[2]*dim[0]*dim[1];
	var i2=state.target[0] + state.target[1]*dim[0] + state.target[2]*dim[0]*dim[1];
	var val;
	var arr;

	// use phi-correlation
	//val = phi_correlation(sum[i1],sum[i2],data[i2],21602);
	
	// use likelihood ratio
	val = likelihood_ratio(sum[i1],sum[i2],data[i2],21602);

	arr = [sum[i1],sum[i2],data[i2],val];

	info = arr;
}
function colormap(val) {
    var pixel;
    val=Math.sign(val)*Math.pow(Math.abs(val),1/3);
    if(val>0)
        pixel=[255*val,0,255*(1-val),255*val];
    else
        pixel=[0,-255*val,255*(1+val),-255*val];
    return pixel;
}
function saveSlice(jpg) {
    fs.writeFileSync('slice.jpg',jpg.data);
}
function sendSlice(s) {
	try {
		s.send(jpg.data, {binary: true,mask:false});
		s.send(JSON.stringify({top:txt}));
		s.send(JSON.stringify({info:info}));
	} catch(e) {
		console.log("ERROR: Cannot send slice to user",e);
	}
}
function phi_correlation(a, b, k, N) {
	var num,den,r;
	if(a==0 || b==0)
		return 0;
	num=Math.pow((N*k)/(a*b)-1,2);
	den=((N-a)*(N-b))/(a*b);
	r=Math.sqrt(num/den)*Math.sign(N*k-a*b);
	return r;
}
function likelihood_ratio(a, b, k, N) {
	// H1 = p(b|a)=p(b|-a)=p
	// H2 = p(b|a)=p1 ≠ p2=p(b|-a)
	// lr=-2log(L(H1)/L(H2)), where L(H) is the likelihood of H
	
	if(a==0 || b==0)
		return 0;

	var	p=b/N;
	var	p1=k/a;
	var	p2=(b-k)/(N-a);
	var	lr,e=0.0001;

	lr=(-k*Math.log(e+p ) - (a-k)*Math.log(e+1-p ) - (b-k)*Math.log(e+p ) - (N-a-b+k)*Math.log(e+1-p )
		+k*Math.log(e+p1) + (a-k)*Math.log(e+1-p1) + (b-k)*Math.log(e+p2) + (N-a-b+k)*Math.log(e+1-p2))*2;
	return lr;
}


loadCMap(cpath)
.then(function () {return loadTop100(tpath)})
.then(function () {
    console.log("ready to rock");
    var name = ("000"+seed[0]).slice(-3)
               + ("000"+seed[1]).slice(-3)
               + ("000"+seed[2]).slice(-3);
    try {
        data = castInt16Array(coincidences_zip.entryDataSync(name+".img"));
        txt = top100_zip.entryDataSync(name+".top100.0.txt").toString().split('\n').splice(1,11).join('\n');
    } catch(e) {
    };
});

module.exports = app;
