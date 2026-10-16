if (location.hostname.indexOf('login') < 0) {
    //设置监听事件
    window.customerAjaxRespone = new Array();
    //设置全局数据储存
    const setCustomerAjaxRespone = async(data) => {
        if (data && typeof data != 'object') {
            data = String(data).match(/\{[\s\S]+\}/);
            if (data && data[0]) {
                try {
                    data = JSON.parse(data[0]);
                } catch (e) {
                    data = null;
                }
            }
        }
        data && JSON.stringify(data) != '{}' && window.customerAjaxRespone.push(data);
    }
    // ajax监听事件
    ;(function () {
        if (typeof window.CustomEvent === 'function') return false;
        function CustomEvent(event, params) {
            params = params || {bubbles: false, cancelable: false, detail: undefined};
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
    })();
    ;(function () {
        function ajaxEventTrigger(event) {
            window.dispatchEvent(new CustomEvent(event, {detail: this}));
        }
        var oldXHR = window.XMLHttpRequest;
        function newXHR() {
            var realXHR = new oldXHR();
            realXHR.addEventListener('loadend', function(){ajaxEventTrigger.call(this, 'ajaxLoadEnd');}, false);
            return realXHR;
        }
        window.XMLHttpRequest = newXHR;
        window.addEventListener('ajaxLoadEnd', function (e) {
            if (e && e.detail && e.detail.responseText) {
                setCustomerAjaxRespone(e.detail.responseText);
            }
        });
        if (typeof window.fetch === 'function') {
            const originalFetch = window.fetch;
            window.fetch = function() {
                return originalFetch.apply(this, arguments).then(response => {
                    const clone = response.clone();
                    clone.text().then(data => {
                        setCustomerAjaxRespone(data);
                    }).catch(() => {});
                    return response;
                });
            };
        }
    })();
    // jsonp监听事件
    ;(function () {
        var originalCreateElement = document.createElement;
        function changeReqLink (script) {
            const desc = Object.getOwnPropertyDescriptor(script, 'src');
            if (!desc || desc.configurable) {
                let src = script.src;
                Object.defineProperty(script, 'src', {
                    get: function () {
                        return src || script.getAttribute('src') || '';
                    },
                    set: function (oSrc) {
                        src = oSrc;
                        script.setAttribute('src', oSrc);
                    },
                    enumerable: true,
                    configurable: true
                });
            }
            const originalSetAttribute = script.setAttribute;
            script.setAttribute = function () {
                const args = Array.prototype.slice.call(arguments);
                if (args[0] == 'src' && args[1]) {
                    const tmpMatch = String(args[1]).match(/(?<=(callback=))([^&]*)(?=&|$)/);
                    if (tmpMatch && tmpMatch[0]) {
                        listenerObjChange(tmpMatch[0]);
                    }
                }
                return originalSetAttribute.call(script, ...args);
            }
        }
        // 创建标签监听
        document.createElement = function (tagName) {
            const dom = originalCreateElement.call(document, tagName);
            if (tagName.toLowerCase() == 'script') {
                changeReqLink(dom);
            }
            return dom;
        }
        // 监听方式
        function listenerObjChange(name) {
            if (typeof window[name] === 'undefined') {
                let val = window[name];
                Object.defineProperty(window, name, {
                    get : function(){
                        return val;
                    },
                    set : function(newVal){
                        if (typeof newVal == 'function' && !newVal.__hooked) {
                            const oldVal = newVal;
                            newVal = function(data) {
                                setCustomerAjaxRespone(data);
                                return oldVal.apply(this, arguments);
                            };
                            newVal.__hooked = true;
                        }
                        val = newVal;
                    },
                    enumerable : true,
                    configurable : true
                });
            } else if (typeof window[name] === 'function' && !window[name].__hooked) {
                const oldVal = window[name];
                const wrapped = function(data) {
                    setCustomerAjaxRespone(data);
                    return oldVal.apply(this, arguments);
                };
                wrapped.__hooked = true;
                window[name] = wrapped;
            }
        }
    })();
}