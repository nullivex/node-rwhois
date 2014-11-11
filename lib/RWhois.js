'use strict';
var debug = require('debug')('rwhois:RWhois')
var LinerStream = require('linerstream')
var net = require('net')
var ObjectManage = require('object-manage')

var pkg = require('../package.json')
var RWhoisConnection = require('./RWhoisConnection')



/**
 * Construct RWhois server
 * @param {object} options
 * @constructor
 */
var RWhois = function(options){
  var that = this
  //setup options
  that.options = new ObjectManage()
  that.options.$load({
    author: 'ESITED LLC',
    version: pkg.version,
    debug: false,
    info: true,
    protocol: '1.5',
    capabilities: '003fff:00',
    port: 4321,
    hostname: 'localhost'
  })
  that.options.$load(options)
  debug('Finished loading options',that.options.$strip())
  //freshen local properties
  that.limit = null
  that.handlers = {
    query: {
      ipv4: null
    }
  }
}


/**
 * Set result limit
 * @param {number} limit
 */
RWhois.prototype.setLimit = function(limit){
  debug('Setting limit to ' + limit)
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
  var that = this
  if('function' !== typeof that.handlers[category][type])
    return next(category + ' handler for ' + type + ' not implemented')
  that.handlers[category][type](req,next)
}


/**
 * Connection handler
 * @param {object} socket
 */
RWhois.prototype.connectionHandler = function(socket){
  var that = this
  var res = new RWhoisConnection(socket,that.options)
  var stream = new LinerStream()
  //var match
  debug('Received connection from ' + socket.remoteAddress)
  stream.on('data',function(data){
    var match
    debug('Client says: ' + data)
    //client reports capabilities
    if(data.match(/^-rwhois/i)){
      res.banner()
      res.ok()
    }
    //client asks for a limit
    if(data.match(/^-limit/i)){
      match = data.match(/^-limit (\d+)$/i)
      if(!match || !match[1] || !match[1].match(/^\d+$/))
        res.error(1,'Invalid value for limit')
      that.setLimit(match[1])
      res.ok()
    }
    //client asks for an ipv4 ip
    if(data.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)){
      match = data.match(/^([0-9\.]{7,15})$/)
      debug('Received query for: ' + match[1] + ' from ' + socket.remoteAddress)
      that.runHandler(
        'query',
        'ipv4',
        {
          query: match[1],
          limit: that.limit
        },
        function(err,response,referral){
          if(err) return res.error(2,err)
          if(!response) res.send('')
          //break up array
          if(response instanceof Array){
            response.forEach(function(line){
              res.send(line,false)
            })
            //send referral if we have one
            if(referral) that.send('referral ' + referral)
          } else {
            res.send(response)
            //send referral if we have one
            if(referral) res.send('referral ' + referral)
          }
          res.end()
        }
      )
    }
  })
  //send the banner on connect regardless
  res.banner()
  socket.pipe(stream)
}


/**
 * Listen for connections
 * @return {object}
 */
RWhois.prototype.createServer = function(){
  debug('Creating server')
  return net.createServer(this.connectionHandler.bind(this))
}


/**
 * Create server and listen
 * @param {number} port
 * @param {string} host
 * @param {function} next
 */
RWhois.prototype.listen = function(port,host,next){
  if(!port) port = 4321
  if('function' === typeof host){
    next = host
    host = null
  }
  var server = this.createServer()
  debug('Starting to listen on ' + (host || '0.0.0.0') + ':' + port)
  server.listen(port,host,next)
}


/**
 * Export the connection class
 * @type {RWhoisConnection|exports}
 */
RWhois.RWhoisConnection = RWhoisConnection


/**
 * Export the main object
 * @param {object} options
 * @return {object} Instance of RWhois
 */
module.exports = function(options){
  return new RWhois(options)
}
