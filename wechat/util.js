'use strict'

// var xml2js = require('xml2js').Parser({trim:true,explicitArray:false})
 var xml2js = require('xml2js')
var Promise = require('bluebird')
var tpl = require('./tpl')


exports.parseXMLAsync = function(xml){//xml解析为js对象
	return new Promise(function(resolve,reject){
		xml2js.parseString(xml,function(err,content){
			if(err) reject(err)
			else resolve(content)
		})
	})
}
function formatMessage(result){
	var message = {}

	if(typeof result === 'object'){
		var keys = Object.keys(result)

		for (var i = 0; i < keys.length; i++) {
			var item = result[keys[i]] //key对应的value
			var key = keys[i]  //key
			

			if(!(item instanceof Array)||item.length === 0){
				continue
			}

			if(item.length === 1){
				var val = item[0]
				
				if(typeof val === 'object'){
					message[key] = formatMessage(val)
				}
				else if(typeof val === 'string'){
					message[key] = (val||'').trim()
				}
			}
			else{//item  为数组
				message[key] = []

				for (var j = 0; j < item.length; j++) {
					message[key].push(formatMessage(item[j]))
				}


			}
		}
	}
	return message
}



exports.formatMessage = formatMessage;

exports.tpl = function(content, message){//传递给条tpl 模板
    var info = {};
    var type = 'text';
    var fromUserName = message.FromUserName;
    var toUserName = message.ToUserName;

    if(Array.isArray(content)){
        type = 'news';
    }
    
    content = content || {};
    type = content.type||type;
    info.content = content;
    info.createTime = new Date().getTime();
    info.msgType = type;
    info.toUserName = fromUserName;
    info.fromUserName = toUserName;

    return tpl.compiled(info);//返回拼接好的xml
}
