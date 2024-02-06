if (location.hostname.indexOf('login') < 0) {
    //设置监听事件
    window.customerAjaxRespone = new Array();
    //设置全局数据储存
    const setCustomerAjaxRespone = async(data) => {
        if (data && typeof data != 'object') {
            data = data.match(/{.+}/);
            if (data && data[0]) {
                data = JSON.parse(data[0]);
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
            // realXHR.addEventListener('abort', function(){ajaxEventTrigger.call(this, 'ajaxAbort');}, false);
            // realXHR.addEventListener('error', function(){ajaxEventTrigger.call(this, 'ajaxError');}, false);
            // realXHR.addEventListener('load', function(){ajaxEventTrigger.call(this, 'ajaxLoad');}, false);
            // realXHR.addEventListener('loadstart', function(){ajaxEventTrigger.call(this, 'ajaxLoadStart');}, false);
            // realXHR.addEventListener('progress', function(){ajaxEventTrigger.call(this, 'ajaxProgress');}, false);
            // realXHR.addEventListener('timeout', function(){ajaxEventTrigger.call(this, 'ajaxTimeout');}, false);
            realXHR.addEventListener('loadend', function(){ajaxEventTrigger.call(this, 'ajaxLoadEnd');}, false);
            // realXHR.addEventListener('readystatechange', function(){ajaxEventTrigger.call(this, 'ajaxReadyStateChange');}, false);
            return realXHR;
        }
        window.XMLHttpRequest = newXHR;
        window.addEventListener('ajaxLoadEnd', function (e) {
            if (e && e.detail && e.detail.responseText) {
                setCustomerAjaxRespone(e.detail.responseText);
            }
        });
    })();
    // jsonp监听事件
    ;(function () {
        var originalCreateElement = document.createElement;
        function changeReqLink (script) {
            let src = script.src;
            Object.defineProperty(script, 'src', {
                get: function () {
                    return src;
                },
                set: function (oSrc) {
                    src = oSrc;
                    script.setAttribute('src', oSrc);
                }
            });
            const originalSetAttribute = script.setAttribute;
            script.setAttribute = function () {
                const args = Array.prototype.slice.call(arguments);
                if (args[0] == 'src') {
                    const tmpMatch = args[1].match(/(?<=(callback=))([^&]*)(?=&|$)/);
                    if (tmpMatch && tmpMatch[0]) {
                        listenerObjChange(tmpMatch[0]);
                    }
                }
                originalSetAttribute.call(script, ...args);
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
                        if (typeof newVal == 'function') {
                            const oldVal = newVal;
                            newVal = function(data) {
                                setCustomerAjaxRespone(data);
                                oldVal(data);
                            }
                        }
                        val = newVal;
                    },
                    enumerable : true,
                    configurable : true
                });
            }
        }
    })();
}