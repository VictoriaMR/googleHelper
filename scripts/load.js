//引入页面静态文件
chrome.runtime.sendMessage(localStorage.getItem('helper_extid'), {action: 'getCache', cache_key: 'helper_action_status'}, function(res){
    if (res.data) {
        for (let i in res.data) {
            if (res.data[i] == 1) {
                chrome.runtime.sendMessage(localStorage.getItem('helper_extid'), {action: 'getUrl'}, function(res){
                    if (res.code == 200) {
                        let script = document.createElement('script');
                        script.src = res.data+'helper/init.js'+(res.version?'?v='+res.version:'');
                        script.type = 'text/javascript';
                        script.charset = 'utf-8';
                        script.id = 'helper-init-js';
                        document.querySelector('head').appendChild(script);
                    }
                });
                break;
            }
        }
    }
});