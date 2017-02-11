'use strict'

var Koa = require('koa')
var path = require('path')
var g = require('./wechat/g')//中间件
var util = require('./libs/util')
var config  = require('./config')
var weixin = require('./weixin')
var wechat_file = path.join(__dirname,'./config/wechat.txt')

var app = new Koa()
	//app.use(wechat(config.wechat))
	app.use(g(config.wechat,weixin.reply))

	app.listen(1234)
	console.log('listen 1234')
