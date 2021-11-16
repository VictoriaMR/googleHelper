const api_url = 'https://lmrshop.ml/';
const expire_time = 24*60*60; //缓存时间
//扩展内通信
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sendResponse);
		return true;
	}
);
//外部页面通信
chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sendResponse);
		return true;
	}
);
//公共处理请求分发方法
function listenerResponse(request, sendResponse) {
	switch(request.action) {
		case 'alert':
			bgAlert(request.value);
			break;
		case 'getUrl':
			sendResponse({code:'200', data:api_url, message:'success'});
			break;
		case 'getCache':
			rst = getCache(request.cache_key);
			sendResponse({code:'200', data:rst, message:'success'});
			break;
		case 'setCache':
			rst = setCache(request.cache_key, request.value, request.expire);
			sendResponse({code:'200', data:rst, message:'success'});
			break;
		case 'delCache':
			rst = delCache(request.cache_key);
			sendResponse({code:'200', data:rst, message:'success'});
			break;
		case 'request':
			if (request.cache_key) {
				rst = getCache(request.cache_key);
				if (rst) {
					sendResponse({code:'200', data:rst, message:'success'});
					return false;
				}
			}
			getApi(api_url + request.value, request.param, request.type, request.dataType, function(res) {
				if (res.code === '200') {
					setCache(request.cache_key, res.data, request.expire);
				}
				sendResponse(res);
			});
			break;
		case 'initSocket':
			HELPERSOCKET.init(request.key);
			sendResponse();
			break;
		case 'sotpSocket':
			HELPERSOCKET.ioLogout(request.key);
			sendResponse();
			break;
		case 'setSocket':
			HELPERSOCKET.set(request.value);
			sendResponse();
			break;
	}
}
//发送请求
function getApi(url, param, type, dataType, callback) {
	if (!param) {
		param = {};
	}
	param.is_ajax = 1;
	if (!type) {
		type = 'POST';
	}
	if (!dataType) {
		dataType = 'JSON';
	}
	$.ajax({
		url: url,
		data: param,
		type: type,
		dataType: dataType,
		success:function(res) {
			if (callback) {
				callback(res);
			}
		},
		error:function (jqXHR, textStatus, errorThrown) {
			if (callback) {
				callback({code:'10000', data:'', message:textStatus+errorThrown});
			}
		}
	});
}
//在整个页面中alert
function bgAlert(message) {
	alert(message);
}
function getCache(key) {
	return CACHE.getCache(key);
}
function setCache(key, value, expire) {
	return CACHE.setCache(key, value, expire);
}
function delCache(key) {
	return CACHE.delCache(key);
}
//缓存方法
const CACHE = {
	getCache:function(key) {
		if (!key) {
			return false;
		}
		let data = localStorage.getItem(key);
		if (!data) {
			return false;
		}
		try {
			if (typeof JSON.parse(data) === 'object') {
				data = JSON.parse(data);
			}
		} catch(e) {
			return data;
		}
		if (data.expire === '-1' || data.expire === -1) {
			return data.content;
		}
		if (parseInt(data.expire) <= this.getTime()) {
			this.delCache(key);
			return false;
		}
		return data.content;
	},
	setCache:function(key, value, expire) {
		if (!key || !value) {
			return false;
		}
		if (expire === '-1' || expire === -1) {
			//to do
		} else {
			if (typeof expire === 'undefined') {
				expire = this.getTime() + expire_time;
			} else {
				expire = this.getTime() + expire;
			}
		}
		const data = {expire:expire, content:value};
		localStorage.setItem(key, JSON.stringify(data));
		return true;
	},
	delCache:function(key) {
		if (!key) {
			return false;
		}
		localStorage.removeItem(key);
		return true;
	},
	getTime:function() {
		return parseInt(new Date().getTime() / 1000);
	}
};