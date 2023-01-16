//获取uuid是否存在
chrome.runtime.sendMessage({action: 'setNxUuid'}, function(res){
	console.log(res, 'res')
	if (!res || !res.data) {
		chrome.runtime.sendMessage({action: 'setCache', cache_key: 'uuid', value: createNonstr(32), expire: -1});
	}
});