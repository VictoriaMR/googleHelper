// //引入初始化js文件
chrome.runtime.sendMessage({action: 'request', value: 'api/getHelperData', cache_key: 'helper_all_data_cache'}, function(res) {
	if (res.code === 200) {
		loadStatic('js', 'helper/init.js', res.data.version);
	} else {
		alert('helper_error: '+res.msg);
	}
});
//引入页面静态文件
function loadStatic(action, value, version) {
	chrome.runtime.sendMessage({action: 'getUrl'}, function(res) {
		if (res.data) {
			let obj = document.querySelector('head');
			switch (action) {
				case 'js':
					let url = res.data+value+'?v='+version;
					let script = document.createElement('script');
					script.type = 'text/javascript';
					script.src = url;
					obj.appendChild(script);
					break;
			}
		}
	});
}