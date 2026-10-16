importScripts('./qs.js');
const getApi = async (url, param, callback, type, dataType, headers) => {
	type = type ? type : 'POST';
	dataType = dataType ? dataType : 'json';
    let init = {
        credentials: 'include',
        method: type,
        headers: {},
    };
    if (type == 'GET') {
        if (typeof param == 'object') {
        	let strArr = new Array();
            for (let i in param) {
                strArr.push(i + '=' + param[i]);
            }
            param = strArr.join('&');
        }
        if (param) {
        	url += '?' + param;
        }
    } else {
        init.headers = {
            'Content-Type':'application/x-www-form-urlencoded',
            'x-requested-with':'XMLHttpRequest'
        };
        init.body = typeof param == 'object' ? Qs.stringify(param) : param;
    }
    if (headers) {
        for (var i in headers) {
            init.headers[i] = headers[i]
        }
    }
    try {
        const response = await fetch(url, init);
        if (response.ok) {
            try {
                return await response[dataType]();
            } catch(e) {
                return {code: 0, data: '', msg: '响应解析失败: ' + e};
            }
        }
        return {code: response.status, data: '', msg: '请求失败, ' + response.status + ': ' + response.statusText};
    } catch (e) {
        return {code: 0, data: '', msg: '网络请求失败: ' + e.message};
    }
}