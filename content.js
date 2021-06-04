$(function(){
	let domain,current_url = location.host;
	if(current_url.indexOf('1688.com')>=0){  // 阿里巴巴产品页面
		domain='1688.com';
	}
	if(current_url.indexOf('taobao.com')>=0){  // 淘宝产品页面
		domain='taobao.com';
	}
	if(current_url.indexOf('tmall.com')>=0){  // 天猫产品页面
		domain='tmall.com';
	}
	localStorage.setItem('chrome_helper_ext_id', chrome.runtime.id);//扩展ID
	if (isItemPage(domain)) {
		//爬取数据控制
		chrome.runtime.sendMessage({action: 'getCache', cache_key: 'crawler_switch_status'}, function(res){
			console.log(res, 'res')
			//扩展开关按钮
			if (res.data === '1') {
				//加载js
				initPopPage({action: 'loadJs', value: 'googleHelper/crawler_page.js'});
			}
		});
	}
});
//监听页面通信
window.addEventListener('message', function(event) {
	if (event.source !== window) {
		return;
	}
	switch (event.data.type) {
		case 'reload_page_js':
			//重载js
			initPopPage({action: 'loadJs', value: 'googleHelper/crawler_page.js'});
			break;
	}
}, false);
//引入页面静态文件
function initPopPage(data) {
	const common_url = 'https://lmr.admin.cn/';
	if (typeof data.version === 'undefined') {
		data.version = Math.random()*10;
	}
	let head,url,content;
	switch (data.action) {
		case 'loadJs':
			head = document.getElementsByTagName('head')[0];
			url = common_url+data.value+'?version='+data.version;
			content = document.createElement('script');
			content.src = url;
			content.type = 'text/javascript';
			content.id = data.value.replace('/', '_').replace('.', '_');
			head.appendChild(content);
			break;
		case 'loadCss':
			head = document.getElementsByTagName('head')[0];
			url = common_url+data.value+'?version='+data.version;
			content = document.createElement('script');
			content.href = url;
			content.rel = 'text/javascript';
			content.id = data.value.replace('/', '_').replace('.', '_');
			head.appendChild(content);
			break;
	}
}
//是否详情页面
function isItemPage(domain) {
    let ret = false;
    let reg = '';
    let current_url = location.href;
    switch (domain) {
        case '1688.com':
            reg = /^https:\/\/detail\.1688\.com\/offer\/(\d+)\.html(?:.)*/i;
            ret = reg.test(current_url);
            break;
        case 'taobao.com':
            reg = /^https:\/\/item\.taobao\.com\/item\.htm\?(?:.)*id=(\d+)(?:.)*$/i;
            ret = reg.test(current_url);
            break;
        case 'tmall.com':
            reg = /^https:\/\/detail\.tmall\.com\/item\.htm\?(?:.)*id=(\d+)(?:.)*$/i;
            ret = reg.test(current_url);
            break;
    }
    return ret;
}