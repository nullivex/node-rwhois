'use strict';
var rwhois = require('./index')
var app = rwhois({debug: true})

//handle ipv4 queries
app.query('ipv4',function(req,next){
  console.log(req)
  next(
    null,
    [
      'network:ID:NET-IBMNET-3.0.0.0/0',
      'network:Auth-Area:0.0.0.0/0',
      'network:Network-Name:IBMNET-3',
      'network:IP-Network:123.45.67.0/24',
      'network:Org-Name:IBM',
      'network:Street-Address:1234 Maneck Avenue',
      'network:City:Black Plains',
      'network:State:NY',
      'network:Postal-Code:12345',
      'network:Country-Code:US',
      'network:Tech-Contact;I:MG305.COM',
      'network:Updated:19931120123455000',
      'network:Updated-By:joeblo@nic.ddn.mil',
      'network:Class-Name:network'
    ]
    //,'rwhois://whois.esited.com:4321/auth-area=.'
  )
})

//setup and listen
app.listen()
