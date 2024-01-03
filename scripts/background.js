const api_url = 'https://admin.cn/';
//应用js文件
importScripts('./http.js');
importScripts('./cache.js');
importScripts('./socket.js');
//扩展内通信
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    listenerEvent(request).then(sendResponse);
    return true;
});
//监听页面通信 - 跨扩展消息
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    listenerEvent(request).then(sendResponse);
    return true;
});
async function listenerEvent(request) {
    let rst;
    switch (request.action) {
        case 'init':
            let [tab] = await chrome.tabs.query({active:true, lastFocusedWindow:true});
            // 注入初始化js
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['scripts/init.js'],
                world: 'MAIN'
            });
            break;
        case 'request':
            if (request.cache_key) {
                rst = await getCache(request.cache_key);
            }
            if (!rst) {
                rst = await getApi(api_url + request.value, request.param);
                if (request.cache_key && rst && rst.data) {
                    await setCache(request.cache_key, rst.data, request.expire);
                }
            }
            break;
        case 'getCache':
            rst = await getCache(request.cache_key);
            break;
        case 'setCache':
            rst = await setCache(request.cache_key, request.value, request.expire);
            break;
        case 'hSetCache':
            rst = await getCache(request.cache_key);
            if (!rst) rst = {};
            rst[request.key] = request.value;
            rst = await setCache(request.cache_key, rst, request.expire);
            break;
        case 'delCache':
            rst = await delCache(request.cache_key);
            break;
        case 'getUrl':
            rst = api_url;
            break;
        case 'initSocket':
            
            break;
        case 'sotpSocket':
            
            break;
        case 'setSocket':
            
            break;
    }
    if (typeof rst != 'object' || !rst.code) {
        rst = {code: 200, data: rst, msg: rst ? 'success' : 'fail'};
    }
    return rst;
}
// 监听替换
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        if (details.url.indexOf('detail-project/pc-detail/0.2.21/web/item.js') >= 0) {
            return {redirectUrl: api_url+'helper/item.js'};
        }
    },
    {urls: ["*://*/*.js*"]}
);