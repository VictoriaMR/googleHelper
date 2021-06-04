const api_url = 'https://lmr.admin.cn/';
const expire_time = 30 * 60; //缓存时间
//扩展内通信
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sender, sendResponse);
		return true;
	}
);
//外部页面通信
chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sender, sendResponse);
		return true;
	}
);
//在整个页面中alert
function bg_alert(msg) {
	alert(msg);
}
//公共处理请求分发方法
function listenerResponse(request, sender, sendResponse) {
	switch(request.action) {
  		case 'getCache':
  			sendResponse({data: localStorage.getItem(request.cache_key)});
  			break;
  		case 'setCache':
  			localStorage.setItem(request.cache_key, request.value);
  			sendResponse();
  			break;
  		case 'delCache':
  			localStorage.removeItem(request.cache_key);
  			sendResponse();
  			break;
  		case 'request':
			API.request(api_url + request.value, request.param, sendResponse);
  			break;
		case 'requestCache':
			API.requestCache(api_url + request.value, request.param, request.cache_key, sendResponse);
			break;
  	}
}
const API = {
	request: function (url, param, callback) {
		if (param) {
			param.isAjax = 1;
		} else {
			param = {isAjax: 1};
		}
		$.post(url, param, function (res) {
			if (res.code === 200 || res.code === '200') {
				if (callback) {
					callback(res);
				}
			} else {
				bg_alert(res.message);
			}
		});
	},
	requestCache: function (url, param, cacheKey, callback) {
		const _this = this;
		const data = _this.getCache(cacheKey);
		if (data) {
			if (callback) {
				callback({code: 200, data: data, msg: ''})
			}
		} else {
			_this.request(url, param, function (res) {
				if (res.code === 200 || res.code === '200') {
					if (cacheKey) {
						_this.setCache(cacheKey, res.data);
					}
				}
				if (callback) {
					callback(res);
				}
			});	
		}
	},
	getCache: function (cacheKey) {
		if (cacheKey) {
			let data = localStorage.getItem(cacheKey);
			if (data) {
				data = JSON.parse(data);
				//缓存已过期
				if (data.expire >= this.getTime()) {
					localStorage.removeItem(cacheKey);
					return false;
				}
				return data.content;
			}
		}
		return false;
	},
	getTime: function () {
		return parseInt(new Date().getTime())/1000;
	},
	setCache: function (cacheKey, data) {
		const content = {expire: this.getTime()+expire_time, content: data};
		localStorage.setItem(cacheKey, JSON.stringify(content));
		return true;
	},
};