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
    DEBUG(0) && console.log('[O] %rwhois V-1.5:00ffff:00 spudz76.drunkensailor.org (node-rwhois v0.0.1)')
    this.write('%rwhois V-1.5:003fff:00 spudz76.drunkensailor.org (node-rwhois v0.0.1)\r\n')
  }
  sock.sendOK = function(){
    DEBUG(0) && console.log('[O] %ok')
    this.write('%ok\r\n\r\n')
  }

  sock.on('end',function(){console.log('Client disconnected')})
  sock.on('data',function(buff){
    var line = buff.toString()
    DEBUG(1) &&  console.log('[I] ' + line)
    var m = []
    if(m = line.match(/^(\S+)\s+(.*)$/)){
      DEBUG(2) &&  console.log('[EMIT:'+ m[1] + '] args: ' + m[2])
      sock.emit(m[1],m[2])
    }
  })
  sock.on('-rwhois',function(){
    sock.sendBanner()
    DEBUG(0) && console.log('[O] %ok')
    sock.write('%ok\r\n\r\n')
  })
  //all set up, send back the banner as our signal to continue
  sock.sendBanner()
})
//fire it up
server.listen(port,function(){
  console.log('server listening on port ' + port)
})
