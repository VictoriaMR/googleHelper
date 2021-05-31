$(function(){
	var uuid,cookie_str;
	let domain,current_url=location.host;
	if(current_url.indexOf('1688.com')>=0){  // 阿里巴巴产品页面
		domain='1688.com';
	}
	if(current_url.indexOf('taobao.com')>=0){  // 淘宝产品页面
		domain='taobao.com';
	}
	if(current_url.indexOf('tmall.com')>=0){  // 天猫产品页面
		domain='tmall.com';
	}
	if (!isItemPage(domain)) {
		return;
	}
	//爬取数据控制
	chrome.extension.sendRequest({'action': 'getLocalStorage', host:location.href, value: 'switch_status'}, function(res){
		//扩展开关按钮
		if (res.switch_status && res.switch_status === '1') {
			localStorage.setItem('crawer_chrome_runtime_id', chrome.runtime.id);
			//加载js
			loadContentJs();
		}
	});
});
//监听页面通信
window.addEventListener('message', function(event) {
	if (event.source != window) {
		return;
	}
	switch (event.data.type) {
		case 'reload_page_js':
			//重载js
			loadContentJs();
			break;
	}
}, false);
//加载js
function loadContentJs() {
	chrome.extension.sendRequest({'action': 'request_api', value: 'common/getCrawerData', cache_key: 'crawer_data_cache'}, function(res) {
		if (res.code == 200) {
			var obj = document.getElementById('crawer_content_js');
			if (obj) {
				obj.remove();
			}
			initPopPage({action: 'load_js', value: 'crawer/content_page.js', version: res.data.version});
		}
	});
}
//引入页面静态文件
function initPopPage(data) {
	var common_url = 'https://lmr.admin.cn/';
	if (typeof data.version === 'undefined') {
		data.version = Math.random()*10;
	}
	switch (data.action) {
		case 'load_js':
			//加载jquery
			var head = document.getElementsByTagName('head')[0];
			var inpageJS = common_url+data.value+'?version='+data.version;
			var script = document.createElement('script');
			script.src = inpageJS;
			script.type = 'text/javascript';
			script.charset = 'utf-8';
			script.id = data.value.replace('/', '_').replace('.', '_');
			head.appendChild(script);
			break;
	}
}
//是否详情页面
function isItemPage(domain){
    let ret=false;
    let current_url=location.href;
    switch (domain) {
        case '1688.com':
            reg=/^https\:\/\/detail\.1688\.com\/offer\/(\d+)\.html(?:.)*/i;
            ret=reg.test(current_url);
            break;
        case 'taobao.com':
            reg=/^https\:\/\/item\.taobao\.com\/item\.htm\?(?:.)*id=(\d+)(?:.)*$/i;
            ret=reg.test(current_url);
            break;
        case 'tmall.com':
            reg=/^https\:\/\/detail\.tmall\.com\/item\.htm\?(?:.)*id=(\d+)(?:.)*$/i;
            ret=reg.test(current_url);
            break;
    }
    return ret;
}