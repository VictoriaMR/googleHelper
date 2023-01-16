importScripts('./jquery.js');
const api_url = 'https://shop.admin.cn/';
const expire_time = 24*60*60; //缓存时间
//扩展内通信
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sendResponse);
	}
);
//外部页面通信
chrome.runtime.onMessageExternal.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sendResponse);
	}
);
//公共处理请求分发方法
function listenerResponse(request, sendResponse) {
	switch(request.action) {
		case 'alert':
			bgAlert(request.value);
			break;
		case 'getUrl':
			sendResponse({code:200, data:api_url, msg:'success'});
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
		case 'delCache':
			delCache(request.cache_key, function(rst){
				sendResponse({code:200, data:rst, msg:'success'});
			});
			break;
		case 'request':
			if (request.cache_key) {
				getCache(request.cache_key, function(rst){
					if (rst) {
						sendResponse({code:200, data:rst, msg:'success'});
					} else {
						getApi(api_url + request.value, request.param, request.type, request.dataType, function(res) {
							if (res.code === 200) {
								setCache(request.cache_key, res.data, request.expire, function(rst) {
									sendResponse(res);
								});
							} else {
								sendResponse(res);
							}
						});
					}
				});
			}
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
		type = 'post';
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
			console.log(res, 'res')
			// if (callback) {
			// 	callback(res);
			// }
		},
		error:function (jqXHR, textStatus, errorThrown) {
			console.log(jqXHR, textStatus, 'error')
			// if (callback) {
			// 	callback({code:'10000', data:'', msg:textStatus+errorThrown});
			// }
		}
	});
}
//在整个页面中alert
function bgAlert(msg) {
	alert(msg);
}
function getCache(key, callback) {
	return CACHE.getCache(key, callback);
}
function setCache(key, value, expire, callback) {
	return CACHE.setCache(key, value, expire, callback);
}
function delCache(key, callback) {
	return CACHE.delCache(key, callback);
}
//缓存方法
const CACHE = {
	getCache:function(key, callback) {
		chrome.storage.local.get(key).then((data) => {
			if (!data) {
				callback(false);
				return false;
			}
			try {
				if (typeof JSON.parse(data) === 'object') {
					data = JSON.parse(data);
				}
			} catch(e) {
				callback(false);
				return false;
			}
			if (data.expire === -1) {
				callback(data.content);
			}
			if (parseInt(data.expire) <= this.getTime()) {
				this.delCache(key, callback);
				return false;
			}
			callback(data.content);
		});
	},
	setCache:function(key, value, expire, callback) {
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
		chrome.storage.local.set(data).then((rst) => {
		  	callback(rst);
		});
	},
	delCache:function(key, callback) {
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
//请求方法
function formatParams(data) {
	let arr = []
	for (let name in data) {
		arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]))
	}
	arr.push(('v=' + Math.random()).replace('.', ''))
	return arr.join('&')
}
function ajax(options) {
	options = options || {}
	options.method = (options.method || 'GET').toUpperCase()
	options.dataType = options.dataType || 'json'
	options.timeout = options.timeout || 30000
	let params = formatParams(options.data)
	let xhr
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest()
	} else if (window.ActiveObject) {
		xhr = new ActiveXobject('Microsoft.XMLHTTP')
	}
	if (options.method == 'GET') {
		xhr.open('get', options.url + '?' + params, true)
		xhr.send(null)
	} else if (options.method == 'POST') {
		xhr.open('post', options.url, true)
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
		xhr.send(params)
	}

	let xhrTimeout = setTimeout(function () {
		if (xhr.readySate != 4) {
			options.error && options.error(xhr.status)
		}
	}, options.timeout)
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4) {
			clearTimeout(xhrTimeout);
			let status = xhr.status
			if ((status >= 200 && status < 300) || status == 304) {
				options.success && options.success(xhr.responseText, xhr.responseXML)
			} else {
				options.error && options.error(status, xhr)
			}
		}
	}
}