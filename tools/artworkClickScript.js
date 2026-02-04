// 作品点击监听脚本 - 用于捕获浏览记录
export const artworkClickScript = `(function() {
	// 防止重复注入
	if (window.__artworkClickScriptInjected) return;
	window.__artworkClickScriptInjected = true;
	
	document.addEventListener('click', function(e) {
		var target = e.target;
		
		// 递归查找 a 标签
		var depth = 0;
		var linkTarget = null;
		var current = target;
		while(current && depth < 5) {
			if (current.tagName === 'A') {
				linkTarget = current;
				break;
			}
			current = current.parentElement;
			depth++;
		}
		
		// 检查是否是作品链接
		if (linkTarget && linkTarget.href) {
			var href = linkTarget.href;
			var artworkMatch = href.match(/\\/artworks\\/(\\d+)/);
			
			if (artworkMatch) {
				// 找到链接中的图片
				var imgElement = linkTarget.querySelector('img');
				var imgSrc = '';
				
				if (imgElement && imgElement.src) {
					imgSrc = imgElement.src;
				} else {
					// 尝试从父元素查找图片
					var parentImg = linkTarget.parentElement ? linkTarget.parentElement.querySelector('img') : null;
					if (parentImg && parentImg.src) {
						imgSrc = parentImg.src;
					}
				}
				
				// 发送数据到 App
				if (imgSrc) {
					window.location.href = 'pixiv-down://artwork-click?url=' + encodeURIComponent(href) + '&img=' + encodeURIComponent(imgSrc);
				}
			}
		}
	}, true);
})();`;