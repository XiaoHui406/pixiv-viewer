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
	import { ref, onMounted, watch, nextTick, WebViewHTMLAttributes } from 'vue'
	import { onBackPress } from '@dcloudio/uni-app'
	import { downloadImageToDirectory } from '@/tools/downloadImage.js'
	import { copyIdFromCurrentUrl } from '@/tools/copyId.js'
	import { adFilterScript } from '@/tools/adFilterScript.js'
	import { longPressScript } from '@/tools/longPressScript.js'
	import { urlUpdateScript } from '@/tools/urlUpdateScript.js'

	// Pixiv网站地址
	const pixivUrl = ref('https://www.pixiv.net/')
	const currentWebviewUrl = ref('https://www.pixiv.net/');
	// const pixivUrl = ref('https://www.bilibili.com')

	// 监听pixivUrl变化
	watch(pixivUrl, (newVal, oldVal) => {
		console.log('pixivUrl changed from', oldVal, 'to', newVal)
	})

	// 输入框弹窗相关
	const inputType = ref<'artwork' | 'user'>('artwork')

	const webviewStyles = ref({})
	const topBarHeight = ref(0) // 顶部栏高度
	let webview : PlusWebviewWebviewObject = null
	const isWebviewReady = ref(false) // webview初始化状态标志

	// 处理图片长按菜单 - 添加防重复调用机制
	let isMenuShowing = false; // 菜单显示状态标志
	const handleImageLongPress = (imageUrl : string) => {
		console.log("handleImageLongPress");

		// 防重复调用：如果菜单已经在显示，直接返回
		if (isMenuShowing) {
			console.log("菜单已在显示中，忽略重复调用");
			return;
		}

		isMenuShowing = true; // 设置菜单显示状态

		uni.showActionSheet({
			itemList: ['下载图片', '取消'],
			title: '图片操作',
			success: async (res) => {
				if (res.tapIndex === 0) {
					// 只有当用户点击"下载图片"时才触发
					uni.showLoading({ title: '下载中...' });
					try {
						// 替换为高清图逻辑 (可选)： Pixiv略缩图通常包含 /c/600x1200_90/ 等路径，原图通常在 i.pximg.net/img-original/
						// 这里暂时直接下载捕获到的 src
						await downloadImageToDirectory(imageUrl);
						uni.showToast({ title: '保存成功', icon: 'success' });
					} catch (e : any) {
						uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
					} finally {
						uni.hideLoading();
						// 延迟重置状态，确保动画完成
						setTimeout(() => {
							isMenuShowing = false;
						}, 500);
					}
				} else {
					// 用户点击取消或其他选项
					setTimeout(() => {
						isMenuShowing = false;
					}, 300);
				}
			},
			fail: (err) => {
				console.log('showActionSheet fail:', err);
				// 发生错误时也要重置状态
				setTimeout(() => {
					isMenuShowing = false;
				}, 300);
			}
		})
	}

	// 检查当前URL是否可以复制ID
	const canCopyId = (url : string) => {
		if (!url) return false;

		// 检查是否为作品页面
		if (url.includes('/artworks/')) {
			return true;
		}

		// 检查是否为画师页面
		if (url.includes('/users/')) {
			return true;
		}

		// 检查其他可能的URL格式
		if (url.includes('illust_id=') || url.includes('member.php?id=')) {
			return true;
		}

		return false;
	}

	// 切换菜单显示 - 使用uni.showActionSheet确保在app端可以正常显示
	const toggleMenu = () => {
		// 根据当前URL决定菜单选项
		const menuItems = [];
		const menuActions = [];
		let webviewUrl : string = currentWebviewUrl.value
		console.log('webviewUrl=' + webviewUrl);

		// 检查是否可以复制ID
		if (canCopyId(webviewUrl)) {
			menuItems.push('复制ID');
			menuActions.push('copyId');
		}

		// 添加原有的查找功能
		menuItems.push('查找作品', '查找画师');
		menuActions.push('findArtwork', 'findUser');

		// 添加以图搜图功能
		menuItems.push('以图搜图');
		menuActions.push('searchByImage');

		uni.showActionSheet({
			itemList: menuItems,
			success: async (res) => {
				const action = menuActions[res.tapIndex];

				switch (action) {
					case 'copyId':
						// 复制当前页面的ID
						await copyIdFromCurrentUrl(webviewUrl);
						break;
					case 'findArtwork':
						// 查找作品
						showArtworkInput();
						break;
					case 'findUser':
						// 查找画师
						showUserInput();
						break;
					case 'searchByImage':
						// 以图搜图
						searchByImage();
						break;
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
					const newUrl = `https://www.pixiv.net/artworks/${res.content.trim()}`
					// 使用webview API加载URL
					loadUrlWithWebviewAPI(newUrl)
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
					const newUrl = `https://www.pixiv.net/users/${res.content.trim()}`
					// 使用webview API加载URL
					loadUrlWithWebviewAPI(newUrl)
				} else if (res.confirm && !res.content?.trim()) {
					uni.showToast({
						title: '请输入画师ID',
						icon: 'none'
					})
				}
			}
		})
	}

	// 以图搜图功能 - 使用通用的webview API加载函数
	const searchByImage = async () => {
		console.log('searchByImage called')
		const newUrl = 'https://ascii2d.net/'
		await loadUrlWithWebviewAPI(newUrl)
	}

	// 获取webview实例的辅助函数
	const getWebviewInstance = () => {
		try {
			const pages = getCurrentPages()
			if (!pages || pages.length === 0) {
				console.error('No pages available')
				return null
			}

			const currentPage = pages[pages.length - 1]
			if (!currentPage) {
				console.error('Cannot get current page')
				return null
			}

			// @ts-ignore
			const currentWebview = currentPage.$getAppWebview()
			if (!currentWebview) {
				console.error('Cannot get app webview')
				return null
			}

			const children = currentWebview.children()
			if (!children || children.length === 0) {
				console.error('No webview children found')
				return null
			}

			const webviewInstance = children[0]
			console.log('Webview instance obtained:', webviewInstance)
			return webviewInstance
		} catch (error) {
			console.error('Error getting webview instance:', error)
			return null
		}
	}

	// 通用的webview API加载URL函数
	const loadUrlWithWebviewAPI = async (url : string) => {
		console.log('loadUrlWithWebviewAPI called with URL:', url)

		try {
			// 如果webview未就绪，等待一小段时间
			if (!isWebviewReady.value) {
				console.log('Webview not ready yet, waiting...')
				uni.showLoading({ title: '加载中...', mask: true })

				// 等待webview就绪，最多等待2秒
				const maxWaitTime = 2000
				const startTime = Date.now()

				while (!isWebviewReady.value && Date.now() - startTime < maxWaitTime) {
					await new Promise(resolve => setTimeout(resolve, 100))
				}

				uni.hideLoading()

				if (!isWebviewReady.value) {
					console.warn('Webview still not ready after waiting, using Vue update')
					// 回退到Vue响应式更新
					pixivUrl.value = url
					return
				}
			}

			let targetWebview = webview

			// 如果webview变量为空，但标志显示已就绪，重新获取
			if (!targetWebview && isWebviewReady.value) {
				console.log('Webview variable is null but flag says ready, re-fetching...')
				targetWebview = getWebviewInstance()
			}

			if (!targetWebview) {
				console.error('Cannot get webview instance, using Vue update')
				pixivUrl.value = url
				return
			}

			// 尝试多种方法加载URL
			let loadSuccess = false

			// 方法1: 使用loadURL方法（如果可用）
			if (typeof targetWebview.loadURL === 'function') {
				console.log('Attempting to use webview.loadURL()')
				try {
					targetWebview.loadURL(url)
					loadSuccess = true
					console.log('webview.loadURL() succeeded')
				} catch (error) {
					console.error('webview.loadURL() failed:', error)
				}
			}

			// 方法2: 使用evalJS执行JavaScript跳转
			if (!loadSuccess && typeof targetWebview.evalJS === 'function') {
				console.log('Attempting to use webview.evalJS()')
				try {
					targetWebview.evalJS(`window.location.href = "${url}"`)
					loadSuccess = true
					console.log('webview.evalJS() succeeded')
				} catch (error) {
					console.error('webview.evalJS() failed:', error)
				}
			}

			// 方法3: 使用setTimeout确保evalJS执行
			if (!loadSuccess && typeof targetWebview.evalJS === 'function') {
				console.log('Attempting to use evalJS with setTimeout')
				try {
					targetWebview.evalJS(`
						setTimeout(function() {
							window.location.href = "${url}"
						}, 100)
					`)
					loadSuccess = true
					console.log('evalJS with setTimeout succeeded')
				} catch (error) {
					console.error('evalJS with setTimeout failed:', error)
				}
			}

			if (!loadSuccess) {
				console.warn('All webview API methods failed, using Vue update')
				pixivUrl.value = url
				return
			}

			// 同时更新pixivUrl.value以保持状态同步
			pixivUrl.value = url
			console.log('URL loaded successfully via webview API')

		} catch (error) {
			console.error('Error in loadUrlWithWebviewAPI:', error)
			// 如果webview API失败，使用Vue响应式更新
			pixivUrl.value = url
		}
	}

	// 回退到Vue响应式更新的方法
	const fallbackToVueUpdate = () => {
		console.log('Falling back to Vue reactive update')
		const newUrl = 'https://ascii2d.net/'
		pixivUrl.value = newUrl

		// 使用nextTick确保更新
		nextTick(() => {
			console.log('Vue update completed')
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
				const toolbarHeight = 30
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
						console.log('webview is loading');
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

					// 核心拦截逻辑：监听 pixiv-down:// 协议
					// overrideUrlLoading 比 overrideResourceRequest 更适合监听页面跳转请求
					webview.overrideUrlLoading({
						mode: 'reject', // 拦截后不进行跳转
						match: 'pixiv-down://.*' // 只拦截特定协议
					}, (e : any) => {
						const rawUrl = e.url;
						if (rawUrl.includes('pixiv-down://update-url')) {
							const urlParam = 'url=';
							const index = rawUrl.indexOf(urlParam);
							if (index !== -1) {
								const newUrl = decodeURIComponent(rawUrl.substring(index + urlParam.length));
								currentWebviewUrl.value = newUrl;
								console.log("App 已同步最新 URL:", newUrl);
							}
							return; // 拦截并结束，不执行后续逻辑
						}

						// e.url 就是我们在 JS 里 window.location.href 设置的值
						// 格式: pixiv-down://action?url=https%3A%2F%2F...
						try {
							const rawUrl = e.url;
							const searchKey = 'url=';
							const index = rawUrl.indexOf(searchKey);

							if (index !== -1) {
								// 1. 截取 'url=' 后面的所有字符
								let imgUrl = rawUrl.substring(index + searchKey.length);

								// 2. 解码 (decodeURIComponent 是 JS 标准函数，APP端可用)
								if (imgUrl) {
									imgUrl = decodeURIComponent(imgUrl);

									// 3. 再次检查是否还需要解码 (防止多重编码)
									if (imgUrl.indexOf('%3A') > -1 || imgUrl.indexOf('%2F') > -1) {
										imgUrl = decodeURIComponent(imgUrl);
									}

									console.log("解析成功:", imgUrl);

									// 4. 调用菜单
									handleImageLongPress(imgUrl);
								}
							}
						} catch (err) {
							console.error("解析图片地址失败:", err);
						}
					});

					// --- 核心优化 2：注入清理脚本（隐藏 UI） ---
					// 监听 loaded 事件确保脚本在页面跳转后依然有效
					webview.addEventListener('loaded', () => {
						try {
							console.log("script loaded");
							const combinedScript = [
								adFilterScript,
								longPressScript,
								urlUpdateScript
							].join("")
							webview.evalJS(combinedScript)
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
					// 设置webview就绪标志
					isWebviewReady.value = true
					console.log('Webview is ready:', webview)

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
		height: 30px;
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
		height: 100%;
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