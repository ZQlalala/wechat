'use strict'

var config = require('./config');
var WeChat = require('./wechat/wechat');

var wxApi = new WeChat(config.wechat);

exports.reply = function *(next){
	var message = this.weixin;

	if(message.MsgType === 'event'){
		
		if (message.Event === 'subscribe') {
			console.log(message.Event);

			if (message.EventKey) {
				console.log('ttt');
				console.log('扫码进入：'+message.EventKey+' ,'+message.Ticket);
			}
			this.body = '订阅了此号\n';
		}else if(message.Event === 'unsubscribe'){
			console.log('取消关注');
			this.body = '';
		}else if(message.Event === 'LOCATION'){
			this.body = '您上报的位置：'+message.Latitude+''+message.Longitude+'-'+message.Precision
		}else if(message.Event === 'CLICK'){
			this.body = '您点击了菜单:'+message.EventKey;
		}else if(message.Event === 'SCAN'){
			this.body = '已扫二维码';
			console.log( '关注后扫二维码'+message.EventKey+''+message.Ticket);
		}else if(message.Event === 'VIEW'){
			this.body = '您点击了菜单的链接：'+message.EventKey;
		}
		
	}else if(message.MsgType === 'text'){
		var content = message.Content;
		var replyMsg = '请回复数字1~3';
		if(content === '1'){
			replyMsg = '欢迎进入该公众号1';
		}else if(content === '2'){
			replyMsg = '好好学习2';
		}else if(content === '3'){
			replyMsg = [{
				'title':'微信开发公众号',
				'description':'好好学习。。。',
				'picUrl':'http://dn-cnode.qbox.me/FtTf-Q0TGy3ClB7cpSzihthXl2sN',
				'url':'http://cnodejs.org/topic/555fec114eb040084cfe5d15'
			},{
				'title':'微信开发公众号222',
				'description':'好好学习。。。',
				'picUrl':'http://dn-cnode.qbox.me/FtTf-Q0TGy3ClB7cpSzihthXl2sN',
				'url':'http://cnodejs.org/topic/555fec114eb040084cfe5d15'
			}];

		}else if(content === '4'){
			var data = yield wxApi.uploadMeteria('image', __dirname+'/source/1.jpg');

			replyMsg = {
				type:'image',
				mediaId:data.media_id
			}

		}else if(content === '5'){
			var data = yield wxApi.uploadMeteria('video', __dirname+'/source/test.mp4');

			replyMsg = {
				type:'video',
				title:'视频',
				description:'shipppp'
				mediaId:data.media_id
			}

		}
		this.body = replyMsg;

	}

	yield next;
}