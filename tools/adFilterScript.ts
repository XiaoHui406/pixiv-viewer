import { AdBlockSettings } from '@/types/adblock.ts';

/**
 * 广告屏蔽CSS规则定义
 */
const adRules = {
	// 基本广告屏蔽规则
	basicAds: [
		'a[href*="ads-pixiv.net"]',
		'a[href*="doubleclick.net"]',
		'a[href*="adroll.com"]',
		'div[class*="ad-frame"]',
		'div[class*="banner-ad"]',
		'iframe:not([src*="recaptcha"]):not([title*="reCAPTCHA"])',
		'div[id*="adsdk--"]',
		'.t_relatedworks',
		'.t_header',
		'.sc-1m9m9n-0',
		'.ads'
	],

	// Pixiv高级会员推广规则
	premiumAds: [

	],

	// 画师BOOTH推广规则
	boothAds: [
		'.user-booth-shop'
	]
};

/**
 * 根据设置生成CSS选择器
 */
function generateSelectors(settings : AdBlockSettings) : string[] {
	const selectors : string[] = [];

	if (settings.basicAds) {
		selectors.push(...adRules.basicAds);
	}

	if (settings.premiumAds) {
		selectors.push(...adRules.premiumAds);
	}

	if (settings.boothAds) {
		selectors.push(...adRules.boothAds);
	}

	return selectors;
}

/**
 * 生成广告屏蔽脚本
 * @param settings 广告屏蔽设置
 * @returns 完整的广告屏蔽JavaScript代码字符串
 */
export function generateAdFilterScript(settings : AdBlockSettings) : string {
	const selectors = generateSelectors(settings);

	// 如果没有开启任何屏蔽选项，返回空脚本
	if (selectors.length === 0) {
		return '';
	}

	const selectorString = selectors.join(',');

	return `
    (function() {
        // 广告屏蔽脚本 - 动态生成
        function injectCSS() {
            var cssId = 'pixiv-ad-killer';
            
            // 移除已有的样式
            var existingStyle = document.getElementById(cssId);
            if (existingStyle) {
                existingStyle.remove();
            }
            
            var style = document.createElement('style');
            style.id = cssId;
            style.innerHTML = \`
                ${selectorString}
                { 
                    display: none !important; 
                    width: 0 !important; 
                    height: 0 !important; 
                    visibility: hidden !important; 
                }
            \`;
            document.head.appendChild(style);
        }

        // 启动
        try {
            injectCSS();
        } catch (e) {
            console.error('广告屏蔽脚本执行失败:', e);
        }
    })();
  `;
}