$(function(){
	//按钮初始化
	const bg = chrome.extension.getBackgroundPage();
	//数据初始化
	bg.listenerResponse({action: 'request', value: 'api/getHelperFunction', cache_key: 'helper_function_data_cache'}, function(res) {
		if (res.code === '200') {
			if (res.data) {
				const func = res.data;
				let html = '';
				for (let i=0;i<func.length;i++) {
					html += '<div class="setting-content">\
								<label class="setting-title">'+func[i].title+'</label>\
								<div class="switch-p close" id="'+func[i].name+'_switch_status">\
									<div class="switch-s close"></div>\
								</div>\
							</div>';
				}
				$('#function-content').html(html);
				//按钮初始化
				$('#function-content .switch-p').each(function(){
					const name = $(this).attr('id');
					let status = bg.getCache(name);
					if (!status) {
						status = '0';
					}
					init_switch(name, status);
				});
			}
		}
	});
	//按钮初始化方法
	function init_switch(key, switch_status) {
		const obj = $('#'+key);
		if (switch_status === '0') {
			obj.removeClass('open').addClass('close').find('.switch-s').removeClass('open').addClass('close');
		} else {
			obj.removeClass('close').addClass('open').find('.switch-s').removeClass('close').addClass('open');
		}
		bg.setCache(key, switch_status, -1);
	}
	$('#function-content').on('click', '.switch-p', function(){
		const key = $(this).attr('id');
		const status = $(this).hasClass('open') ? '0' : '1';
		init_switch(key, status, true);
		chrome.tabs.reload();
	});
});