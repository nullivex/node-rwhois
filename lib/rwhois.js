'use strict';

//configgables
var _DEBUG = 255
var port = 4321

//require all modules
var net = require('net')

//debug stub
var DEBUG = function(level){return (_DEBUG > level)}

//setup server
var server = net.createServer(function(sock){
  console.log('Client connected from ' + sock.remoteAddress)
  //utility functions bound on a socket-by-socket basis so we can use (this)
  sock.sendBanner = function(){
    var version = '%rwhois V-1.5:003fff:00 spudz76.drunkensailor.org (node-rwhois v0.0.1)'
    DEBUG(0) && console.log('[O] ' + version)
    this.write(version + '\r\n')
    return true
  }
  sock.sendOK = function(){
    DEBUG(0) && console.log('[O] %ok')
    this.write('%ok\r\n')
    return true
  }
  sock.sendError = function(code,msg){
    var str = '%error ' + code + ' ' + msg
    DEBUG(0) && console.log('[O] ' + str)
    this.write(str + '\r\n')
    return true
  }

  sock.on('end',function(){console.log('Client disconnected')})
  sock.on('data',function(buff){
    var line = buff.toString().trim()
    DEBUG(1) &&  console.log('[I] ' + line)
    var m = []
    if(m = line.match(/^(([a-zA-Z]{1})|([a-zA-Z]{1}[a-zA-Z]{1})|([a-zA-Z]{1}[0-9]{1})|([0-9]{1}[a-zA-Z]{1})|([a-zA-Z0-9][a-zA-Z0-9-_]{1,61}[a-zA-Z0-9]))\.([a-zA-Z]{2,}|[a-zA-Z0-9-]{2,30}\.[a-zA-Z]{2,})$/)){
      line = 'domain ' + m.input
    }
    if(m = line.match(/^(\S+)\s+(.*)$/)){
      DEBUG(2) &&  console.log('[EMIT:'+ m[1] + '] args: ' + m[2])
      sock.emit(m[1],m[2])
    }
  })
  sock.on('-rwhois',function(){
    sock.sendBanner() && sock.sendOK()
  })
  sock.on('domain',function(d){
    DEBUG(1) && console.log('[LOOKUP:' + d + ']')
    sock.sendError(230,'No Objects Found')
  })
  sock.on('error',function(we,dont,care){we = dont = care})
  //all set up, send back the banner as our signal to continue
  sock.sendBanner()
})
//fire it up
server.listen(port,function(){
  console.log('server listening on port ' + port)
})
