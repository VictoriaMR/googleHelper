var common_url = 'https://lmr.admin.cn/';
//公共方法
var HELPER = {
	//向背景脚本请求
	request: function(action, value, param, callback, cache_key) {
		chrome.runtime.sendMessage(this.getExtId(), {action: action, value: value, param: param, cache_key: cache_key},
			function(response) {
			if (callback) {
				callback(response);
			}
		});
	},
	getExtId: function() {
		return localStorage.getItem('crawer_chrome_runtime_id');
	},
	getData: function(callback) {
		this.request('request_api', 'common/getCrawerData', {}, function(res) {
			if (res && res.code == 200) {
				callback(res.data);
			} else {
				POP_PAGE.error_page('获取登录信息失败, 请刷新重试');
			}
		}, 'crawer_data_cache');
	},
	getCategory: function(callback) {
		this.getData(function(data) {
			callback(data.category);
		});
	},
	getVersion: function(callback) {
		this.getData(function(data) {
			callback(data.version);
		});
	},
	content_request: function(param) {
		window.postMessage(param, '*');
	}
};
function isNumber(str) {
	var rules = /^[0-9]+$/;
	if(!rules.exec(str)){
		return false;
	}
	return true;
}
//自定义页面
var POP_PAGE = {
	init: function() {
		var _this = this;
		HELPER.getVersion(function(version) {
			console.log(version, 'version')
			var head = document.getElementsByTagName('head')[0];
			var script = document.createElement('script');
			script.src = common_url+'crawer/crawer.js?version='+version;
			script.type = 'text/javascript';
			script.charset = 'utf-8';
			script.id = 'crawer_crawer_js';
			head.appendChild(script);
			script.onload=script.onreadystatechange=function() {
				var inpageCSS = common_url+'crawer/crawer.css?version='+version;
				var head = document.getElementsByTagName('head')[0];
				var link = document.createElement('link');
				link.href = inpageCSS;
				link.rel = 'stylesheet';
				link.type = 'text/css';
				link.id = 'crawer_crawer_css';
				head.appendChild(link);
				var baycheerbody = POP_PAGE.init_baycheerbody(true);
				if (domain == 'taobao.com') {
					baycheerbody.style['z-index'] = '100000099';
					baycheerbody.style.right = '45px';
				} else if (domain == 'tmall.com') {
					baycheerbody.style.right = '5px';
				}
				POP_PAGE.initContent();
			}
		});
	},
	initContent: function() {
		var baycheerbody = this.init_baycheerbody();
		var html = `<div class="userinfo-content">`;
					//重新刷新按钮
					html += `<div class="crawer-reload">
								<button onclick="POP_PAGE.reload_crawPage()">刷新</button>
								<button id="crawer-show-btn">展开</button>
							</div>`;
				html += `</div>`;
		baycheerbody.innerHTML += html;
		POP_PAGE.init_crawPage();
	},
	init_baycheerbody: function(empty) {
		var baycheerbody = document.getElementById('baycheerbody');
		if (baycheerbody === null) {
			var body = document.getElementsByTagName('body')[0];
			baycheerbody = document.createElement('div');
			baycheerbody.id = 'baycheerbody';
			body.appendChild(baycheerbody);
		}
		if (empty) {
			baycheerbody.innerHTML = '';
		}
		return baycheerbody;
	},
	reload_crawPage: function() {
		//删除缓存
		HELPER.request('delete_cache', '', {}, function() {
			document.getElementById('baycheer_helper_crawer_js').remove();
			document.getElementById('baycheer_helper_css').remove();
			window.postMessage({ type: "reload_page_js"}, "*");
			return;
		});
	},
	//错误信息
	error_page: function(msg) {
		var baycheerbody = this.init_baycheerbody();
		var html = `<a href="javascript:location.reload();" class="error-msg">`+msg+`</a>`;
		baycheerbody.innerHTML = html;
	},
	//页面爬取信息
	init_crawPage: function() {
		var _this = this;
		getCrawData(function(code, data, msg) {
			if (code === 0) {
				HELPER.getCategory(function(category) {
					_this.data = data;
					var baycheerbody = _this.init_baycheerbody();
					var crawerPage = document.getElementById('crawer-page');
					if (crawerPage === null) {
						var html = '<div id="crawer-page" style="max-height:'+(window.innerHeight - 130)+'px;display:none;"></div>';
						baycheerbody.innerHTML += html;
						crawerPage = document.getElementById('crawer-page')
					}
					if (data.sku) {
						var bc_site_id = localStorage.bc_site_id || '';
						html = '<form id="crawer_form">';
						html += `<div class="productAttLine">
									<div class="label">网站标识:</div>
									<div class="fillin">
										<input type="text" disabled="disabled" value="`+domain.replace('.com', '')+`" />
										<input type="hidden" name="bc_site_id" value="`+domain.replace('.com', '')+`" />
									</div>
									<div class="clear"></div>
								</div>
								<div class="productAttLine">
									<div class="label">产品ID:</div>
									<div class="fillin">
										<input type="text" disabled="disabled" value="`+data.item_id+`" />
										<input type="hidden" name="bc_product_id" value="`+data.item_id+`" />
									</div>
									<div class="clear"></div>
								</div>
								<div class="productAttLine">
									<div class="label">产品分类:</div>
									<div class="fillin">
										<select name="bc_product_category" id="bc_product_category">
											<option value="">请选择分类</option>
											`+_this.getCategoryHtml(category)+`
										</select>
									</div>
									<div class="clear"></div>
								</div>
								<div class="productAttLine">
									<div class="label">产品名称:</div>
									<div class="fillin">
										<input name="bc_product_name" disabled="disabled" value="`+data.name+`" />
									</div>
									<div class="clear"></div>
								</div>
								<div class="productAttLine">
									<div class="label">产品URL:</div>
									<div class="fillin">
										<input disabled="disabled" value="`+data.product_url+`" />
										<input type="hidden" name="bc_product_url" value="`+data.product_url+`" />
									</div>
									<div class="clear"></div>
								</div>`;
						if (data.attr) {
							for (var i in data.attr) {
								var attr_text = '';
								var count = 0;
								for (var j in data.attr[i].attrValue) {
									if (count > 0) {
										attr_text += ',';
									}
									attr_text += data.attr[i].attrValue[j].name;
									count ++;
								}
								html += `<div class="productAttLine">
											<div class="label">`+data.attr[i].attrName+`:</div>
											<input type="hidden" disabled="disabled" value="`+data.attr[i].attrName+`" name="bc_product_attr[`+i+`][name]"/>
											<div class="fillin">
												<input class="bc_product_name" disabled="disabled" value="`+attr_text+`" name="bc_product_attr[`+i+`][value]"/>
											</div>
											<div class="clear"></div>
										</div>`;
							}
						}
						if (data.multi_sku) {
							//sku
							html += `<div class="productAttLine">
										<div class="picTitle" style="margin-bottom: 0px;">SKU：</div>
										<div class="pdtPicHere">`;
							var count = 0;
							for (var i in data.sku) {
								html += `<div class="sku-item flex">
											<div class="cancel-btn" style="display:none;">x</div>
											<div class="flex w100">`;
								html += `<div class="sku_img">`;
								if (data.sku[i].sku_img) {
									html += `<img src="`+data.sku[i].sku_img+`">
											<input type="hidden" name="bc_sku[`+count+`][img]" value="`+data.sku[i].sku_img+`"/>`;
								}
								html += `</div>`;
								if (data.sku[i].pvs) {
									html += '<div class="flex1">';
									html += `<div class="flex">
												<div style="width:32px;">
												<span>属性:</span>
											</div>
											<div class="flex1 sku-attr">`;
												if (data.sku[i].pvs.length) {
													for (var j =0;j < data.sku[i].pvs.length; j++) {
														html += `<div>
																	<input disabled="disabled" name="bc_sku[`+count+`][attr][`+j+`][text]" value="`+data.sku[i].pvs[j].text+`"/>
																	<input type="hidden" name="bc_sku[`+count+`][attr][`+j+`][img]" value="`+data.sku[i].pvs[j].img+`"/>
																</div>`;
													}
												} else {
													for (var j in  data.sku[i].pvs) {
														html += `<div>
																	<input disabled="disabled" name="bc_sku[`+count+`][attr][`+j+`][text]" value="`+data.sku[i].pvs[j].text+`"/>
																	<input type="hidden" name="bc_sku[`+count+`][attr][`+j+`][img]" value="`+data.sku[i].pvs[j].img+`"/>
																</div>`;
													}
												}
									html += `</div></div>`;
								}
								html += `<div class="flex price-stock">
											<div style="margin-right: 12px;">价格: <input disabled="disabled" name="bc_sku[`+count+`][price]" value="`+data.sku[i].price+`"/></div>
											<div>库存: <input disabled="disabled" name="bc_sku[`+count+`][stock]" value="`+data.sku[i].stock+`"/></div>
										</div>
									</div>
								</div></div>`;
								count ++;
							}
							html += `</div></div>`;
						} else {
							html += `<div class="productAttLine">
										<div class="picTitle" style="margin-bottom: 0px;">SKU：</div>
										<div class="pdtPicHere">`;
							html += `<div class="sku-item flex">
										<div class="cancel-btn" style="display:none;">x</div>
										<div class="flex w100">`;
							html += `<div class="sku_img">`;
							if (data.sku.sku_img) {
								html += `<img src="`+data.sku.sku_img+`">
										<input type="hidden" name="bc_sku[0][img]" value="`+data.sku.sku_img+`"/>`;
							}
							html += `</div>`;
							if (data.sku.pvs) {
								html += '<div class="flex1">';
								html += `<div class="flex">
											<div style="width:32px;">
											<span>属性:</span>
										</div>
										<div class="flex1 sku-attr">`;
											if (data.sku.pvs.length) {
												for (var j =0;j < data.sku.pvs.length; j++) {
													html += `<div>
																<input disabled="disabled" name="bc_sku[`+count+`][attr][`+j+`][text]" value="`+data.sku.pvs[j].text+`"/>
																<input type="hidden" name="bc_sku[0][attr][`+j+`][img]" value="`+data.sku.pvs[j].img+`"/>
															</div>`;
												}
											} else {
												for (var j in  data.sku.pvs) {
													html += `<div>
																<input disabled="disabled" name="bc_sku[0][attr][`+j+`][text]" value="`+data.sku.pvs[j].text+`"/>
																<input type="hidden" name="bc_sku[0][attr][`+j+`][img]" value="`+data.sku.pvs[j].img+`"/>
															</div>`;
												}
											}
								html += `</div></div>`;
							}
							html += `<div class="flex price-stock">
										<div style="margin-right: 12px;">价格: <input disabled="disabled" name="bc_sku[0][price]" value="`+data.sku.price+`"/></div>
										<div>库存: <input disabled="disabled" name="bc_sku[0][stock]" value="`+data.sku.stock+`"/></div>
									</div>
								</div>
							</div></div>`;
							html += `</div></div>`;
						}
						if (data.pdt_picture) {
							html += `<div class="clear"></div>
									<div class="productMainPic">
										<div class="picTitle">产品图：</div>
										<div class="pdtPicHere" id="pdt_picture">
											<input type="hidden" name="bc_product_img" class="bc_product_picture" value="`+data.pdt_picture.join(',')+`"/>`;
							for (var i = 0; i < data.pdt_picture.length; i++) {
								html += `<img class="imgList" src="`+data.pdt_picture[i]+`" />`;
							}
							html += `</div>
									</div>`;
						}
						if (data.des_picture) {
							html += `<div class="clear"></div>
									<div class="productMainPic">
										<div class="picTitle">产品详情图：<span style="color:red;font-size:12px;"></span></div>
										<div class="pdtPicHere" id="pdt_desc_picture">
											<input type="hidden" name="bc_product_des_picture" class="bc_product_picture" value="`+data.des_picture.join(',')+`"/>`;
							for (var i = 0; i < data.des_picture.length; i++) {
								html += `<img class="imgList" src="`+data.des_picture[i]+`" />`;
							}
							html += `</div>
									</div>`;
						}
						html += '</form>';
						crawerPage.innerHTML = html;
						if (document.getElementById('postProduct-btn') === null) {
							html = `<div class="postProduct" id="postProduct-btn">上传产品</div>`;
							baycheerbody.innerHTML += html;
						}
						_this.init_crawpage_show(localStorage.crawpage_show_status);
						_this.init_click();
					} else {
						html = `<div class="tc">
									<a href="javascript:location.reload();" class="error-msg">获取产品信息失败, 请刷新重试</a>
								</div>`;
						baycheerbody.innerHTML += html;
					}
				});
			} else {
				POP_PAGE.error_page(msg);
			}
		});
	},
	init_crawpage_show: function(status) {
		if (status === '1') {
			document.getElementById('crawer-page').style.display = 'block';
			document.getElementById('crawer-show-btn').innerHTML = '收起';
		} else {
			document.getElementById('crawer-page').style.display = 'none';
			document.getElementById('crawer-show-btn').innerHTML = '展开';
		}
	},
	getCategoryHtml: function(category) {
		var html = '';
		for (var i=0;i<category.length;i++) {
			var padding = '';
			for (var j = 0; j < category[i].level; j++) {
				padding += '&nbsp;&nbsp;&nbsp;';
			}
			var disabled = '';
			if (category[i].level == 0) {
				disabled = 'disabled="disabled"';
			}
			html += '<option '+disabled+' value="'+category[i].cate_id+'">'+padding+category[i].name+'</option>';
		}
		return html;
	},
	init_click: function() {
		var _this = this;
		//上传产品按钮
		document.getElementById('postProduct-btn').onclick = function () {
			if (this.className.indexOf('loading') !== -1) {
				return false;
			}
			var param = POP_PAGE.serializeForm(document.getElementById('crawer_form'));
			if (param.bc_product_category == '') {
				alert('请先选择分类');
				return false;
			}
			if (param.bc_product_name == '') {
				alert('上传产品名称不能为空');
				return false;
			}
			var obj = document.getElementsByClassName('sku-item');
			if (!obj || !obj.length) {
				alert('没有有效产品SKU');
				return false;
			}
			if(!param.bc_product_img) {
				alert('没有有效产品图片');
				return false;
			}
			this.innerHTML = '数据发送中...';
			this.classList.add('loading');
			var _thisobj = this;
			var temp_param = {};
			temp_param.form_page = {bc_product_category: param.bc_product_category, bc_site_id: param.bc_site_id};
			temp_param.form_crawer = _this.data;
			HELPER.request('request_api', 'product/create', temp_param, function(res) {
				_thisobj.classList.remove('loading');
				_thisobj.innerHTML = '上传产品';
				console.log(res, 'res')
			});
		}
		//图片按钮点击删除
		var obj = document.getElementById('pdt_picture');
		if (obj) {
			tobj = obj.getElementsByTagName('img');
			for (var i = 0; i < tobj.length; i++) {
				tobj[i].onclick = function(event) {
					this.parentNode.removeChild(this)
					POP_PAGE.initPdtImgValue(obj);
				}
			}
		}
		//图片介绍图
		var obj = document.getElementById('pdt_desc_picture');
		if (obj) {
			tobj = obj.getElementsByTagName('img');
			for (var i = 0; i < tobj.length; i++) {
				tobj[i].onclick = function(event) {
					this.parentNode.removeChild(this)
					POP_PAGE.initPdtImgValue(obj);
				}
			}
		}
		// sku 点击删除
		var skuCancelObj = document.getElementsByClassName('cancel-btn');
		if (skuCancelObj) {
			for (var i = 0; i < skuCancelObj.length; i++) {
				skuCancelObj[i].onclick = function(event) {
					this.parentNode.remove();
				}
			}
		}
		//展开/关闭详情
		document.getElementById('crawer-show-btn').onclick = function() {
			if (localStorage.crawpage_show_status === '1') {
				localStorage.crawpage_show_status = '0';
				this.innerHTML = '展开';
				var status = '0';
			} else {
				localStorage.crawpage_show_status = '1';
				this.innerHTML = '收起';
				var status = '1';
			}
			POP_PAGE.init_crawpage_show(status);
		}
	},
	serializeForm: function(formobj) {
		var formData = new FormData(formobj);
		return Object.fromEntries(formData.entries());
	},
	initPdtImgValue: function(pobj) {
		var imgValueObj = pobj.querySelectorAll('.bc_product_picture')[0];
		if (imgValueObj === null) {
			pobj.innerHTML += '<input type="hidden" name="bc_product_img" class="bc_product_picture" value=""/>';
			imgValueObj = pobj.getElementsByClassName('bc_product_picture')[0];
		}
		var imgobj = pobj.getElementsByTagName('img');
		var value = '';
		for (var i = 0; i < imgobj.length; i++) {
			if (i > 0) {
				value += ',';
			}
			value += imgobj[i].src;
		}
		imgValueObj.value = value;
	}
};
POP_PAGE.init();