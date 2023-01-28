chrome.runtime.sendMessage({action: 'request', value: 'api/getHelperFunction', cache_key: 'helper_function_data_cache'}, function(res) {
	if (res && res.code == 200) {
		let html = '';
		for (let i=0;i<res.data.length;i++) {
			html += '<div class="setting-content">\
						<label class="setting-title">'+res.data[i].title+'</label>\
						<div class="switch-p" id="'+res.data[i].name+'_switch_status" data-status="close">\
							<div class="switch-s"></div>\
						</div>\
					</div>';
		}
		document.getElementById('function-content').innerHTML = html;
		let obj = document.querySelectorAll('#function-content .switch-p');
		for (let i=0; i<obj.length; i++) {
			const id = obj[i].getAttribute('id');
			obj[i].onclick = function(){
				let status = this.getAttribute('data-status')=='close'?1:0;
				chrome.runtime.sendMessage({action: 'setCache', cache_key: id, value:status, expire:-1}, function(res){
					if (res.code == 200) {
						obj[i].setAttribute('data-status', status==1?'open':'close');
					}
					chrome.tabs.reload();
				});
			}
			chrome.runtime.sendMessage({action: 'getCache', cache_key: id}, function(res){
				if (res.code == 200 && res.data) {
					obj[i].setAttribute('data-status', 'open');
				}
			});
		}
	} else {
		alert(res.msg);
	}
});