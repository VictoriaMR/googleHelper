chrome.runtime.sendMessage(localStorage.getItem('helper_extid'), {action: 'getUrl'}, function(res){
    if (res.code) {
        let script = document.createElement('script');
        script.src = res.data+'computer/helper/init.js'+(res.version?'?v='+res.version:'');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.id = 'helper-init-js';
        document.querySelector('head').appendChild(script);
    }
});