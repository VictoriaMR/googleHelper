// 储存当前扩展ID
localStorage.setItem('helper_extid', chrome.runtime.id);
//接收backgroup通信
chrome.runtime.onMessage.addListener((request , sender , sendResponse) => {
    window.postMessage(request, "*");
});