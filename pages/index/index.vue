<template>
	<view class="container">
		<!-- 顶部栏（包含状态栏和工具栏） -->
		<view class="top-bar">
			<!-- 状态栏占位 -->
			<view class="status-bar"></view>
			<!-- 工具栏 -->
			<view class="toolbar">
				<view class="toolbar-right">
					<view class="menu-icon" @click="toggleMenu">
						<image src="/static/more.png" class="icon-img" mode="aspectFit"></image>
					</view>
				</view>
			</view>
		</view>
		<!-- Webview容器 -->
		<web-view :webview-styles="webviewStyles" :src="pixivUrl"></web-view>
	</view>
</template>

<script setup lang="ts">
	import { ref, onMounted } from 'vue'
	import { onBackPress } from '@dcloudio/uni-app'

	// Pixiv网站地址
	const pixivUrl = ref('https://www.pixiv.net/')
	// const pixivUrl = ref('https://www.bilibili.com')

	// 输入框弹窗相关
	const inputType = ref<'artwork' | 'user'>('artwork')

	const webviewStyles = ref({})
	const topBarHeight = ref(0) // 顶部栏高度
	let webview : any = null

	// 纯净版去广告脚本：使用原生语法，移除不兼容的伪类，改用 ES5 语法确保兼容性
	const adFilterScript = `
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
	                iframe,
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

	            observer.observe(document.body, { childList: true, subtree: true });
	        } catch (e) {
	        }
	    })();
	`;

	// 切换菜单显示 - 使用uni.showActionSheet确保在app端可以正常显示
	const toggleMenu = () => {
		uni.showActionSheet({
			itemList: ['查找作品', '查找画师'],
			success: (res) => {
				if (res.tapIndex === 0) {
					// 查找作品
					showArtworkInput()
				} else if (res.tapIndex === 1) {
					// 查找画师
					showUserInput()
				}
			},
			fail: (err) => {
				console.log('showActionSheet fail:', err)
			}
		})
	}

	// 显示作品ID输入框
	const showArtworkInput = () => {
		inputType.value = 'artwork'
		uni.showModal({
			title: '查找作品',
			editable: true,
			placeholderText: '请输入作品ID',
			success: (res) => {
				if (res.confirm && res.content && res.content.trim()) {
					pixivUrl.value = `https://www.pixiv.net/artworks/${res.content.trim()}`
				} else if (res.confirm && !res.content?.trim()) {
					uni.showToast({
						title: '请输入作品ID',
						icon: 'none'
					})
				}
			}
		})
	}

	// 显示画师ID输入框
	const showUserInput = () => {
		inputType.value = 'user'
		uni.showModal({
			title: '查找画师',
			editable: true,
			placeholderText: '请输入画师ID',
			success: (res) => {
				if (res.confirm && res.content && res.content.trim()) {
					pixivUrl.value = `https://www.pixiv.net/users/${res.content.trim()}`
				} else if (res.confirm && !res.content?.trim()) {
					uni.showToast({
						title: '请输入画师ID',
						icon: 'none'
					})
				}
			}
		})
	}

	onMounted(() => {
		// 获取当前web-view
		const pages = getCurrentPages()
		const currentPage = pages[pages.length - 1]
		// @ts-ignore
		const currentWebview = currentPage.$getAppWebview()

		uni.getSystemInfo({
			success: (sysinfo) => {
				// 计算顶部栏总高度（状态栏高度 + 工具栏高度，工具栏约44px）
				const toolbarHeight = 44
				const totalTop = (sysinfo.statusBarHeight || 0) + toolbarHeight
				topBarHeight.value = totalTop

				// 页面初始化延时调用，防止webview还未渲染
				const interval = setInterval(() => {
					// @ts-ignore
					webview = currentWebview.children()[0]
					if (!webview) return
					// 给Webview设置全屏展示，top设置为状态栏高度+工具栏高度
					// 设置zindex较低，确保顶部栏可以接收点击事件
					// 同时设置left和right，确保webview不会覆盖顶部栏
					webview.setStyle({
						top: totalTop,
						bottom: 0,
						left: 0,
						right: 0,
						zindex: 1,
						render: 'always',
						hardwareAccelerated: true,
						cacheEnabled: true,
						// 避免拦截Pixiv的JavaScript
						blockNetworkImage: false,
						blockNetworkJS: false
					});

					// 增加对 loading 状态的监听，提前注入 CSS
					webview.addEventListener('loading', () => {
						// 在加载初期就注入最基础的隐藏样式，防止广告位撑开
						webview.evalJS(`
					        var style = document.createElement('style');
					        style.innerHTML = 'a[href*="ads-pixiv.net"] { display: none !important; }';
					        document.head.appendChild(style);
					    `);
					});

					if (webview.overrideResourceRequest) {
						webview.overrideResourceRequest([
							// 只拦截明确的广告域名
							{ match: 'https?://.*\\.ads-pixiv\\.net/.*', redirect: ' ' },
							{ match: 'https?://.*doubleclick\\.net/.*', redirect: ' ' },
							{ match: 'https?://.*googleadservices\\.com/.*', redirect: ' ' },
							// 避免拦截source.pixiv.net，这可能是图片资源
						]);
					}

					// --- 核心优化 2：注入清理脚本（隐藏 UI） ---
					// 监听 loaded 事件确保脚本在页面跳转后依然有效
					webview.addEventListener('loaded', () => {
						try {
							console.log("ad filter script loaded");
							webview.evalJS(adFilterScript);
						} catch (e) {
							console.error('Failed to inject ad filter:', e);
						}
					});

					// 确保webview不拦截顶部区域的触摸事件
					// @ts-ignore
					if (typeof plus !== 'undefined' && webview.setTouchEvent) {
						// 设置webview的触摸事件处理，但顶部区域应该由原生view处理
					}
					// 关闭启动加载菊花
					// @ts-ignore
					if (typeof plus !== 'undefined' && plus.navigator) {
						// @ts-ignore
						setTimeout(function () { plus.navigator.closeSplashscreen() }, 600)
					}
					// 初始化成功清除
					clearInterval(interval)
				}, 100)
			},
			complete: () => { }
		})
	})

	// 处理返回按钮 - 监听手机回退按钮/手势，使得后退是回退页面不是退出APP
	onBackPress(() => {
		if (!webview) {
			return false
		}
		// 使用回调方式检查是否可以返回
		webview.canBack(function (e : any) {
			if (!e.canBack) {
				// 如果webview无法返回，则退出APP
				// @ts-ignore
				if (typeof plus !== 'undefined' && plus.runtime) {
					// @ts-ignore
					plus.runtime.quit()
				}
				return
			}
			// 可以返回，执行返回操作
			webview.back()
		})
		return true // 阻止默认返回行为
	})
</script>

<style scoped>
	.container {
		width: 100%;
		height: 100vh;
		position: relative;
	}

	.top-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 9999;
		background-color: #fff;
		/* #ifdef APP-PLUS */
		/* 在app端，使用更高的层级确保在webview上方 */
		/* #endif */
	}

	.status-bar {
		height: var(--status-bar-height);
		width: 100%;
	}

	.toolbar {
		height: 44px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		/* padding: 0 12px; */
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		padding-right: 10px;
	}

	.menu-icon {
		width: 32px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 10000;
	}

	.icon-img {
		width: 20px;
		height: 20px;
	}
</style>