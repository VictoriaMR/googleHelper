$(function(){
    //爬取页面数据开关
    var switch_status = localStorage.getItem('switch_status');
    if (switch_status === null) {
        switch_status = '0';
        localStorage.setItem('switch_status', '0');
    }
    var switchpObj = $('#switch-p');
    var switchsObj = $('#switch-s');
    init_switch(switch_status);
    switchpObj.click(function(){
        var switch_status = '0';
        if ($(this).hasClass('close')) {
            switch_status = '1';
        }
        init_switch(switch_status);
    });
    function init_switch(switch_status) {
        if (switch_status === '0') {
            switchpObj.removeClass('open').addClass('close');
            switchsObj.removeClass('open').addClass('close');
        } else {
            switchpObj.removeClass('close').addClass('open');
            switchsObj.removeClass('close').addClass('open');
        }
        localStorage.setItem('switch_status', switch_status);
    }
});