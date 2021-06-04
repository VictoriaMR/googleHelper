$(function(){
    //按钮初始化
    const switchObj = $('.switch-p');
    switchObj.each(function(){
        const name = $(this).attr('id');
        let status = localStorage.getItem(name);
        if (status === null) {
            status = '0';
        }
        init_switch(name, status);
    });

    //按钮初始化方法
    function init_switch(key, switch_status) {
        const obj = $('#'+key);
        if (switch_status === '0') {
            obj.removeClass('open').addClass('close').find('.switch-s').removeClass('open').addClass('close');
        } else {
            obj.removeClass('close').addClass('open').find('.switch-s').removeClass('close').addClass('open');
        }
        localStorage.setItem(key, switch_status);
        if (switch_status === '1') {
            chrome.tabs.reload(); //刷新当前页面
        }
    }
    switchObj.on('click', function(){
        const key = $(this).attr('id');
        //自动化机器人按钮动作时清除账户设置
        const status = $(this).hasClass('open') ? '0' : '1';
        init_switch(key, status, true);
    });
});