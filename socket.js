const HELPERSOCKET = {
	init: function(type) {
		const config = getCache('helper_all_data_cache');
		//未配置则不生效
		if (!config) {
			bgAlert('无配置数据');
			return false;
		}
		let _this = this;
		if (_this.ioLoginSign) {
			return;
		}
		_this.type = type;
		_this.ioLoginSign = false;
		//实例
		_this.socket = io((config.socket_ssl?'https':'http')+'://'+config.socket_domain+':'+config.socket_port);
		//登录
		_this.socket.on('connect', function(){
			console.log('服务器链接成功');
			_this.ioLogin();
		});
		//登录回馈
		_this.socket.on('loginSuccess', function(e) {
			console.log('注册成功');
			_this.ioLoginSign = true;
			_this.ioPing();
		});
		//心跳接收
		_this.socket.on('ioPong', function(e) {});
		//服务器退出
		_this.socket.on('disconnect', function() {
			_this.ioLoginSign = false;
			console.log('服务器断开链接');
		});
		//接收处理请求
		_this.socket.on('reload', function(e) {
			if (e === '') {
				bgAlert('处理请求参数错误');
				return;
			}
			//url刷新页面
			chrome.tabs.query({}, function(tabArray){
				chrome.tabs.update(tabArray[0].id, { url: e.url });
			});
		});
	},
	ioLogin: function() {
		//获取uuid
		const uuid = getCache('uuid');
		let is_free = 1;
		if (this.type === 'auto_check') {
			if (getCache('helper_auto_check_data')) {
				is_free = 0;
			}
		}
		this.sendMessage('login', {uuid: uuid, type: this.type, is_free: is_free});
	},
	sendMessage: function(type, data) {
		return this.socket.emit(type, data);
	},
	ioPing: function() {
		let _this = this;
		clearInterval(_this.ioPingHandler);
		_this.ioPingHandler = setInterval(function() {
			if(_this.ioLoginSign) {
				_this.sendMessage('ioPing', 'ping');
			} else {
				clearInterval(_this.ioPingHandler);
			}
		}, 20000);
	},
	ioLogout: function(type) {
		if (this.ioLoginSign && type === this.type) {
			this.sendMessage('logout');
		}
	},
	set: function(param) {
		if (this.ioLoginSign) {
			this.sendMessage('update', param);
		}
	},
};