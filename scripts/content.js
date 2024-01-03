// 储存当前扩展ID
localStorage.setItem('baycheerhelper_extid', chrome.runtime.id);
// 初始化页面
chrome.runtime.sendMessage({action: 'getCache', cache_key: 'helper_action_status'}, function(res){
	if (res.data) {
		for (let i in res.data) {
			if (res.data[i] == 1) {
				chrome.runtime.sendMessage({action: 'init'});
				break;
			}
		}
	}
});
//接收backgroup通信
chrome.runtime.onMessage.addListener((request , sender , sendResponse) => {
    window.postMessage(request, "*");
});