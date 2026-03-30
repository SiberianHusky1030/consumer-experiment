// ========== 第一个页面（榜单页）的函数 ==========
// 显示Toast提示（干扰项点击时触发）
function showToast() {
    const toast = document.getElementById('toast');
    toast.style.display = 'block';
    // 2秒后自动隐藏
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}



// 第一个页面跳转到第二个页面（详情页）【关键修正】
function goToDetailPage() {
    endPageTimer('page1');
    window.location.href = '2-detail.html';
}

// ========== 第二个页面（详情页）的函数 ==========
// Tab切换函数（详情/评论）
function switchTab(tabName) {
    // 隐藏所有Tab内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    // 重置所有Tab的选中状态
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    // 显示目标Tab内容
    document.getElementById(`${tabName}-content`).classList.add('active');
    // 激活目标Tab样式
    document.querySelector(`.tab-item[onclick="switchTab('${tabName}')"]`).classList.add('active');
}

// 模拟下载动画（3秒完成）
let isDownloading = false;
function startDownload() {
    if (isDownloading) return;
    isDownloading = true;
    const actionBtn = document.getElementById('action-btn');
    // 替换按钮为进度条
    actionBtn.outerHTML = `
        <div class="progress-container" id="progress-container">
            <div class="progress-bar" id="progress-bar"></div>
            <div class="progress-text" id="progress-text">0%</div>
        </div>
    `;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    // 模拟进度变化：0% → 25% → 68% → 99% → 安装中（总时长3秒）
    const steps = [
        { progress: 25, text: '25%', delay: 750 },
        { progress: 68, text: '68%', delay: 1000 },
        { progress: 99, text: '99%', delay: 750 },
        { progress: 100, text: '安装中', delay: 500 }
    ];
    let currentStep = 0;
    function updateProgress() {
        if (currentStep >= steps.length) {
            // 下载完成，替换为「打开」按钮
            document.getElementById('progress-container').outerHTML = `
                <button class="install-btn" id="action-btn" onclick="goToPrivacyPage()">打开</button>
            `;
            isDownloading = false;
            return;
        }
        const step = steps[currentStep];
        progressBar.style.width = `${step.progress}%`;
        progressText.textContent = step.text;
        currentStep++;
        setTimeout(updateProgress, step.delay);
    }
    updateProgress();
}

// 第二个页面跳转到第三个页面（隐私弹窗页）
function goToPrivacyPage() {
    endPageTimer('page2');
    window.location.href = '3-privacy.html';
}



// ========== 第三个页面（隐私弹窗页）的函数 ==========

// 页面加载后，0.5秒弹出隐私弹窗
window.addEventListener('load', function() {
    setTimeout(() => {
        const modal = document.querySelector('.privacy-modal');
        if (modal) modal.style.display = 'flex';
    }, 500); // 0.5秒延迟

    // 模拟实验分组参数（可修改为'A'或'B'测试不同逻辑）
    const group_id = 'A'; // 这里改为'A'就是无强制时间组，'B'是强制阅读组
    const agreeBtn = document.getElementById('agreeBtn');

    if (group_id === 'B') {
        // B组：初始置灰，倒计时5秒
        let countdown = 10;
        agreeBtn.disabled = true;
        agreeBtn.textContent = `请阅读 (${countdown}s)`;

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                agreeBtn.textContent = `请阅读 (${countdown}s)`;
            } else {
                clearInterval(timer);
                agreeBtn.disabled = false;
                agreeBtn.textContent = '同意';
            }
        }, 1000);
    } else {
        // A组：直接可点击
        agreeBtn.disabled = false;
        agreeBtn.textContent = '同意';
    }
});



// 处理「不同意」点击：直接跳转回详情页（页面2）
function handleDisagree() {
    recordPrivacy('disagree'); // 记录点击行为
    window.location.href = '2-detail.html';
}

// 处理「同意」点击：跳转到登录页（后续创建4-login.html）
function handleAgree() {
    recordPrivacy('agree'); // 记录点击行为
    endPageTimer('page3');
    window.location.href = '4-login.html';
}


// ========== 登录页核心逻辑 ==========
document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('usernameInput');
    const phoneInput = document.getElementById('phoneInput');
    const codeInput = document.getElementById('codeInput');
    const agreementCheck = document.getElementById('agreementCheck');
    const actionBtn = document.getElementById('actionBtn');
    const smsNotification = document.getElementById('smsNotification');
    const errorToast = document.getElementById('errorToast');

    let isAfterGetCode = false; // 标记是否已点击获取验证码

    // 检查按钮样式（仅控制颜色，不控制点击）
    function checkButtonStatus() {
        const phone = phoneInput.value.trim();
        const isPhoneValid = /^\d{11}$/.test(phone);
        const isAgreementChecked = agreementCheck.checked;
        if (isPhoneValid && isAgreementChecked) {
            actionBtn.classList.add('active');
        } else {
            actionBtn.classList.remove('active');
        }
    }

    // 监听输入变化，更新按钮样式
    phoneInput.addEventListener('input', checkButtonStatus);
    agreementCheck.addEventListener('change', checkButtonStatus);

    // 显示错误/成功提示
    function showToast(message) {
        errorToast.textContent = message;
        errorToast.classList.add('show');
        setTimeout(() => errorToast.classList.remove('show'), 2000);
    }

    // 显示短信通知
    function showSmsNotification() {
        smsNotification.classList.add('show');
        setTimeout(() => smsNotification.classList.remove('show'), 5000);
    }

    // 处理按钮点击（获取验证码 / 登录）
    window.handleAction = function() {
        const username = usernameInput.value.trim();
        const phone = phoneInput.value.trim();
        const code = codeInput.value.trim();

        if (!isAfterGetCode) {
            // ---------- 【获取验证码阶段】优先校验用户名 ----------
            if (username === '') {
                showToast('请输入用户名');
                return;
            }
            // 情况1：手机号为空
            if (phone === '') {
                showToast('请输入手机号');
                return;
            }
            // 情况2：手机号不是11位数字
            if (!/^\d{11}$/.test(phone)) {
                showToast('请重新输入正确的手机号');
                return;
            }
            // 情况3：手机号正确，但未勾选协议
            if (!agreementCheck.checked) {
                showToast('请勾选《用户登录指引协议》');
                return;
            }

            // 所有条件满足：显示短信通知，切换按钮为「登录」
            showSmsNotification();
            isAfterGetCode = true;
            actionBtn.textContent = '登录';
        } else {
            recordPhone(phone);
            // ---------- 【登录阶段】验证码错误判断 ----------
            if (code === '8866') {
                // 记录用户名到本地数据
                try {
                    const userId = localStorage.getItem('user_id');
                    if (userId) {
                        let data = JSON.parse(localStorage.getItem('user_data_' + userId)) || {};
                        data.username = username;
                        localStorage.setItem('user_data_' + userId, JSON.stringify(data));
                    }
                } catch (e) {}
                // 登录成功时发送数据并清空
                sendDataOnClose();
                endPageTimer('page4');
                showToast('登录成功');
                setTimeout(() => window.location.href = '5-main.html', 1000);
            } else {
                showToast('验证码错误，请重新输入');
            }
        }
    };

    // 返回上一页（隐私弹窗页）
    window.goBack = function() {
        window.location.href = '3-privacy.html';
    };
});



