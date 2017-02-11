'use strict'
var sha1 = require('sha1');
var getRawBody = require('raw-body')
var util = require('./util')
var WeChat = require('./wechat');

/*
* 这个中间件是用来处理事件 推送的数据 用来返回信息
* var wechat = new WeChat(opts); wechat这个实例用来管理和微信的接口,票据的更新、票据的存储并且拿到
*最新票据对他进行一个有效信息的检查。
*/

module.exports = function(opts, handler){//hander 是 在 app.js 里面的 reply 传进来的
    //初始化构造函数
    var wechat = new WeChat(opts);

    return function *(next){
    	
    	var that = this;
    	console.log(this);
    	console.log(this.method);
        console.log(this.query);
        var token = opts.token;
        //签名
        var signature = this.query.signature;
        //随机数
        var nonce = this.query.nonce;
        // 时间戳
        var timestamp = this.query.timestamp;
        //随机字符串
        var echostr = this.query.echostr;
        //字典排序
        var str = [token,timestamp,nonce].sort().join('');
        //加密
        var sha = sha1(str);
        //判断加密后的值 是否等于签名值
        if(this.method === "GET"){
        	 if (sha === signature) {
	            this.body = echostr + '';
	            console.log('echostr: '+echostr);
	        }else{
	            this.body = 'wrong';
	            console.log('wrong');
	        }
        }else if(this.method === "POST"){//对于公众平台，每一次发消息相当于发出一个post请求，
        	//但是需要注意的是不管是发出的请求还是收到的回复，数据格式都是xml
        	if(sha !== signature){
        		this.body = 'wrong'
        		return false
        	}

        	//post过来的xml包
        	var data = yield getRawBody(this.req,{
        		legth:this.length,
        		limit: '1mb',
        		encoding:this.charset
        	});

        	//console.log(data.toString())

        	// parseXMLAsync 是为了把 XML 解析为 JS 对象
        	  var content = yield util.parseXMLAsync(data);
		      console.log(content);
		      /*{ xml:
				   { ToUserName: [ 'gh_ef8114091763' ],
				     FromUserName: [ 'o2x0UvxEO0kvOfOC5wLUnUzqmByc' ],
				     CreateTime: [ '1486631966' ],
				     MsgType: [ 'event' ],
				     Event: [ 'unsubscribe' ],
				     EventKey: [ '' ] } }*/
		      console.log(content.xml);
		     /* { ToUserName: [ 'gh_ef8114091763' ],
				  FromUserName: [ 'o2x0UvxEO0kvOfOC5wLUnUzqmByc' ],
				  CreateTime: [ '1486631966' ],
				  MsgType: [ 'event' ],
				  Event: [ 'unsubscribe' ],
				  EventKey: [ '' ] }*/

		    // formatMessage 是为了把 XML 解析为 json结构化的JS 对象
		      var message = util.formatMessage(content.xml);
		      console.log(message);
		      /*{ ToUserName: 'gh_ef8114091763',  //接收方帐号（收到的OpenID）
				  FromUserName: 'o2x0UvxEO0kvOfOC5wLUnUzqmByc', //开发者微信号
				  CreateTime: '1486631966',
				  MsgType: 'event',
				  Event: 'unsubscribe',
				  EventKey: '' }*/
		      this.weixin = message;  
		      //handler 在 app.js 里面没有传进来吧，在 app use 这个中间件的时候，
		      //需要把 reply.reply 作为 handler 传进来
		      yield handler.call(this, next);
		      wechat.reply.call(this);
        }
       
    }
}