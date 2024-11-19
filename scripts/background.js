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
const listenerEvent = async(request, sender) => {
    let rst;
    switch (request.action) {
        case 'request':
            if (request.cache_key) {
                rst = await getCache(request.cache_key);
            }
            if (!rst) {
                if (request.value.substr(0, 4) != 'http') {
                    request.value = api_url + request.value;
                }
                rst = await getApi(request.value, request.param);
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
            rst = await socketInit(sender);
            break;
        case 'stopSocket':
            rst = await socketClose();
            break;
        case 'setSocket':
            rst = await updateSocketConfig();
            break;
    }
    if (typeof rst != 'object' || !rst.code) {
        rst = {code: 1, data: rst, msg: rst ? 'success' : 'fail'};
    }
    return rst;
}