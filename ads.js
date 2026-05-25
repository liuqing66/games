/**
 * 广告模块 - AdManager
 * 支持平台: mock(测试) | ylh(优量汇) | pangle(穿山甲) | adsense(Google)
 *
 * Google AdSense 接入步骤:
 * 1. 打开 https://www.google.com/adsense 注册账号
 * 2. 等待审核通过（通常1-2周）
 * 3. 获取你的发布商ID (pub-xxxxxxxxxxxxxxxx)
 * 4. 把下面的 adsense.pubId 改成你的ID
 * 5. 把 ads.js 里的 platform 从 'mock' 改成 'adsense'
 *
 * 收益参考: 千次展示 $2-$10（约14-70元），是国内的3-5倍
 */

// ========== 配置区 ==========
const AD_CONFIG = {
  // 广告平台: 'mock' | 'ylh' | 'pangle' | 'adsense'
  platform: 'mock',

  // Google AdSense 配置
  adsense: {
    pubId: 'pub-xxxxxxxxxxxxxxxx',  // 替换为你的发布商ID
    // 广告位ID（可选，不填则用自动广告）
    bannerSlot: '',    // 横幅广告位ID
    rewardSlot: '',    // 激励广告位ID（可选，AdSense无原生激励视频）
  },

  // 优量汇配置（国内）
  ylh: {
    mediaId: 'YOUR_MEDIA_ID',
    placementId: 'YOUR_PLACEMENT_ID',
    appId: '',
  },

  // 穿山甲配置（国内）
  pangle: {
    appId: 'YOUR_APP_ID',
    placementId: 'YOUR_PLACEMENT_ID',
  },
};

