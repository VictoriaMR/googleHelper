//扩展内通信
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		listenerResponse(request, sendResponse);
	}
);
function listenerResponse(request, sendResponse) {
	switch(request.action) {
		case 'setNxUuid':
			let uuid = cache.get('uuid');
			console.log(uuid, 'uuid')
			// if (!uuid) {
			// 	uuid = randString(32);
			// }
			// cache.set('uuid', uuid, -1);
			// sendResponse({code:200, data: uuid, msg:'获取成功'});
			break;
	}
}

//生成唯一ID字符串
function randString(len) {
	let arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
	let str = '';
	for (let i=0; i<len; ++i) {
		str += arr[Math.round(Math.random()*(arr.length-1))];
	}
	return str;
}

function async2await(callback, args = []) {
    return () => {
        return new Promise((resolve, reject) => {
            args.push(resolve, reject)
            callback(...args)
        })
    }
}
async function cacheGet(key, resolve=()=>{}, reject=()=>{}) {
	chrome.storage.local.get(key).then((result) => {
		resolve('123123')
	});
}

const cache = {
    get: async function(key) {
        return await async2await(cacheGet, [key])()
    },
    set: async function(key, value, expire) {
		if (expire != -1) {
			expire = this.getTime() + expire;
		}
		const data = {expire:expire, content:value};
        return await async2await(cacheSet, [key, data])()
    },
    del: async function(key) {
        return await async2await(cacheDel, [key])()
    },
    clear: async function () {
        return await async2await(cacheClear)()
    },
    getTime: function() {
		return parseInt(new Date().getTime() / 1000);
	}
};
async function cacheSet(key, value, resolve = () => { }, reject = () => { }) {
    try {
        if (!key) {
            console.error("session key can't null")
            reject()
            return false
        }
        chrome.storage.local.set({
            [key]: value,
        }, function (res) {
            let error = chrome.runtime.lastError;
            if (error) {
                console.warn(JSON.stringify(error));
                reject(JSON.stringify(error))
            }
            resolve(res)
        })
    } catch (e) {
        reject(e)
    }
}
// console.log('here', 'here')
// let key = 'key';
// let value = 'value';
// chrome.storage.local.set({ key: value }).then(() => {
//   console.log("Value is set to " + value);
// });

// chrome.storage.local.get(key).then((result) => {
//   console.log("Value currently is " + result.key);
// });
function setCache(key, value, expire) {

}
function getCache(key) {
	chrome.storage.local.get(key).then(result=>{
		return result;
	});
}
//api请求
function getApi(url, param, callback, type) {
	let init = {};
	if (type == 'GET') {
		let strArr = new Array();
		for (let i in param) {
			strArr.push(i+'='+param[i]);
		}
		if (strArr.length > 0) {
			url += url + '?'+strArr.join('&');
		}
	} else {
		let formData = new FormData();
		for (let i in param) {
			formData.append(i, param[i]);
		}
		init.method = 'POST';
		init.body = formData;
	}
	fetch(url, init)
	.then(response => response.json())
	.then(data => {
		callback(data);
		return false;
	})
	.catch((error) => {
		callback({code:500, msg: error.message});
		return false;
	});
}
