// 去广告脚本：使用原生语法，移除不兼容的伪类，改用 ES5 语法确保兼容性
export const adFilterScript = `
	    (function() {

	        // 1. 安全的 CSS 注入 (处理样式层面的隐藏)
	        function injectCSS() {
	            var cssId = 'pixiv-ad-killer';
	            if (document.getElementById(cssId)) return;

	            var style = document.createElement('style');
	            style.id = cssId;
	            style.innerHTML = \`
	                /* 强制隐藏广告链接、iframe、谷歌广告 */
	                a[href*="ads-pixiv.net"], 
	                a[href*="doubleclick.net"],
					a[href*="adroll.com"],
					div[class*="ad-frame"],
					div[class*="banner-ad"],
	                iframe:not([src*="recaptcha"]):not([title*="reCAPTCHA"]),
					div[id*="adsdk--"],
					.t_relatedworks, 
					.t_header,
	                .sc-1m9m9n-0,
					.ads
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
	        }
	    })();
	`;