domain = false;
current_url = location.href;
current_host = location.host;
if (current_host.indexOf('1688.com') >= 0) {  // 阿里巴巴产品页面
    domain = '1688.com';
}
if (current_host.indexOf('taobao.com') >= 0) {  // 淘宝产品页面
    domain = 'taobao.com';
}
if (current_host.indexOf('tmall.com') >= 0) {  // 天猫产品页面
    domain = 'tmall.com';
}
/*
*callback function (code,data,msg){} //code=0 获取成功 获取的数据存在data中 {sku:sku,attr:attr,multi_sku:multi_sku,name:name,product_url: location.href,pdt_picture:pdt_picture}
* */
function getCrawData(callback) {
    let item_id=isItemPage();
    if (domain && item_id) {
        switch (domain) {
            case '1688.com':
                get1688(callback);
                break;
            case 'taobao.com':
                getTaobao(callback);
                break;
            case 'tmall.com':
                getTmall(callback);
                break;
        }
    }else{
        callback(2,{},'非产品详情页!');
    }
}
//校验是否为产品详情页
//url 当前链接 domain
function isItemPage(){
    let ret=false;
    let url=location.origin+location.pathname;
    switch (domain) {
        case '1688.com':
            let reg=/^https\:\/\/detail\.1688\.com\/offer\/(\d+)\.html(?:.)*/i;
            ret=url.match(reg);
            if(ret){
                ret=ret[1];
            }
            break;
        case 'taobao.com':
            if(url=='https://item.taobao.com/item.htm'){
                ret=getIdFromStr(location.search);
            }
            break;
        case 'tmall.com':
            if(url=='https://detail.tmall.com/item.htm'){
                ret=getIdFromStr(location.search);
            }
            break;
    }
    if(ret){
        return ret;
    }else{
        return false;
    }
}
//str为?key1=val1&key2=val2&...
function getIdFromStr(str){
    str=str.substring(1);//去掉?
    let param=str.split('&');//以&切割
    for(let k in param){
        if(param[k].substring(0,3)=='id='){
            return param[k].substring(3);
        }
    }
    return false;
}
function getTaobao(callback){
    if (typeof Hub === 'undefined') {
        callback(1,{},'获取数据失败!请记录当前链接联系开发人员.');
        return false;
    }
    let multi_sku=0;
    let name = getTaobaoProductName();
    let pdt_picture = getTaobaoPdtPicture();
    let skuDomList=document.querySelectorAll('.J_Prop');
    let attr={};
    let sku={};
    if(Hub.config.config.sku.valItemInfo.skuMap){
        //多sku产品
        multi_sku=1;
        for(let k=0;k<skuDomList.length;k++){
            let attrName=skuDomList[k].getElementsByTagName('dt')[0].innerText;//属性名
            let attrValue={};
            let valueList=skuDomList[k].getElementsByTagName('dd')[0].getElementsByTagName('li');//属性名
            let attrNameId=0;
            for(let j=0;j<valueList.length;j++){
                let value=valueList[j].attributes['data-value'].nodeValue.split(':');
                if(!attrNameId){
                    attrNameId=value[0];
                }
                let img='';
                if(typeof valueList[j].children[0].attributes['style']!=='undefined'){
                    let styleText=valueList[j].children[0].attributes['style'].nodeValue;
                    img=styleText.match(/background\:url\(((.+))_30x30/)[1];
                }
                attrValue[value[1]]={name:valueList[j].children[0].children[0].innerText,img:img};
            }
            attr[attrNameId]={attrName:attrName,attrValue:attrValue};
        }
        for(let k in Hub.config.config.sku.valItemInfo.skuMap){
            let item=Hub.config.config.sku.valItemInfo.skuMap[k];
            let stock;
            if(typeof g_config.dynStock.sku[k] =='undefined'){
                continue;
            }
            stock=g_config.dynStock.sku[k].stock;
            let attr_arr=k.substr(1,k.length-2).split(';');
            let pvs={};
            let sku_img='';
            for(let i in attr_arr){
                let attr_item=attr_arr[i].split(':');
                if(!attr[attr_item[0]]||!attr[attr_item[0]]['attrValue'][attr_item[1]]){
                    continue;
                }
                if(attr[attr_item[0]]['attrValue'][attr_item[1]].img){
                    sku_img=attr[attr_item[0]]['attrValue'][attr_item[1]].img;
                }
                pvs[attr[attr_item[0]].attrName]={text:attr[attr_item[0]]['attrValue'][attr_item[1]].name,img:sku_img};
            }
            let price;
            if(typeof g_config.promotion.promoData !='undefined' && typeof g_config.promotion.promoData[k] !='undefined'){
                price=g_config.promotion.promoData[k][0].price;
            }else{
                price=g_config.originalPrice[k].price;
            }
            sku[item.skuId]={pvs:pvs,price:price,stock:stock,sku_img:sku_img};
        }
    }else{
        sku={price:g_config.price,stock:g_config.dynStock.stock};
    }
    let ret_data={sku:sku,attr:attr,name:name,pdt_picture:pdt_picture,multi_sku:multi_sku,product_url: location.href,item_id:isItemPage()};
    let supplier_data=getTaobaoSupplier();
    for(let i in supplier_data){
        ret_data[i]=supplier_data[i];
    }
    //发起请求在请求内容中提取图片
    getTaobaoDesPic(callback,ret_data);
}
function get1688(callback){
    if (typeof iDetailData === 'undefined') {
        callback(1,{},'获取数据失败!请记录当前链接联系开发人员.');
        return false;
    }
    let multi_sku=0;
    let name = get1688ProductName();
    let pdt_picture = get1688PdtPicture();
    let attr={};
    let sku={};
    if(typeof iDetailData.sku !='undefined'){
        multi_sku = 1;
        let skuProp=iDetailData.sku.skuProps;
        for(let attrNameId=0;attrNameId<skuProp.length;attrNameId++){
            let attrName=skuProp[attrNameId].prop;
            let attrValue={};
            for(let attrValueId=0;attrValueId<skuProp[attrNameId].value.length;attrValueId++){
                let img='';
                if(typeof skuProp[attrNameId].value[attrValueId].imageUrl!='undefined' &&skuProp[attrNameId].value[attrValueId].imageUrl){
                    img=skuProp[attrNameId].value[attrValueId].imageUrl;
                }
                let attrValueName=skuProp[attrNameId].value[attrValueId].name;
                attrValue[attrValueId]={name:attrValueName,img:img};
            }
            attr[attrNameId]={attrName:attrName,attrValue:attrValue};
        }
        let skuMap=iDetailData.sku.skuMap;
        for(let k in skuMap){
            let item=skuMap[k];
            let stock;
            stock=item.canBookCount;
            let sku_attr=k.split('&gt;');
            let pvs={};
            let sku_img='';
            for(let j=0;j<sku_attr.length;j++){
                let attrNameAndImg=get1688AttrNameAndImg(sku_attr[j],attr);
                pvs[attrNameAndImg['attrName']]={text:sku_attr[j],img:attrNameAndImg['img']};
                if(attrNameAndImg['img']){
                    sku_img=attrNameAndImg['img'];
                }
            }
            let price=(typeof item.discountPrice!='undefined')?item.discountPrice:iDetailData.sku.priceRangeOriginal[0][1];
            sku[item.skuId]={pvs:pvs,price:price,stock:stock,sku_img:sku_img};
        }
    }else{
        let price=document.querySelectorAll('meta[property="og:product:price"]')[0].content;
        let stock;
        try{
            stock=(JSON.parse(document.querySelectorAll('.mod-detail-purchasing.mod-detail-purchasing-single')[0].getAttribute('data-mod-config')))['max'];
        }catch (e) {
            if(document.getElementById('pageName').value.substring(0,7)=='大市场加工定制'){
                stock=0;
            }else{
                //获取库存失败
                callback(1,{},'获取1688库存失败!请记录当前链接联系开发人员.');
                return false;
            }
        }
        sku={price:price,stock:stock};
    }
    let ret_data={sku:sku,attr:attr,name:name,pdt_picture:pdt_picture,multi_sku:multi_sku,product_url: location.href,item_id:isItemPage()};
    let supplier_data=get1688Supplier();
    for(let i in supplier_data){
        ret_data[i]=supplier_data[i];
    }
    //发起请求在请求内容中提取图片
    get1688DesPic(callback,ret_data);
}
function get1688AttrNameAndImg(attrValue,attr){
    for(let k in attr){
        for(let j in attr[k]['attrValue']){
            if(attr[k]['attrValue'][j].name==attrValue){
                return {attrName:attr[k].attrName,img:attr[k]['attrValue'][j].img};
            }
        }
    }
}
function getTmall(callback){
    if(typeof KISSY =='undefined'){
        return false;
    }
    let multi_sku=0;
    let name = getTmallProductName();
    let pdt_picture = getTmallPdtPicture();
    let sku={};
    let attr={};
    KISSY.use('detail-model/product',function(e,t){
        let skuMap=t.instance()['__attrVals']['skuMap'];
        if(typeof skuMap=='undefined'){
            callback(1,{},'获取sku列表失败!请记录当前链接联系开发人员.');
            return false;
        }
        if(skuMap){
            multi_sku=1;
            let skuProp=t.instance()['__attrVals']['skuProp'];
            let propertyPics=t.instance()['__attrVals']['propertyPics'];
            if(typeof skuProp=='undefined'){
                callback(1,{},'获取sku属性失败!请记录当前链接联系开发人员.');
                return false;
            }
            for(let attrNameId in skuProp){
                let attrName;
                let attrValue={};
                for(let attrValueId in skuProp[attrNameId]){
                    let img='';
                    if(propertyPics && typeof propertyPics[';'+attrNameId+':'+attrValueId+';'] !='undefined' && typeof propertyPics[';'+attrNameId+':'+attrValueId+';'][0] !='undefined'){
                        img=propertyPics[';'+attrNameId+':'+attrValueId+';'][0];
                    }
                    attrName=skuProp[attrNameId][attrValueId].label;
                    attrValue[attrValueId]={name:skuProp[attrNameId][attrValueId].text,img:img};
                }
                attr[attrNameId]={attrName:attrName,attrValue:attrValue};
            }
            for(let k in skuMap){
                let item=skuMap[k];
                let stock=t.instance()['__attrVals']['inventory']['skuQuantity'][item.skuId]['quantity'];
                if(stock == 0){
                    //跳过没库存产品
                    continue;
                }
                let attr_arr=k.substr(1,k.length-2).split(';');
                let pvs={};
                let sku_img='';
                for(let i in attr_arr){
                    let attr_item=attr_arr[i].split(':');
                    if(!attr[attr_item[0]]||!attr[attr_item[0]]['attrValue'][attr_item[1]]){
                        continue;
                    }
                    if(attr[attr_item[0]]['attrValue'][attr_item[1]].img){
                        sku_img=attr[attr_item[0]]['attrValue'][attr_item[1]].img;
                    }
                    pvs[attr[attr_item[0]].attrName]={text:attr[attr_item[0]]['attrValue'][attr_item[1]].name,img:sku_img};
                }
                let price=item.price;
                sku[item.skuId]={pvs:pvs,price:price,stock:stock,sku_img:sku_img};
                let priceInfo=t.instance()['__attrVals']['priceInfo'];
                //有优惠价 覆盖
                for(let k in priceInfo){
                    if(typeof sku[k] !='undefined' && priceInfo[k].promotionList){
                        sku[k].price=priceInfo[k].promotionList[0].price;
                    }
                }
            }
        }else{
            let price=(typeof t.instance()['__attrVals']['promoPrice']!='undefined' && t.instance()['__attrVals']['promoPrice'])?t.instance()['__attrVals']['promoPrice']['str']:t.instance()['__attrVals']['originalPrice']['str'];
            sku={price:price,stock:t.instance()['__attrVals']['currentInventory'].quantity};
        }
        let ret_data={sku:sku,attr:attr,name:name,pdt_picture:pdt_picture,multi_sku:multi_sku,product_url: location.href,item_id:isItemPage()};
        let supplier_data=getTmallSupplier();
        for(let i in supplier_data){
            ret_data[i]=supplier_data[i];
        }
        let des_url='';
        if(typeof t.instance()['__attrVals'].config.api.httpsDescUrl !='undefined'){
            des_url=t.instance()['__attrVals'].config.api.httpsDescUrl;
        }
        //发起请求在请求内容中提取图片
        getTmallDesPic(callback,ret_data,des_url);
    });
}

//获取产品标题
function get1688ProductName() {
    var obj = document.getElementById('mod-detail-title');
    if (obj === null) {
        return '';
    }
    return obj.getElementsByTagName('h1')[0].innerText;
}
function getTaobaoProductName() {
    var obj = document.getElementById('J_Title');
    if (obj === null) {
        return '';
    }
    return obj.getElementsByTagName('h3')[0].innerText;
}
function getTmallProductName() {
    var obj = document.getElementById('J_DetailMeta');
    if (obj === null) {
        return '';
    }
    obj = obj.getElementsByClassName('tb-detail-hd')[0];
    return obj.getElementsByTagName('h1')[0].innerText;
}

//获取产品图片
function get1688PdtPicture() {
    var pic = [];
    var obj = document.getElementById('dt-tab');
    if (obj === null) {
        return pic;
    } 
    obj = obj.getElementsByTagName('li');
    for (var i = 0; i < obj.length; i++) {
        var imgdata = obj[i].getAttribute('data-imgs');
        if (imgdata) {
            imgdata = JSON.parse(imgdata);
            pic.push(imgdata.preview);
        }
    }
    return pic;
}
function getTaobaoPdtPicture() {
    var pic = [];
    var obj = document.getElementById('J_UlThumb');
    if (obj === null) {
        return pic;
    }
    obj = obj.getElementsByTagName('li');
    for (var i = 0; i < obj.length; i++) {
        var imgdata = obj[i].getElementsByTagName('img')[0].src.replace('_50x50.jpg_.webp', '');
        pic.push(imgdata);
    }
    return pic;
}
function getTmallPdtPicture() {
    var pic = [];
    var obj = document.getElementById('J_UlThumb');
    if (obj === null) {
        return pic;
    }
    obj = obj.getElementsByTagName('li');
    for (var i = 0; i < obj.length; i++) {
        var imgdata = obj[i].getElementsByTagName('img')[0].src.replace('_60x60q90.jpg', '');
        pic.push(imgdata);
    }
    return pic;
}
function getTaobaoSupplier(){
    var shop_name=g_config.shopName;
    var shop_id=g_config.shopId;
    var shop_url=g_config.idata.shop.url;
    var cate_id=g_config.idata.item.cid;
    var im=g_config.sellerNick;
    var item_no='';
    var obj=document.querySelectorAll('ul.attributes-list>li');
    for(var i=0;i<obj.length;i++){
        var flag=obj[i].innerText.substr(0,2);
        if(flag=='型号'||flag=='货号'){
            item_no=obj[i].getAttribute('title');
        }
    }
    return {shop_name:shop_name,shop_id:shop_id,shop_url:shop_url,im:im,cate_id:cate_id,item_no:item_no};
}
function getTmallSupplier(){
    var shop_name=document.querySelectorAll('a.slogo-shopname>strong')[0].innerText;
    var shop_id=g_config.shopId;
    var shop_url=g_config.shopUrl;
    var cate_id=g_config.categoryId;
    var im=decodeURI(g_config.sellerNickName);
    var item_no='';
    var obj=document.querySelectorAll('ul#J_AttrUL>li');
    for(var i=0;i<obj.length;i++){
        var flag=obj[i].innerText.substr(0,2);
        if(flag=='型号'||flag=='货号'){
            item_no=obj[i].getAttribute('title');
        }
    }
    return {shop_name:shop_name,shop_id:shop_id,shop_url:shop_url,im:im,cate_id:cate_id,item_no:item_no};
}
function get1688Supplier(){
    var shop_name=document.querySelectorAll('a.company-name')[0].innerText;
    var shop_id=iDetailConfig.memberid;
    var shop_url=iDetailConfig.companySiteLink;
    var cate_id=iDetailConfig.catid;
    var im=iDetailConfig.loginId;
    var item_no='';
    var obj=document.querySelectorAll('.de-feature.de-feature-key');
    for(var i=0;i<obj.length;i++){
        var flag=obj[i].innerText.substr(0,2);
        if(flag=='型号'||flag=='货号'){
            item_no=obj[i].nextElementSibling.getAttribute('title');
        }
    }
    return {shop_name:shop_name,shop_id:shop_id,shop_url:shop_url,im:im,cate_id:cate_id,item_no:item_no};
}
function getTaobaoDesPic(callback,data){
    var des_picture=[];
    var des_url=g_config.descUrl;
    if(des_url && typeof desc=='undefined'){
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = des_url;
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        head.appendChild(script);
        script.onload=script.onreadystatechange=function(){
            //taobao 将数据存到desc变量中 js来引入防止跨域
            var des_pic_craw=desc.match(/<img(?:[^>]+)src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])(?:[^>]*)>/g);
            for(let i=0;i<des_pic_craw.length;i++){
                var src=des_pic_craw[i].match(/src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])/)[1];
                if(filterIgnoreDesPic(src)){
                    des_picture.push(src);
                }
            }
            data['des_picture']=des_picture;
            callback(0,data,'获取成功!')
        };
    }else{
        //已经加载过 不重复加载
        if(desc){
            var des_pic_craw=desc.match(/<img(?:[^>]+)src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])(?:[^>]*)>/g);
            for(let i=0;i<des_pic_craw.length;i++){
                var src=des_pic_craw[i].match(/src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])/)[1];
                if(filterIgnoreDesPic(src)){
                    des_picture.push(src);
                }
            }
            data['des_picture']=des_picture;
        }
        data['des_picture']=des_picture;
        callback(0,data,'获取成功!')
    }
}
function getTmallDesPic(callback,data,des_url){
    var des_picture=[];
    if(des_url && typeof desc=='undefined'){
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = des_url;
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        head.appendChild(script);
        script.onload=script.onreadystatechange=function(){
            //天猫 将数据存到desc变量中 js来引入防止跨域
            var des_pic_craw=desc.match(/<img(?:[^>]+)src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])(?:[^>]*)>/g);
            for(let i=0;i<des_pic_craw.length;i++){
                var src=des_pic_craw[i].match(/src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])/)[1];
                if(filterIgnoreDesPic(src)){
                    des_picture.push(src);
                }
            }
            data['des_picture']=des_picture;
            callback(0,data,'获取成功!')
        };
    }else{
        //已经加载过 不重复加载
        if(desc){
            var des_pic_craw=desc.match(/<img(?:[^>]+)src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])(?:[^>]*)>/g);
            for(let i=0;i<des_pic_craw.length;i++){
                var src=des_pic_craw[i].match(/src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])/)[1];
                if(filterIgnoreDesPic(src)){
                    des_picture.push(src);
                }
            }
            data['des_picture']=des_picture;
        }
        data['des_picture']=des_picture;
        callback(0,data,'获取成功!')
    }
}
function get1688DesPic(callback,data){
    var des_picture=[];
    var des_url=document.getElementById('desc-lazyload-container').getAttribute('data-tfs-url');
    if(des_url&&typeof offer_details=='undefined'){
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = document.getElementById('desc-lazyload-container').getAttribute('data-tfs-url');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        head.appendChild(script);
        script.onload=script.onreadystatechange=function(){
            var des_pic_craw=offer_details.content.match(/<img(?:[^>]+)src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])(?:[^>]*)>/g);
            for(let i=0;i<des_pic_craw.length;i++){
                var src=des_pic_craw[i].match(/src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])/)[1];
                if(filterIgnoreDesPic(src)){
                    des_picture.push(src);
                }
            }
            data['des_picture']=des_picture;
            callback(0,data,'获取成功!')
        };
    }else{
        //已经加载过 不重复加载
        if(offer_details.content){
            var des_pic_craw=offer_details.content.match(/<img(?:[^>]+)src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])(?:[^>]*)>/g);
            for(let i=0;i<des_pic_craw.length;i++){
                var src=des_pic_craw[i].match(/src=(?:[\s|\\\\]*["']([^"'\\]+)[\s|\\\\]*["'])/)[1];
                if(filterIgnoreDesPic(src)){
                    des_picture.push(src);
                }
            }
            data['des_picture']=des_picture;
        }
        data['des_picture']=des_picture;
        callback(0,data,'获取成功!')
    }
}
//过滤一些占位图
function filterIgnoreDesPic(src){
    var ignore=["img.taobao.com","ma.m.1688.com","amos.alicdn.com","alisoft.com","add_to_favorites.htm","img.alicdn.com/NewGualianyingxiao","assets.alicdn.com/kissy/1.0.0/build/imglazyload/spaceball.gif"];
    for(var i=0;i<ignore.length;i++){
        if(src.indexOf(ignore[i])!=-1){
            return false;
        }
    }
    return true;

}