// ========== 广告接口 ==========
const AdManager = {
  initialized: false,
  bannerVisible: false,

  init() {
    if (this.initialized) return;

    switch (AD_CONFIG.platform) {
      case 'adsense':
        this.initAdSense();
        break;
      case 'ylh':
        this.initYLH();
        break;
      case 'pangle':
        this.initPangle();
        break;
      default:
        console.log('[AdManager] Mock mode - no real ads loaded');
    }
    this.initialized = true;
  },

  // ---------- Google AdSense ----------
  initAdSense() {
    // 1. 加载 AdSense 主脚本（自动广告）
    const autoAds = document.createElement('script');
    autoAds.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-' + AD_CONFIG.adsense.pubId;
    autoAds.crossOrigin = 'anonymous';
    autoAds.async = true;
    autoAds.setAttribute('data-ad-client', 'ca-' + AD_CONFIG.adsense.pubId);
    document.head.appendChild(autoAds);

    // 2. 如果配置了手动广告位，在页面底部创建横幅
    if (AD_CONFIG.adsense.bannerSlot) {
      this.createBanner();
    }

    console.log('[AdManager] Google AdSense initialized (pub: ' + AD_CONFIG.adsense.pubId + ')');
  },

  createBanner() {
    // 在页面底部创建一个横幅广告位
    const banner = document.createElement('ins');
    banner.className = 'adsbygoogle';
    banner.style.cssText = 'display:block; width:100%; max-width:728px; height:90px; margin:12px auto;';
    banner.setAttribute('data-ad-client', 'ca-' + AD_CONFIG.adsense.pubId);
    banner.setAttribute('data-ad-slot', AD_CONFIG.adsense.bannerSlot);
    banner.setAttribute('data-ad-format', 'horizontal');

    // 找到 app 或 body 底部插入
    const app = document.getElementById('app') || document.body;
    app.appendChild(banner);

    // 触发广告加载
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[AdManager] Banner push failed:', e.message);
    }

    this.bannerVisible = true;
  },

  // Google AdSense 没有原生的激励视频API
  // 这里做"模拟激励"：展示一个带广告的弹窗，用户观看几秒后获得奖励
  showAdSenseReward(callback) {
    const overlay = document.createElement('div');
    overlay.id = 'ad-reward-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.92); z-index: 9999;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <div style="color: #ccc; font-size: 13px; margin-bottom: 12px;">Sponsored</div>
        <div style="
          width: 336px; height: 280px;
          background: #1a1a1a;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid #333;
        ">
          <ins class="adsbygoogle"
            style="display:inline-block;width:336px;height:280px"
            data-ad-client="ca-${AD_CONFIG.adsense.pubId}"
            data-ad-slot="${AD_CONFIG.adsense.rewardSlot || AD_CONFIG.adsense.bannerSlot}">
          </ins>
        </div>
        <div id="ad-countdown" style="
          color: #f6d365; font-size: 14px; margin-top: 16px; font-weight: bold;
        ">3</div>
        <div style="color: #888; font-size: 12px; margin-top: 4px;">
          Reward unlocks in <span id="ad-cd-num">3</span>s
        </div>
        <button id="ad-skip-btn" style="
          margin-top: 16px; padding: 8px 24px;
          border-radius: 20px; border: 1px solid #555;
          background: transparent; color: #999;
          cursor: pointer; font-size: 13px;
        ">Skip</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // 尝试加载广告
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}

    let remaining = 3;
    const cdEl = document.getElementById('ad-cd-num');
    const timer = setInterval(() => {
      remaining--;
      cdEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(timer);
        overlay.remove();
        if (callback) callback(true);
      }
    }, 1000);

    document.getElementById('ad-skip-btn').addEventListener('click', () => {
      clearInterval(timer);
      overlay.remove();
      if (callback) callback(false);
    });
  },

  // ---------- 优量汇 ----------
  initYLH() {
    const script = document.createElement('script');
    script.src = 'https://qzs.gdtimg.com/union/res/union_sdk/page/latest/union_sdk.js';
    document.head.appendChild(script);
    script.onload = () => {
      console.log('[AdManager] 优量汇SDK已加载');
      if (window.TencentGDT) {
        window.TencentGDT.push({
          app_id: AD_CONFIG.ylh.appId,
          placement_id: AD_CONFIG.ylh.placementId,
          type: 'native'
        });
      }
    };
    script.onerror = () => {
      console.warn('[AdManager] 优量汇SDK加载失败，回退到模拟模式');
    };
  },

  showYLHAd(callback) {
    if (!window.TencentGDT) {
      this.showMockAd(callback);
      return;
    }
    window.TencentGDT.NATIVE.loadAd(AD_CONFIG.ylh.placementId);
    window.TencentGDT.NATIVE.doExpose({
      container: 'ad-container',
      placement_id: AD_CONFIG.ylh.placementId,
    });
    setTimeout(() => callback && callback(true), 2000);
  },

  // ---------- 穿山甲 ----------
  initPangle() {
    const script = document.createElement('script');
    script.src = 'https://sf1-scmcdn2-tos.pstatp.com/goofy/bytecom/pangle/h5/latest/main.js';
    document.head.appendChild(script);
    script.onload = () => console.log('[AdManager] 穿山甲SDK已加载');
    script.onerror = () => console.warn('[AdManager] 穿山甲SDK加载失败');
  },

  showPangleAd(callback) {
    setTimeout(() => callback && callback(true), 2000);
  },

  // ---------- 统一入口 ----------
  showRewardAd(callback) {
    switch (AD_CONFIG.platform) {
      case 'adsense':
        this.showAdSenseReward(callback);
        break;
      case 'ylh':
        this.showYLHAd(callback);
        break;
      case 'pangle':
        this.showPangleAd(callback);
        break;
      default:
        this.showMockAd(callback);
    }
  },

  // ---------- 模拟广告（测试用） ----------
  showMockAd(callback) {
    const adOverlay = document.createElement('div');
    adOverlay.id = 'ad-overlay';
    adOverlay.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.9); z-index: 9999;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <div style="color: #aaa; font-size: 14px; margin-bottom: 16px;">📺 Ad playing...</div>
        <div style="
          width: 300px; height: 200px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 18px; font-weight: bold;
        ">
          <div style="text-align:center">
            <div style="font-size:40px;margin-bottom:8px">🦞</div>
            <div>Ad Space</div>
          </div>
        </div>
        <div id="ad-countdown" style="color: #f6d365; font-size: 14px; margin-top: 16px;">3</div>
        <button id="ad-skip" style="
          margin-top: 20px; padding: 8px 24px;
          border-radius: 20px; border: 1px solid #666;
          background: transparent; color: #888;
          cursor: pointer; font-size: 13px;
        ">Skip</button>
      </div>
    `;
    document.body.appendChild(adOverlay);

    let countdown = 3;
    const cdEl = document.getElementById('ad-countdown');
    const timer = setInterval(() => {
      countdown--;
      cdEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(timer);
        adOverlay.remove();
        if (callback) callback(true);
      }
    }, 1000);

    document.getElementById('ad-skip').addEventListener('click', () => {
      clearInterval(timer);
      adOverlay.remove();
      if (callback) callback(false);
    });
  }
};

// ========== 广告按钮点击处理 ==========
// 这个函数会被游戏页面调用，需要游戏页面定义 gameActive / coins 等变量
// 如果找不到这些变量，说明是在 Ball Sort 这类不同结构的游戏中使用
function watchAd() {
  AdManager.showRewardAd((success) => {
    if (!success) return;

    // Number Blocks 游戏 - 金币奖励
    if (typeof coins !== 'undefined' && typeof coinDisplay !== 'undefined') {
      coins += 200;
      coinDisplay.textContent = coins;
      showToast('📺 +200 金币！');
      if (typeof updateShopButtons === 'function') updateShopButtons();
      return;
    }

    // Ball Sort 游戏 - 提示奖励
    if (typeof hints !== 'undefined') {
      hints++;
      showToast('📺 +1 Hint! (' + hints + ' total)');
      return;
    }

    // 通用回退
    console.log('[AdManager] Reward granted');
  });
}

// 页面加载时初始化广告
window.addEventListener('DOMContentLoaded', () => {
  AdManager.init();
});
