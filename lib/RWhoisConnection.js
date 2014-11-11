'use strict';
var debug = require('debug')('rwhois:RWhoisConnection')



/**
 * RWhois Connection
 * @param {socket} socket
 * @param {object} options
 * @constructor
 */
var RWhoisConnection = function(socket,options){
  this.options = options
  this.socket = socket
  this.socket.setEncoding('utf-8')
}


/**
 * Send message back to the client
 * @param {string} msg
 * @param {boolean} command Specific whether or not the msg is a command
 */
RWhoisConnection.prototype.send = function(msg,command){
  var socket = this.socket
  if(undefined === command) command = true
  var payload
  if(msg && command) payload = '%' + msg + '\r\n'
  else if(msg && !command) payload = msg + '\r\n'
  else payload = '\r\n'
  debug('Server says: ' + payload.replace(/^%/,'').trim())
  socket.write(payload)
}


/**
 * Send server information banner based on configuration options
 */
RWhoisConnection.prototype.banner = function(){
  //%rwhois V-1.5:003fff:00 hq.esited.com (by Network Solutions, Inc. V-1.5.9.5)
  var banner = 'rwhois V-' +
    this.options.protocol + ':' +
    this.options.capabilities + ' ' +
    this.options.hostname + ' ' +
    '(by ' +
    this.options.author + '. ' +
    'V-' + this.options.version + ')'
  this.send(banner)
}


/**
 * Send OK message
 */
RWhoisConnection.prototype.ok = function(){
  this.send('ok')
}


/**
 * End client
 */
RWhoisConnection.prototype.end = function(){
  this.ok()
  this.socket.end()
}


/**
 * Send error message
 * @param {number} code
 * @param {string} msg
 */
RWhoisConnection.prototype.error = function(code,msg){
  var error = 'error ' + code + ' ' + msg
  this.send(error)
}


/**
 * Export the library
 * @type {Function}
 */
module.exports = RWhoisConnection
