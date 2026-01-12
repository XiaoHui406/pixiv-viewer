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
	                iframe:not([src*="recaptcha"]):not([title*="reCAPTCHA"]),
	                .sc-1m9m9n-0
	                { 
	                    display: none !important; 
	                    width: 0 !important; 
	                    height: 0 !important; 
	                    visibility: hidden !important; 
	                }
	            \`;
	            document.head.appendChild(style);
	        }

	        // 2. 核心逻辑：移除广告容器 (解决空白和残留图标)
	        function removeAdContainers() {
	            // A. 收集所有可能的广告元素
	            var targets = [];

	            // 收集可能是广告的元素
				var adSelectors = [
					'a[href*="doubleclick.net"]',
					'a[href*="ads-pixiv.net"]',
					'a[href*="adroll.com"]',
					'div[id*="ads"]',
					'div[class*="ad-frame"]'
				].join(",")
	            var links = document.querySelectorAll(adSelectors);
	            for (var i = 0; i < links.length; i++) {
					targets.push(links[i]);
				}

	            // 向上回溯，隐藏容器
	            for (var i = 0; i < targets.length; i++) {
	                var el = targets[i];
	                // 如果元素本身已经被处理过，跳过
	                if (el.getAttribute('data-ad-removed')) continue;

	                var parent = el.parentElement;
	                var depth = 0;
	                var hidden = false;

	                // 向上查找最多 15 层
	                while (parent && depth < 15) {
	                    var tagName = parent.tagName;

	                    // 1. 如果是列表项 (li)，直接隐藏 (Pixiv 瀑布流广告通常在 li 中)
	                    if (tagName === 'LI') {
	                        parent.style.display = 'none';
	                        el.setAttribute('data-ad-removed', 'true');
	                        hidden = true;
	                        break;
	                    }

	                    // 2. 如果是 section 且高度较小 (Pixiv 的很多推荐广告是 section)
	                    if (tagName === 'SECTION' && parent.offsetHeight < 500) {
	                        parent.style.display = 'none';
	                        el.setAttribute('data-ad-removed', 'true');
	                        hidden = true;
	                        break;
	                    }
						
						if (tagName === 'IFRAME' || tagName === 'DIV' || tagName === 'x-pixiv-ads-frame') {
							// 如果是 reCAPTCHA 的 iframe，不要隐藏
							    if (tagName === 'IFRAME') {
							        var src = parent.getAttribute('src') || '';
							        var title = parent.getAttribute('title') || '';
							        if (src.indexOf('recaptcha') !== -1 || title.indexOf('reCAPTCHA') !== -1) {
							            // 这是验证码，跳过，继续向父级查找或停止
							            parent = parent.parentElement;
							            depth++;
							            continue; 
							        }
							    }
							
							parent.style.display = 'none';
							el.setAttribute('data-ad-removed', 'true');
							hidden = true;
							break;
						}

	                    parent = parent.parentElement;
	                    depth++;
	                }

	                // 兜底：如果没找到特定容器，但它是广告链接，直接隐藏它的直接父级 div
	                if (!hidden && el.parentElement) {
	                    el.parentElement.style.display = 'none';
	                }
	            }
	        }

	        // 启动
	        try {
	            injectCSS();
	            removeAdContainers();

	            // 使用 MutationObserver 持续清理动态加载的广告
	            var observer = new MutationObserver(function(mutations) {
	                removeAdContainers();
	            });
	        } catch (e) {
	        }
	    })();
	`;