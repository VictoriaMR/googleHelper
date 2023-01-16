new WebSocket("wss://127.0.0.1:10028");
//扩展内通信
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		switch(request.action) {
			case 'setNxUuid':
				getCache('uuid', function(uuid){
					console.log(uuid, 'uuid')
					if (!uuid) {
						uuid = randString(32);
					}
					setCache('uuid', uuid, -1);
					console.log(sendResponse, 'sendResponse')
					sendResponse({code:200, data: uuid, msg:'获取成功'});
				});
				break;
		}
		return true;
	}
);
//生成唯一ID字符串
function randString(len) {
	let arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
	let str = '';
	for (let i=0; i<len; ++i) {
		str += arr[Math.round(Math.random()*(arr.length-1))];
	}
	return str;
}
//设置缓存
function setCache(key, value, expire) {
	if (expire !== -1) {
		expire = now() + expire;
	}
	const data = {expire:expire, content:value};
	chrome.storage.local.set({[key]:data});
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
