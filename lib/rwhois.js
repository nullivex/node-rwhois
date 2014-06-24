'use strict';
var ObjectManage = require('object-manage')
var net = require('net')
var util = require('util')



/**
 * Construct RWhois server
 * @param {object} options
 * @constructor
 */
var RWhois = function(options){
  //setup options
  this.options = new ObjectManage()
  this.options.load({
    author: 'ESITED LLC',
    version: '0.1.0',
    debug: false,
    protocol: '1.5',
    capabilities: '003fff:00',
    port: 4321,
    hostname: 'localhost'
  })
  this.options.load(options)
  //freshen local properties
  this.limit = null
  this.handlers = {
    query: {
      ipv4: null
    }
  }
}


/**
* Debug messaging
* @param {*} msg
*/
RWhois.prototype.debug = function(msg){
  if('string' !== typeof msg) msg = util.inspect(msg)
  //strip line endings
  msg = msg.replace(/\r\n$/,'')
  if(this.options.get('debug')) console.log(msg)
}


/**
 * Send message back to the client
 * @param {object} socket
 * @param {string} msg
 * @param {boolean} command Specific whether or not the msg is a command
 */
RWhois.prototype.send = function(socket,msg,command){
  if(undefined === command) command = true
  var payload
  if(msg && command) payload = '%' + msg + '\r\n'
  else if(msg && !command) payload = msg + '\r\n'
  else payload = '\r\n'
  this.debug('Server says: ' + payload)
  socket.write(payload)
}


/**
 * Send server information banner based on configuration options
 * @param {object} socket
 */
RWhois.prototype.banner = function(socket){
  //%rwhois V-1.5:003fff:00 hq.esited.com (by Network Solutions, Inc. V-1.5.9.5)
  var banner = 'rwhois V-' +
    this.options.get('protocol') + ':' +
    this.options.get('capabilities') + ' ' +
    this.options.get('hostname') + ' ' +
    '(by ' +
    this.options.get('author') + '. ' +
    'V-' + this.options.get('version') + ')'
  this.send(socket,banner)
}


/**
 * Send OK message
 * @param {object} socket
 */
RWhois.prototype.ok = function(socket){
  this.send(socket,'ok')
}


/**
 * Send error message
 * @param {object} socket
 * @param {number} code
 * @param {string} msg
 */
RWhois.prototype.error = function(socket,code,msg){
  var error = 'error ' + code + ' ' + msg
  this.send(socket,error)
}


/**
 * Set result limit
 * @param {number} limit
 */
RWhois.prototype.setLimit = function(limit){
  this.debug('Setting limit to ' + limit)
  this.limit = limit
}


/**
 * Register query handler
 * @param {string} type
 * @param {function} handler
 */
RWhois.prototype.query = function(type,handler){
  this.handlers.query[type] = handler
}


/**
 * Run handler
 * @param {string} category
 * @param {string} type
 * @param {*} req
 * @param {function} next
 * @return {*}
 */
RWhois.prototype.runHandler = function(category,type,req,next){
  var self = this
  if('function' !== typeof self.handlers[category][type])
    return next(category + ' handler for ' + type + ' not implemented')
  self.handlers[category][type](req,next)
}


/**
 * Listen for connections
 * @param {number} port
 * @param {string} host
 * @param {function} next
 * @return {object}
 */
RWhois.prototype.listen = function(port,host,next){
  var self = this
  if(!port) port = 4321
  if('function' === typeof host){
    next = host
    host = null
  }
  this.debug('Creating server')
  var server = net.createServer(function(socket){
    var match
    self.debug('Received connection from ' + socket.remoteAddress)
    socket.setEncoding('utf-8')
    //send the banner on connect regardless
    self.banner(socket)
    //listen for incoming data from the client
    socket.on('data',function(data){
      //strip newlines
      data = data.replace(/\r\n$/,'')
      self.debug('Client says: ' + data)
      //client reports capabilities
      if(data.match(/^-rwhois/i)){
        self.banner(socket)
        self.ok(socket)
      }
      //client asks for a limit
      if(data.match(/^-limit/i)){
        match = data.match(/^-limit (\d+)$/i)
        if(!match || !match[1] || !match[1].match(/^\d+$/))
          self.error(socket,1,'Invalid value for limit')
        self.setLimit(match[1])
        self.ok(socket)
      }
      //client asks for an ipv4 ip
      if(data.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)){
        self.debug('Client is querying an IPv4 IP')
        match = data.match(/^([0-9\.]{7,15})$/)
        self.runHandler(
          'query',
          'ipv4',
          {
            query: match[1],
            limit: self.limit
          },
          function(err,res){
            if(err) return self.error(socket,2,err)
            if(!res) self.send(socket,'')
            //break up array
            if(res instanceof Array){
              res.forEach(function(line){
                self.send(socket,line,false)
              })
              self.send(socket)
              self.ok(socket)
            } else self.send(socket,res)
          }
        )
      }
    })
  })
  this.debug('Starting to listen on ' + (host || '0.0.0.0') + ':' + port)
  server.listen(port,host,next)
  return server
}


/**
 * Export the main object
 * @param {object} options
 * @return {object} Instance of RWhois
 */
module.exports = function(options){
  return new RWhois(options)
}
