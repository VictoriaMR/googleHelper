// 缓存时间
const expireTime = 60 * 60;
// 获取缓存
const getCache = async(key) => {
    let data = await chrome.storage.local.get([key]);
    data = data[key] ? data[key] : false;
    if (data) {
        if (data.expire != -1 && parseInt(data.expire) <= getTime()) {
            await delCache(key);
            return false;
        }
        data = data.content;
    }
    return data;
}
// 删除缓存
const delCache = async(key) => {
    if (key) {
        return await chrome.storage.local.remove([key]);
    }
    return false;
}
// 设置缓存
const setCache = async(key, value, expire) => {
    if (expire == -1) {
    } else if (expire) {
        expire = getTime() + expire;
    } else {
        expire = getTime() + expireTime;
    }
    let data = {};
    data[key] = {expire: expire, content: value};
    return await chrome.storage.local.set(data);
}
// 获取当前时间
const getTime = () => {
    return parseInt(new Date().getTime() / 1000);
}