//引入页面静态文件
chrome.runtime.sendMessage(localStorage.getItem('baycheerhelper_extid'), {action: 'getUrl'}, function(res){
    if (res.code == 200) {
        let script = document.createElement('script');
        script.src = res.data+'helper/init.js'+(res.version?'?v='+res.version:'');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.id = 'helper-init-js';
        document.querySelector('head').appendChild(script);
    }
});