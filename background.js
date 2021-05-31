var api_url = 'https://lmr.admin.cn/';
var expire_time = 30 * 60; //缓存时间
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
  	switch(request.action) {
  		case 'getLocalStorage':
  			sendResponse({[request.value]: localStorage.getItem(request.value)});
  			break;
  		case 'request_api':
  			var data = getCache(request.cache_key);
			if (data) {
				sendResponse({data:data, code: 200});
				return false;
			}
  			getApi(api_url + request.value, request.param, sendResponse, request.cache_key);
  			break;
  		case 'delete_cache': //删除缓存
  			deleteCache(request.value);
  			sendResponse();
  			break;
  	}
});
//在整个页面中alert
function bg_alert(msg) {
	alert(msg);
}
//监听页面通信
chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		switch (request.action) {
			case 'request_api':
				var data = getCache(request.cache_key);
				if (data) {
					sendResponse({data:data, code: 200});
					return false;
				}
				getApi(api_url + request.value, request.param, sendResponse, request.cache_key);
				break;
			case 'delete_cache': //删除缓存
	  			deleteCache(request.value);
	  			sendResponse();
	  			break;
		}
		return true;
	}
);
//发送请求
function getApi(url, param, callback, cache_key) {
	if (param) {
		param.is_ajax = 1;
	} else {
		param = {is_ajax: 1};
	}
	$.post(url, param, function(res) {
		if (res.code == 200) {
			if (cache_key) {
				setCache(cache_key, res.data);
			}
		} else {
			bg_alert(res.message);
		}
		if (callback) {
        	callback(res);
        }
	});
}
function getNowTime() {
	return parseInt(new Date().getTime()/1000);
}
//设置缓存
var crawer_cache_key = 'crawer_cache';
function setCache(key, value) {
	var data = allCache(crawer_cache_key);
	if (!data) {
		data = {};
	}
	data[key] = {expire: getNowTime() + expire_time, content: value};
	localStorage.setItem(crawer_cache_key, JSON.stringify(data));
	return true;
}
//获取缓存
function getCache(key) {
	if (!key) {
		return false;
	}
	var data = allCache(crawer_cache_key);
	if (data) {
		if (data[key] && data[key].expire > getNowTime()) {
			return data[key].content;
		}
	}
	return false;
}
function allCache(key) {
	var data = localStorage.getItem(crawer_cache_key);
	if (data) {
		data = JSON.parse(data);
	}
	return data;
}
//删除缓存
function deleteCache(key) {
	if (!key) {
		localStorage.setItem(crawer_cache_key, '');
	} else {
		var data = allCache(crawer_cache_key);
		if (data) {
			delete data[key];
		}
	}
	return true;
}
