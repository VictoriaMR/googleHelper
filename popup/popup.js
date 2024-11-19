//重置按钮
let uuid;
function uuidStr(len){
    let keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let str='';
    let keyLen = keyStr.length-1;
    for(let i=0;i<len;++i){
        str+=keyStr.charAt(Math.random()*keyLen);
    }
    return str;
}
chrome.runtime.sendMessage({action:'getCache', cache_key:'uuid'}, function(res) {
	if (!res.data) {
		uuid = uuidStr(32);
		chrome.runtime.sendMessage({action:'setCache', cache_key:'uuid', value:uuid, expire:-1});
	}
});
window.onload = function() {
	chrome.runtime.sendMessage({action: 'request', value: 'api/helperData', cache_key: 'helper_all_data_cache'}, function(res) {
		if (res && res.code) {
			let html = '';
			let action = res.data.action;
			for (let i=0;i<action.length;i++) {
				html += '<div class="setting-content">\
							<label class="setting-title">'+action[i].title+'</label>\
							<div class="switch-p" id="'+action[i].name+'_switch_status" data-status="close">\
								<div class="switch-s"></div>\
							</div>\
						</div>';
			}
			document.getElementById('function-content').innerHTML = html;
			//按钮初始化
			chrome.runtime.sendMessage({action: 'getCache', cache_key: 'helper_action_status'}, function(res){
				if (res.data) {
					for (let i in res.data) {
						let obj = document.getElementById(i);
						if (obj && res.data[i] == 1) {
							obj.setAttribute('data-status', 'open');
						}
					}
				}
			});
			let obj = document.querySelectorAll('#function-content .switch-p');
			for (let i=0; i<obj.length; i++) {
				const id = obj[i].getAttribute('id');
				obj[i].onclick = function(){
					let status = this.getAttribute('data-status')=='close'?1:0;
					chrome.runtime.sendMessage({action: 'hSetCache', cache_key: 'helper_action_status', key:id, value:status, expire:-1}, function(res){
						if (res.code) {
							obj[i].setAttribute('data-status', status==1?'open':'close');
						}
						chrome.tabs.reload();
					});
				}
			}
		} else {
			alert(res.msg);
		}
	});
	document.getElementById('reset-button').onclick = function(){
		chrome.runtime.sendMessage({action: 'delCache', cache_key: 'helper_all_data_cache'}, function(res) {
			window.location.reload();
		});
	};
}