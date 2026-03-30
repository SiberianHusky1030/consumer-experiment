// ========== 新手专用：数据收集工具 ==========
// 1. 生成唯一用户ID（永久保存在浏览器）
function getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        // 随机ID：时间戳+随机数，保证每个用户唯一
        userId = 'user_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
        localStorage.setItem('user_id', userId); // 保存到浏览器
    }
    return userId;
}

// 2. 初始化数据结构（确保数据不丢）
function initData() {
    const userId = getUserId();
    let data = JSON.parse(localStorage.getItem('user_data_' + userId)) || {
        userId: userId,          // 用户唯一ID
        pageStay: {              // 页面停留时间（秒）
            page1: 0, page2: 0, page3: 0, page4: 0
        },
        privacy: {               // 隐私弹窗点击次数
            agree: 0, disagree: 0
        },
        loginPhone: '',          // 登录手机号
        username: ''             // 用户名
        // 点赞、收藏相关字段已移除
    };
    // 兼容老数据，移除page5
    if (data.pageStay && data.pageStay.page5 !== undefined) {
        delete data.pageStay.page5;
    }
    localStorage.setItem('user_data_' + userId, JSON.stringify(data));
    return data;
}

// 3. 记录页面停留时间（进入页面时调用）
function startPageTimer(pageId) {
    const userId = getUserId();
    initData(); // 先初始化数据
    // 记录进入时间（毫秒）
    localStorage.setItem('enter_time_' + pageId, new Date().getTime());
    console.log(`✅ 开始记录【${pageId}】停留时间`);
}

// 4. 结束页面停留时间（离开页面时调用）
function endPageTimer(pageId) {
    const userId = getUserId();
    const enterTime = localStorage.getItem('enter_time_' + pageId);
    if (!enterTime) return;
    
    // 计算停留时间（毫秒转秒，保留1位小数）
    const stayTime = (new Date().getTime() - enterTime) / 1000;
    let data = initData();
    data.pageStay[pageId] = Number(stayTime.toFixed(1));
    localStorage.setItem('user_data_' + userId, JSON.stringify(data));
    console.log(`✅ 【${pageId}】停留时间：${data.pageStay[pageId]}秒`);
}

// 5. 记录隐私弹窗点击（agree/disagree）
function recordPrivacy(type) {
    const userId = getUserId();
    let data = initData();
    if (type === 'agree') data.privacy.agree += 1;
    if (type === 'disagree') data.privacy.disagree += 1;
    localStorage.setItem('user_data_' + userId, JSON.stringify(data));
    console.log(`✅ 隐私弹窗【${type}】次数：${data.privacy[type]}`);
}

// 6. 记录登录手机号
function recordPhone(phone) {
    const userId = getUserId();
    let data = initData();
    data.loginPhone = phone;
    // 尝试同步写入用户名（如果有输入框）
    const usernameInput = document.getElementById('usernameInput');
    if (usernameInput && usernameInput.value) {
        data.username = usernameInput.value.trim();
    }
    localStorage.setItem('user_data_' + userId, JSON.stringify(data));
    console.log(`✅ 登录手机号：${phone}`);
}

// 点赞/收藏相关统计与记录逻辑已移除

// 8. 查看所有收集的数据（调试用，新手必看）
function showAllData() {
    const userId = getUserId();
    const data = JSON.parse(localStorage.getItem('user_data_' + userId)) || {};
    console.log('========== 已收集的用户数据 ==========');
    console.log(data);
    return data;
}

// ========== 数据上传终极版（防重复 + 数据完整） ==========
function sendDataOnClose() {
    try {
        const userId = getUserId();
        const dataKey = 'user_data_' + userId;
        const userData = localStorage.getItem(dataKey);

        if (!userData) {
            console.log("ℹ️ 无用户数据，不上传");
            return;
        }
        let parsedData = JSON.parse(userData);
        // 补充username字段（兼容未写入的情况）
        if (!parsedData.username) {
            const usernameInput = document.getElementById('usernameInput');
            if (usernameInput && usernameInput.value) {
                parsedData.username = usernameInput.value.trim();
            }
        }
        // 移除page5字段
        if (parsedData.pageStay && parsedData.pageStay.page5 !== undefined) {
            delete parsedData.pageStay.page5;
        }
        console.log("✅ 读取到完整用户数据：", parsedData);

        // 【核心修正】你的云函数正确接口地址（之前用错了静态网站地址）
        const uploadUrl = "https://cloudbase-5gkcqy054c5717b8.service.tcloudbase.com/saveUserData";
        
        // 线上环境上传（本地仅调试）
        if (window.location.protocol !== 'file:') {
            const blob = new Blob([JSON.stringify(parsedData)], { type: 'application/json' });
            navigator.sendBeacon(uploadUrl, blob);
            console.log("✅ 完整数据已提交至云数据库");
        }

        // 数据上传后再清空（保证数据完整）
        localStorage.removeItem(dataKey);
        localStorage.removeItem('video_user_status');
        console.log("✅ 数据已清空，实验重置完成");

    } catch (err) {
        console.error("❌ 上传失败：", err);
    }
}