// URL更新检测脚本
export const urlUpdateScript = `
	    (function() {
	        var lastUrl = location.href;
	        
	        // 发送 URL 给 App 的函数
	        function notifyApp(url) {
	            // 使用你已有的 pixiv-down 协议
	            window.location.href = 'pixiv-down://update-url?url=' + encodeURIComponent(url);
	        }
	
	        // 1. 初次加载时先发送一次当前 URL
	        notifyApp(lastUrl);
	
	        // 2. 监听浏览器的后退/前进按钮
	        window.addEventListener('popstate', function() {
	            lastUrl = location.href;
	            notifyApp(lastUrl);
	        });
	
	        // 3. 针对 Pixiv 这种通过 JS 修改 URL 的情况，使用定时检查
	        setInterval(function() {
	            if (location.href !== lastUrl) {
	                lastUrl = location.href;
	                notifyApp(lastUrl);
	            }
	        }, 500);
	    })();
	`;