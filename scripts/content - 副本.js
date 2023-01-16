localStorage.setItem('helper_extid', chrome.runtime.id);
//获取uuid是否存在
chrome.runtime.sendMessage({action: 'getCache', cache_key: 'uuid'}, function(res){
	if (!res.data) {
		chrome.runtime.sendMessage({action: 'setCache', cache_key: 'uuid', value: createNonstr(32), expire: -1});
	}
});
//引入初始化js文件
chrome.runtime.sendMessage({action: 'request', value: 'api/getHelperData', cache_key: 'helper_all_data_cache'}, function(res) {
	if (res.code === '200') {
		loadStatic('js', 'helper/init.js', res.data.version);
	} else {
		console.log('helper_error: '+res.message);
	}
});
function createNonstr(len) {
	let arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
	let str = '';
	for (let i=0; i<len; ++i) {
		str += arr[Math.round(Math.random()*(arr.length-1))];
	}
	return str;
}
//引入页面静态文件
function loadStatic(action, value, version) {
	let obj = document.querySelector('head');
	if (!obj) {
		return false;
	}
	chrome.runtime.sendMessage({action: 'getUrl'}, function(res) {
		if (res.data) {
			let url = res.data+value;
			if (typeof version !== 'undefined') {
				url += '?v='+version;
			}
			const id = value.replace(/\//g, '_').replace(/\./g, '_');
			switch (action) {
				case 'js': //加载js
					let script = document.createElement('script');
					script.type = 'text/javascript';
					script.src = url;
					script.charset = 'utf-8';
					script.id = id;
					obj.appendChild(script);
					break;
			}
		}
	});
}