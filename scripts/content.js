chrome.runtime.sendMessage({action: 'request', value: 'api/helperData', cache_key: 'helper_all_data_cache'}, function(res) {
	if (res.code === 200) {
		let version = res.data.version;
		localStorage.setItem('helper_extid', chrome.runtime.id);
		chrome.runtime.sendMessage({action: 'getUrl'}, function(res) {
			if (res.data) {
				let script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = res.data+'helper/init.js?v='+version;;
				document.querySelector('head').appendChild(script);
			}
		});
	} else {
		alert('helper_error: '+res.msg);
	}
});