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
                _this.socket = io(config.socket_domain);
                //连接成功->注册
                _this.socket.on('connect', function(){
                    //注册
                    console.log('已链接...')
                    //维持心跳开始
                    _this.ioPing();
                });
                //断开
                _this.socket.on('disconnect', function(){
                    //重新重连
                    console.log('已断开...')
                    _this.reConnect();
                });
                //心跳接收
                _this.socket.on('ioPong', function(e) {
                    console.log('心跳响应...')
                });
                //接收处理请求
                _this.socket.on('deal', function(e) {
                    //url刷新页面
                    chrome.tabs.query({}, function(tabArray){
                        chrome.tabs.update(tabArray[0].id, { url: e.entry_url });
                    });
                });
            } else {
                callback({ code: 400, data: false, msg: '无配置数据'});
            }
        });
    },
    logout: function(type, callback) {
        if (this.socket) {
            this.ioLoginSign = false;
            clearInterval(this.ioPingHandler);
            this.socket.emit('close');
        }
    },
    set: function(param, callback) {
        this.socket.emit(type, data);
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
    reConnect: function() {
        
    }
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
        listenerResponse(request, sendResponse);
        return true;
    }
);
//监听页面通信 - 跨扩展消息
chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        listenerResponse(request, sendResponse);
        return true;
    }
);
function listenerResponse(request, sendResponse) {
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
                        });
                    }
                });
            } else {
                getApi(api_url + request.value, request.param, sendResponse);
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
        case 'hSetCache':
            getCache(request.cache_key, function(rst){
                if (!rst) rst = {};
                rst[request.key] = request.value;
                setCache(request.cache_key, rst, request.expire, function(rst) {
                    sendResponse({ code: 200, data: rst, msg: 'success'});
                });
            });
            break;
        case 'delCache':
            delCache(request.cache_key);
            sendResponse({ code: 200, data: true, msg: 'success'});
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
function getApi(url, param, callback) {
    let init = {
        method: 'POST',
        headers: {
            'Content-Type':'application/x-www-form-urlencoded',
            'x-requested-with':'XMLHttpRequest'
        },
        body: Qs.stringify(param)
    };
    fetch(url, init).then(response => response.json()).then(data => {
        callback(data);
    }).catch((error) => {
        callback({ code: 500, msg: error.message});
    });
}