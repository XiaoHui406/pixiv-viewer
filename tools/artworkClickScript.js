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
				// 查找链接内的所有图片
				var allImages = linkTarget.querySelectorAll('img');
				var imgSrc = '';
				
				// 遍历所有图片，找到真正的缩略图（不是base64占位图）
				for (var i = 0; i < allImages.length; i++) {
					var img = allImages[i];
					if (img.src && img.src.indexOf('i.pximg.net') !== -1) {
						imgSrc = img.src;
						break;
					}
				}
				
				// 如果没找到 pximg 图片，尝试其他图片（排除base64）
				if (!imgSrc) {
					for (var i = 0; i < allImages.length; i++) {
						var img = allImages[i];
						if (img.src && img.src.indexOf('data:image') !== 0) {
							imgSrc = img.src;
							break;
						}
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