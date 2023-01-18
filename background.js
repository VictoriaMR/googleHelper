const api_url = 'https://shop.admin.cn/';
const expire_time = 24*60*60; //缓存时间
//扩展内通信
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sender, sendResponse);
		return true;
});
function listenerResponse(request, sender, sendResponse) {
	switch(request.action) {
		case 'request':
			if (request.cache_key) {
				getCache(request.cache_key, function(rst){
					if (rst) {
						sendResponse({code:200, data:rst, msg:'success'});
					} else {
						getApi(api_url + request.value, request.param, function(res) {
							if (res.code === 200) {
								setCache(request.cache_key, res.data, request.expire);
							}
							sendResponse(res);
						}, request.type);
					}
				});
			} else {
				getApi(api_url + request.value, request.param, sendResponse, request.type);
			}
			break;
		case 'getCache':
			getCache(request.cache_key, function(rst){
				sendResponse({code:200, data:rst, msg:'success'});
			});
			break;
		case 'setCache':
			setCache(request.cache_key, request.value, request.expire, function(rst) {
				sendResponse({code:200, data:rst, msg:'success'});
			});
			break;
		case 'getUrl':
			sendResponse({code:200, data:api_url, msg:'success'});
			break;
		case 'initSocket':
			SOCKET.init(request.key, sendResponse);
			break;
		case 'sotpSocket':
			SOCKET.logout(request.key, sendResponse);
			break;
		case 'setSocket':
			SOCKET.set(request.value, sendResponse);
			break;
	}
}
//设置缓存
function setCache(key, value, expire, callback) {
	if (expire !== -1) {
		expire = now() + expire;
	}
	const data = {expire:expire, content:value};
	chrome.storage.local.set({[key]:data}, callback);
}
//获取缓存
function getCache(key, callback) {
	chrome.storage.local.get(key).then(result=>{
		if (!result[key]) {
			callback(false);
		} else if (result[key].expire == -1) {
			callback(result[key].content);
		} else if (result[key].expire <= now()) {
			delCache(key);
			callback(false);
		} else {
			callback(result[key].content);
		}
	});
}
//删除缓存
function delCache(key) {
	chrome.storage.local.remove(key);
}
function now() {
	return parseInt(new Date().getTime() / 1000);
}
//api请求
function getApi(url, param, callback, type) {
	let init = {};
	if (type == 'GET') {
		let strArr = new Array();
		for (let i in param) {
			strArr.push(i+'='+param[i]);
		}
		if (strArr.length > 0) {
			url += url + '?'+strArr.join('&');
		}
	} else {
		let formData = new FormData();
		for (let i in param) {
			formData.append(i, param[i]);
		}
		init.method = 'POST';
		init.body = formData;
	}
	fetch(url, init)
	.then(response => response.json())
	.then(data => {
		callback(data);
		return false;
	})
	.catch((error) => {
		callback({code:500, msg: error.message});
		return false;
	});
}
const SOCKET = {
	init: function(type, callback) {
		const _this = this;
		if (_this.ioLoginSign) {
			return;
		}
		getCache('helper_all_data_cache', function(config){
			if (!config) {
				callback({code:400, data: false, msg:'无配置数据'});
				return false;
			}
			_this.type = type;
			_this.ioLoginSign = false;
			_this.socket = new WebSocket(config.socket_domain);
		});
	},
	logout: function(type, callback){

	},
	set: function(param, callback) {

	},
	ioPing: function() {
		const _this = this;
		clearInterval(_this.ioPingHandler);
		_this.ioPingHandler = setInterval(function() {
			if(_this.ioLoginSign) {
				_this.sendMessage('ioPing', 'ping');
			} else {
				clearInterval(_this.ioPingHandler);
			}
		}, 20000);
	},
};