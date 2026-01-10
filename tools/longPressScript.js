// 长按图片检测脚本 - 修复版本：添加防重复触发机制
export const longPressScript = `
		(function() {
			var timer = null;
			var touchStartTime = 0;
			var startX = 0;
			var startY = 0;
			var isProcessing = false; // 添加处理状态标志，防止重复触发
			var lastTriggerTime = 0; // 记录上次触发时间
			var TRIGGER_DELAY = 1000; // 最小触发间隔1秒
		
			document.addEventListener('touchstart', function(e) {
				// 只有单指触摸才触发
				if (e.touches.length !== 1) return;
					
				var touch = e.touches[0];
				startX = touch.clientX;
				startY = touch.clientY;
				touchStartTime = Date.now();
				var target = e.target;
	
				// 递归查找 img 标签 (防止点击到图片上的遮罩层)
				var depth = 0;
				var imgTarget = null;
				var current = target;
				while(current && depth < 3) {
					if (current.tagName === 'IMG') {
						imgTarget = current;
						break;
					}
					current = current.parentElement;
					depth++;
				}
	
				// 检查是否正在处理或触发间隔太短
				var currentTime = Date.now();
				if (imgTarget && imgTarget.src && !isProcessing && (currentTime - lastTriggerTime > TRIGGER_DELAY)) {
					isProcessing = true; // 设置处理状态
					timer = setTimeout(function() {
						// 简单的防抖：如果手指移动超过10px，则不算长按
						// 这里在setTimeout里无法获取实时位置，靠touchmove清除timer
						
						// 更新最后触发时间
						lastTriggerTime = Date.now();
						
						// 触发自定义协议，将图片地址传给App
						// 使用 encodeURIComponent 确保特殊字符不破坏URL结构
						window.location.href = 'pixiv-down://action?url=' + encodeURIComponent(imgTarget.src);
						
						// 重置处理状态
						isProcessing = false;
					}, 800); // 800ms 判定为长按
				} else if (isProcessing) {
					console.log('正在处理中，忽略本次长按');
				}
			}, { passive: false });
	
			// 手指移动时取消长按
			document.addEventListener('touchmove', function(e) {
				var touch = e.touches[0];
				// 如果移动距离超过 10px，取消长按
				if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
					clearTimeout(timer);
					timer = null;
					isProcessing = false; // 重置处理状态
				}
			}, { passive: false });
	
			document.addEventListener('touchend', function() {
				clearTimeout(timer);
				timer = null;
				// 延迟重置处理状态，避免快速连续触发
				setTimeout(function() {
					isProcessing = false;
				}, 300);
			});
				
			// 屏蔽浏览器默认的长按菜单 (Context Menu)
			document.addEventListener('contextmenu', function(e) {
				// 如果是图片，阻止默认菜单，防止和我们的菜单冲突
				if (e.target.tagName === 'IMG') {
					e.preventDefault();
				}
			});
		})();
	`;