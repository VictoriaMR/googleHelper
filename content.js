localStorage.setItem('helper_extid', chrome.runtime.id);
//引入初始化js文件
chrome.runtime.sendMessage({action: 'request', value: 'api/getHelperData', cache_key: 'helper_all_data_cache'}, function(res) {
	if (res.code === 200 || res.code === '200') {
		loadStatic('js', 'helper/init.js', res.data.version);
	} else {
		chrome.runtime.sendMessage({action: 'alert', value: res.message});
	}
});
//引入页面静态文件
function loadStatic(action, value, version) {
	let obj = document.querySelector('head');
	if (!obj) {
		return false;
	}
	chrome.runtime.sendMessage({action: 'getUrl'}, function(res) {
		if (res.data) {
			localStorage.setItem('helper_api_url', res.data);
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