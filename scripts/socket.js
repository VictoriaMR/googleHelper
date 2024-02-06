// webSocket
let socketObj;
let socketConfig;
let ioPingHandler;
// 初始化socket
const socketInit = async(sender) => {
    return await socketConnect(sender);
}
// 链接socket
const socketConnect = async(sender) => {
    //已经链接
    if (socketObj && socketObj.readyState == 1) {
        return false;
    }
    socketConfig = await getCache('baycheerhelper_auto_robot_set_config');
    if (!socketConfig) {
        await listenerEvent({action: 'alert', value: '请先确认配置, 点击确认开始连接'}, sender);
        return false;
    }
    let t = await strRandom(7);
    let baseUrl = domain+':12002/socket.io/?EIO=3&transport=polling&t='+t;
    let res = await ioConnect(baseUrl, sender);
    if (res) {
        // WebSocket 实例
        let url = res.replace('http', 'ws').replace('transport=polling', 'transport=websocket');
        url = await replaceT(url);
        socketObj = new WebSocket(url);
        // 连接完成
        socketObj.onopen = function(e) {
            console.log('连接完成')
            ioSend('2probe');
        };
        // 接收信息
        socketObj.onmessage = function(e) {
            if (e.data == '3probe') {
                ioSend('5');
                startIoPing();
            } else {
                dealMessage(e.data, sender);
            }
        };
        // 关闭
        socketObj.onclose = function(event) {
            console.log('连接已断开, 准备重新连接')
            clearInterval(ioPingHandler);
            setTimeout(function(){
                socketConnect(sender);
            }, 2000+Math.random()*10000);
        };
        // 错误
        socketObj.onerror = function(error) {
            console.log(`[error] ${error.message}`);
        };
    }
}
// 申请IO
const ioConnect = async(url, sender, callback) => {
    console.log('连接开始');
    let res = await getApi(url, {}, 'GET', 'text');
    if (typeof res == 'object') {
        await sleepTime(2000+Math.random()*10000);
        await socketConnect(sender);
        return false;
    } else {
        res = res.match(/{.+}/);
        if (res && res[0]) {
            res = JSON.parse(res[0]);
            if (res.sid) {
                url += '&sid='+res.sid;
                await sleepTime(1000+Math.random()*1000);
                return await ioConnectConfirm(url);
            }
        }
        await sleepTime(2000+Math.random()*10000);
        await socketConnect(sender);
        return false;
    }
}
// 链接确认
const ioConnectConfirm = async(url) => {
    console.log('确认链接');
    url = await replaceT(url, 1);
    await getApi(url, {}, 'GET', 'text');
    return ioRegister(url);
}
// 链接注册
const ioRegister = async(url) => {
    url = await replaceT(url, 2);
    console.log('注册开始');
    const uuid = await getCache('uuid');
    const data = await taskData();
    let param = new Array();
    param.push('bayHelperRegister');
    param.push({uuid: uuid, config: socketConfig, is_free: data ? 0 : 1});
    await getApi(url, '91:42'+JSON.stringify(param), 'POST', 'text');
    return await ioRegisted(url);
}
// 注册完成
const ioRegisted = async(url) => {
    console.log('注册完成');
    url = await replaceT(url, 2);
    await getApi(url, {},  'GET', 'text');
    return url;
}
// 发送类型消息
const ioSendMessage = async(type, data) => {
    let param = new Array();
    param.push(type);
    param.push(data);
    return await ioSend('42'+JSON.stringify(param));
}
// 发送消息
const ioSend = async(msg) => {
    if (socketObj && socketObj.readyState == 1) {
        socketObj.send(msg);
        return true;
    }
    return false;
}
// 维护心跳
const startIoPing = async() => {
    console.log('维护心跳开始');
    clearInterval(ioPingHandler);
    ioPingHandler = setInterval(function() {
        ioPing();
    }, 25000);
}
// 发送心跳
const ioPing = async() => {
    await ioSendMessage('ioPing', 'Ping');
    await ioSend('2');
}
const dealMessage = async(msg, sender) => {
    if (msg && msg.substr(0, 2) == '42') {
        const data = JSON.parse(msg.substr(2));
        if (data.length) {
            switch (data[0]) {
                case 'ioPong': //心跳响应
                    break;
                case 'autoDeal': //接收任务请求
                    await taskData(data[1]);
                    let tab = await checkSender(sender);
                    if (tab) {
                        chrome.tabs.sendMessage(tab.id, data[1]);
                    }
                    break;
                case 'dealSuccess': //任务处理成功
                    await delCache('baycheerhelper_auto_robot_autodeal_data');
                    break;
                case 'dealFailed': //任务处理失败
                    console.log('任务处理失败', msg);
                    break;
            }
        }
    }
}
// 设置任务处理数据缓存
const taskData = async(data) => {
    if (data) {
        return await setCache('baycheerhelper_auto_robot_autodeal_data', data, -1);
    } else {
        return await getCache('baycheerhelper_auto_robot_autodeal_data');
    }
}
// 更新参数
const updateSocketConfig = async() => {
    const config = await getCache('baycheerhelper_auto_robot_set_config');
    return await ioSendMessage('bayHelperUpdate', {config: config});
}
// 关闭链接
const socketClose = async() => {
    if (socketObj && socketObj.readyState == 1) {
        socketObj.close();
    }
    return true;
}
// 获取socket信息
const getSocketInfo = async() => {
    let status = 0;
    let info = {};
    if (socketObj && socketObj.readyState == 1) {
        status = 1;
        info = await taskData();
        if (info) {
            status = 2;
        } else {
            info = {};
        }
    }
    info.status = status;
    switch (info.status) {
        case 0:
            info.statusText = '未连接';
            break;
        case 1:
            info.statusText = '连接中';
            break;
        case 2:
            info.statusText = '处理任务中';
            break;
    }
    return info;
}
// 处理任务成功
const dealSuccess = async(data) => {
    const taskInfo = await taskData();
    return await ioSendMessage('bayHelperDealResult', {result: data, taskData: taskInfo, status: 1, remark: '处理成功'});
}
// 处理任务失败
const dealFailed = async(data) => {
    const taskInfo = await taskData();
    return await ioSendMessage('bayHelperDealResult', {result: data, taskData: taskInfo, status: 0, remark: '处理失败'});
}
// 等待时间
const sleepTime = async(time) => {
    return new Promise((resolve) => {
        setTimeout(resolve, time)
    });
}
// 随机字符串
const strRandom = async(len) => {
    let keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let str='';
    let keyLen = keyStr.length-1;
    for (let i=0; i<len; ++i) {
        str += keyStr.charAt(Math.random() * keyLen);
    }
    return str;
}
// 替换字符串
const replaceT = async(url, len) => {
    let t = '';
    if (len) {
        t = url.match(/(?<=(&t=))([^&]*)(?=&|$)/);
        if (t && t[0]) {
            let tmpT = await strRandom(len);
            t = t[0].substr(0, t[0].length-len)+tmpT;
        }
    }
    return url.replace(/&t=([^&]*)(?=&|$)/, t?'&t='+t:t);
}