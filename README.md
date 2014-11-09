node-rwhois
===========

Node RWhois library that implements the ARIN RWhois protocol to serve usage to ARIN

Routing works similar to express (req,res)


## Getting Started

### Install RWhois Library

```
$ npm install rwhois
```

### Setup a server

```js
'use strict';
var rwhois = require('rwhois')
var app = rwhois()

//handle ipv4 queries
app.query('ipv4',function(req,next){
  //use the values in the request object to structure the response
  console.log(req) //{query: '192.168.1.100', limit: 20}
  next(
    //report any errors here
    null,
    //this is the response, it can be an array or line delimited text
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
    //this is a referral to another server
    ,'rwhois://rwhois.arin.net:4321/auth-area=.'
  )
})

//setup and listen
app.listen()
```

## Options

### Defaults

```js
{
  author: 'ESITED LLC',
  debug: false,
  info: true,
  protocol: '1.5',
  capabilities: '003fff:00',
  port: 4321,
  hostname: 'localhost'
}
```

### Overrides

Options can be overridden at instantiation time.

Example
```js
var app = rwhois({
  debug: true,
  author: 'My Company',
  port: 1234,
  hostname: 'whois.mycompany.net'
})
```

### Properties

* debug - Enable debug messaging in the console.
* info - Enable info level messages in the console
* author - The author supplied in the banner back to the client
* protcol - The advertised protocol of the server
* capabilities - The advertised capabilities of the server
* port - Port to listen on
* hostname - Hostname given in the banner returned to the client

## Building a Server

This library merely includes the protocol encapsulation, it does not create the database or to handle the queries.

We are planning on adding some helpers to aid in query resolution.

## Changelog

### 0.2.0
* Upgraded to object-manage 0.8.x

### 0.1.1
* Fixed bug that would not close the server connection when the server was done sending data

### 0.1.0
* Initial Release