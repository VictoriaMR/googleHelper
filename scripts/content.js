//获取uuid是否存在
chrome.runtime.sendMessage({action: 'setNxUuid'}, function(res){
	console.log(res, 'res')
});