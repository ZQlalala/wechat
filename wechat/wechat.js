'use strict'

var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var Promise = require('bluebird');
var fs = require('fs');
var util = require('./util');
var request = Promise.promisify(require('request'));
//微信接口调用api
var api = {
    accessToken:prefix+'token?grant_type=client_credential',
    uploadMeteria:prefix+'media/upload?'
}

function WeChat(opts){ // 构造函数
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken; //获取票据
    this.saveAccessToken = opts.saveAccessToken; //存储票据

    this.fetchAccessToken();
}

WeChat.prototype.fetchAccessToken = function(){
    var that = this;
    //判断access_token&expires_in 是否存在，且未过期
    if(this.access_token&&this.expires_in){
        if(this.isValidAccessToken(this)){
            return Promise.resolve(this);
        }
    }

    this.getAccessToken()
    .then(function(data){
        try{
            data = JSON.parse(data);
        }catch(e){
            return that.updateAccessToken(data); //获取票据失败,返回更新数据
        }
        //如果拿到票据 判断其合法性 是否在有效期.
        if (that.isValidAccessToken(data)) {
            return Promise.resolve(data); //将这个票据传递下去
        }else{
            return that.updateAccessToken();
        }
    })
    .then(function(data){ //此时拿到一个合法的票据
        that.access_token = data.access_token;
        that.expires_in = data.expires_in; //拿到一个过期的字段
        that.saveAccessToken(data);

        return Promise.resolve(data);//data传递给uploadMeteria
    })

   
}
//票据验证方法
WeChat.prototype.isValidAccessToken = function(data){
    if(!data || !data.access_token || !data.expires_in){
        return false;
    }
    var access_token = data.access_token;
    var expires_in = data.expires_in;
    var now = (new Date().getTime());
    if (now < expires_in) { //判断当前时间是否小于 过期时间
        return true;
    }else{
        return false;
    }
}
//票据更新方法
WeChat.prototype.updateAccessToken = function(){
    var appID = this.appID;
    var appSecret = this.appSecret;
    // 请求票据的地址
    var url = api.accessToken + '&appid=' + appID +'&secret='+appSecret;
    //request 也是对http get post 封装好的一个库 
    return new Promise(function(resolve,reject){
    	request({url: url, json: true}, function (error, response, body) {
    	    if (!error && response.statusCode === 200) {
    	        var data = response.body;
    	        var now = (new Date().getTime());
    	        var expires_in = now + (data.expires_in - 20) * 1000;
    	        data.expires_in = expires_in;
    	        resolve(data);
    	        console.log(data);
    	    } else {
    	        reject()
    	    }
	   });
    });
}

//微信上传素材
WeChat.prototype.uploadMeteria = function(type, filepath){
    var that = this;
    var  form = {
        media:fs.createReadStream(filepath)
    }; 
    //request 也是对http get post 封装好的一个库 
    return new Promise(function(resolve,reject){
        that.fetchAccessToken().then(function(data){
            
            var url = api.uploadMeteria + 'access_token=' + data.access_token +'&type='+type;
            request({method:'POST', formData:form, url: url, json: true})
            .then(function(response){
                var _data = response.body;
                if(_data){
                    resolve(_data);
                }else{
                    throw new Error('上传素材失败');
                }
            }).catch(function(err){
                reject(err);
            });
        });
    });
}
//微信回复方法
WeChat.prototype.reply = function(){
    var content = this.body;//回复的内容content
    var message = this.weixin;//回复的信息message
    var xml = util.tpl(content,message);//得到拼接好的xml

    this.status = 200;
    this.type = 'application/xml';
    this.body = xml;
}

module.exports = WeChat;