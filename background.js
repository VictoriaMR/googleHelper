const api_url = 'https://lmr.admin.cn/';
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
			bg_alert(request.value);
  			break;
  		case 'getUrl':
  			sendResponse({code:200, data:api_url, msg:'success'});
  			break;
  		case 'getCache':
  			rst = CACHE.getCache(request.cache_key);
  			sendResponse({code:200, data:rst, msg:'success'});
  			break;
  		case 'setCache':
  			rst = CACHE.setCache(request.cache_key, request.value, request.expire);
  			sendResponse({code:200, data:rst, msg:'success'});
  			break;
  		case 'delCache':
  			rst = CACHE.delCache(request.cache_key);
  			sendResponse({code:200, data:rst, msg:'success'});
  			break;
		case 'request':
			if (request.cache_key) {
				rst = CACHE.getCache(request.cache_key);
				if (rst) {
					sendResponse({code:200, data:rst, msg:'success'});
					return false;
				}
			}
			getApi(api_url + request.value, request.param, function(res) {
				if (res.code === 200 || res.code === '200') {
					CACHE.setCache(request.cache_key, res.data, request.expire);
				}
				sendResponse(res);
			});
			break;
  	}
}
//发送请求
function getApi(url, param, callback) {
	if (!param) {
		param = {};
	}
	param.is_ajax = 1;
	$.ajax({
	    url:url,
	    data:param,
	    type:'POST',
	    dataType:'json',
	    success:function(res) {
			if (callback) {
	        	callback(res);
	        }
	    },
	    error:function (jqXHR, textStatus, errorThrown) {
            if (callback) {
	        	callback({code:10000, data:'', msg:textStatus});
	        }
        }
	});
}
//在整个页面中alert
function bg_alert(msg) {
	alert(msg);
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