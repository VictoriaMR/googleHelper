const api_url = 'https://shop.admin.cn/';
const expire_time = 24 * 60 * 60; //缓存时间
const SOCKET = {
    init: function(type, callback) {
        const _this = this;
        if (_this.ioLoginSign) {
            return;
        }
        getCache('helper_all_data_cache', function(config) {
            if (config) {
                _this.type = type;
                _this.ioLoginSign = false;
                // _this.socket = new WebSocket(config.socket_domain);
                _this.socket = new WebSocket('wss://shop.admin.cn/socket.io/');

            } else {
                callback({ code: 400, data: false, msg: '无配置数据'});
            }
        });
    },
    logout: function(type, callback) {

    },
    set: function(param, callback) {

    },
    ioPing: function() {
        const _this = this;
        clearInterval(_this.ioPingHandler);
        _this.ioPingHandler = setInterval(function() {
            if (_this.ioLoginSign) {
                _this.sendMessage('ioPing', 'ping');
            } else {
                clearInterval(_this.ioPingHandler);
            }
        }, 20000);
    },
};
const CACHE = {
    getCache: function(key, callback) {
        let data = localStorage.getItem(key);
        if (!data) {
            callback(false);
        } else {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            if (data.expire == -1) {
                callback(data.content);
            } else if (data.expire <= this.getTime()) {
                this.delCache(key);
                callback(false);
            } else {
                callback(data.content);
            }
        }
    },
    setCache: function(key, value, expire, callback) {
        if (expire != -1) {
            expire = this.getTime() + (expire ? expire : expire_time);
        }
        localStorage.setItem(key, JSON.stringify({expire: expire, content: value}));
        if (callback) callback(true);
    },
    delCache: function(key, callback) {
        localStorage.removeItem(key);
        if (callback) callback(true);
    },
    getTime: function() {
        return parseInt(new Date().getTime() / 1000);
    }
};
//扩展内通信
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        listenerResponse(request, sender, sendResponse);
        return true;
    }
);
//监听页面通信 - 跨扩展消息
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        listenerResponse(request, sender, sendResponse);
        return true;
    }
);
function listenerResponse(request, sender, sendResponse) {
    switch (request.action) {
        case 'request':
            if (request.cache_key) {
                getCache(request.cache_key, function(rst) {
                    if (rst) {
                        sendResponse({ code: 200, data: rst, msg: 'success'});
                    } else {
                        getApi(api_url + request.value, request.param, function(res) {
                            if (res.code === 200) {
                                setCache(request.cache_key, res.data, request.expire);
                            }
                            sendResponse(res);
                        }, request.type);
                    }
                });
            } else {
                getApi(api_url + request.value, request.param, sendResponse, request.type);
            }
            break;
        case 'getCache':
            getCache(request.cache_key, function(rst) {
                sendResponse({ code: 200, data: rst, msg: 'success'});
            });
            break;
        case 'setCache':
            setCache(request.cache_key, request.value, request.expire, function(rst) {
                sendResponse({ code: 200, data: rst, msg: 'success'});
            });
            break;
        case 'getUrl':
            sendResponse({ code: 200, data: api_url, msg: 'success'});
            break;
        case 'initSocket':
            SOCKET.init(request.key, sendResponse);
            break;
        case 'sotpSocket':
            SOCKET.logout(request.key, sendResponse);
            break;
        case 'setSocket':
            SOCKET.set(request.value, sendResponse);
            break;
    }
}
//设置缓存
function setCache(key, value, expire, callback) {
    CACHE.setCache(key, value, expire, callback);
}
//获取缓存
function getCache(key, callback) {
    CACHE.getCache(key, callback);
}
//删除缓存
function delCache(key) {
   CACHE.delCache(key);
}
//api请求
function getApi(url, param, callback, type) {
    let init = {};
    if (type == 'GET') {
        let strArr = new Array();
        for (let i in param) {
            strArr.push(i + '=' + param[i]);
        }
        if (strArr.length > 0) {
            url += url + '?' + strArr.join('&');
        }
    } else {
        let formData = new FormData();
        for (let i in param) {
            formData.append(i, param[i]);
        }
        init.method = 'POST';
        init.body = formData;
    }
    fetch(url, init).then(response => response.json()).then(data => {
        callback(data);
    }).catch((error) => {
        callback({ code: 500, msg: error.message});
    });
}
SOCKET.init();