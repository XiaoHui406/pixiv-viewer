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
						zindex: 1
					})
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