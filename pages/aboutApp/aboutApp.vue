<template>
	<view class="about-page">
		<!-- 应用信息卡片 -->
		<view class="app-info-card">
			<view class="app-icon">
				<image src="/static/icon.png" class="icon-image" mode="aspectFit"></image>
			</view>
			<view class="app-name">Pixiv Viewer</view>
			<view class="app-version">当前版本 {{ currentVersion }}</view>
		</view>

		<!-- 功能说明卡片 -->
		<view class="card">
			<view class="card-title">功能说明</view>
			<view class="feature-list">
				<view class="feature-item">
					<view class="feature-icon">📱</view>
					<view class="feature-content">
						<view class="feature-title">Pixiv浏览</view>
						<view class="feature-desc">内置Pixiv网页浏览器，支持完整浏览体验</view>
					</view>
				</view>
				<view class="feature-item">
					<view class="feature-icon">🚫</view>
					<view class="feature-content">
						<view class="feature-title">广告屏蔽</view>
						<view class="feature-desc">支持屏蔽基础广告、会员推广和画师商店推广</view>
					</view>
				</view>
				<view class="feature-item">
					<view class="feature-icon">📥</view>
					<view class="feature-content">
						<view class="feature-title">图片下载</view>
						<view class="feature-desc">长按图片即可下载高清原图到本地</view>
					</view>
				</view>
				<view class="feature-item">
					<view class="feature-icon">📋</view>
					<view class="feature-content">
						<view class="feature-title">ID复制</view>
						<view class="feature-desc">一键复制作品ID或画师ID</view>
					</view>
				</view>
				<view class="feature-item">
					<view class="feature-icon">🔍</view>
					<view class="feature-content">
						<view class="feature-title">以图搜图</view>
						<view class="feature-desc">集成ascii2d，支持以图搜图功能</view>
					</view>
				</view>
				<view class="feature-item last-item">
					<view class="feature-icon">📜</view>
					<view class="feature-content">
						<view class="feature-title">浏览记录</view>
						<view class="feature-desc">自动保存浏览历史，支持查看和跳转</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 关于应用卡片 -->
		<view class="card">
			<view class="card-title">关于应用</view>
			<view class="about-content">
				<view class="about-text">
					Pixiv Viewer 是一款第三方Pixiv浏览工具，旨在为用户提供更好的浏览体验。
				</view>
				<view class="about-text">
					本应用仅作为浏览器使用，所有内容均来自Pixiv官方网站，版权归原画师所有。
				</view>
				<view class="about-text">
					请勿将本应用用于商业用途或违反Pixiv使用条款的行为。
				</view>
			</view>
		</view>

		<!-- 版本更新检查 -->
		<view class="card">
			<view class="card-title">版本更新</view>
			<view class="update-section">
				<view class="version-info">
					<text class="version-label">当前版本</text>
					<text class="version-value">{{ currentVersion }}</text>
				</view>
				<button class="check-update-btn" @click="checkUpdate" :loading="isChecking" :disabled="isChecking">
					{{ isChecking ? '检查中...' : '检查更新' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';

	// 当前版本号
	const currentVersion = ref('')
	plus.runtime.getProperty(plus.runtime.appid, (info) => {
		currentVersion.value = info.version
	})

	// 检查更新状态
	const isChecking = ref(false);

	/**
	 * 检查更新
	 */
	const checkUpdate = async () : Promise<void> => {
		if (isChecking.value) return;

		isChecking.value = true;

		try {
			// TODO: 实现实际的版本检查逻辑
			// 这里模拟检查过程
			const response = await uni.request({
				url: 'https://api.github.com/repos/XiaoHui406/pixiv-viewer/releases/latest'
			})
			let latestVersion : string = response.data['tag_name']
			// 去除最前面的“v”
			latestVersion = latestVersion.substring(1)
			// 如果是x.x而不是x.x.x，在最后插入.0变为x.x.0
			// 我错了，我不应该图省事把x.x.0写成x.x的 
			if (latestVersion.split('.').length === 2) {
				latestVersion += '.0'
			}
			console.log(latestVersion);

			if (currentVersion.value === latestVersion) {
				uni.showModal({
					title: '版本检查',
					content: '当前已是最新版本',
					showCancel: false,
					confirmText: '确定'
				});
			}
			else {
				const choice = await uni.showModal({
					title: '版本检查',
					content: `检查到最新版本：${latestVersion}, 是否更新？`,
					showCancel: true,
					confirmText: '确定'
				})
				if (choice.confirm) {
					const downloadUrl : string = response.data['assets'][0]['browser_download_url']
					const downloadCallback = await uni.downloadFile(downloadUrl)
					const filePath = downloadCallback.filePath
					plus.runtime.install(filePath)
				}
			}

		} catch (error) {
			uni.showToast({
				title: '检查失败，请稍后重试',
				icon: 'none'
			});
		} finally {
			isChecking.value = false;
		}
	};
</script>

<style scoped>
	.about-page {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
	}

	/* 应用信息卡片 */
	.app-info-card {
		background-color: #fff;
		border-radius: 12rpx;
		padding: 60rpx 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.app-icon {
		width: 120rpx;
		height: 120rpx;
		border-radius: 24rpx;
		background-color: #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
		overflow: hidden;
	}

	.icon-image {
		width: 100rpx;
		height: 100rpx;
	}

	.app-name {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 12rpx;
	}

	.app-version {
		font-size: 26rpx;
		color: #999;
	}

	/* 通用卡片样式 */
	.card {
		background-color: #fff;
		border-radius: 12rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
	}

	.card-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		padding: 24rpx 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	/* 功能列表 */
	.feature-list {
		padding: 10rpx 30rpx;
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		padding: 24rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.feature-item.last-item {
		border-bottom: none;
	}

	.feature-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
		line-height: 1;
	}

	.feature-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	.feature-title {
		font-size: 30rpx;
		color: #333;
		font-weight: 500;
	}

	.feature-desc {
		font-size: 26rpx;
		color: #999;
		line-height: 1.4;
	}

	/* 关于应用内容 */
	.about-content {
		padding: 24rpx 30rpx;
	}

	.about-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.6;
		margin-bottom: 16rpx;
	}

	.about-text:last-child {
		margin-bottom: 0;
	}

	/* 更新检查区域 */
	.update-section {
		padding: 30rpx;
	}

	.version-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.version-label {
		font-size: 30rpx;
		color: #333;
	}

	.version-value {
		font-size: 28rpx;
		color: #666;
	}

	.check-update-btn {
		width: 100%;
		height: 80rpx;
		line-height: 80rpx;
		font-size: 30rpx;
		color: #fff;
		background-color: #2196F3;
		border-radius: 8rpx;
	}

	.check-update-btn::after {
		border: none;
	}

	.check-update-btn:active {
		opacity: 0.8;
	}

	.check-update-btn[disabled] {
		background-color: #ccc;
	}

	/* 版权信息 */
	.copyright {
		text-align: center;
		padding: 40rpx 20rpx;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	.copyright-text {
		font-size: 24rpx;
		color: #999;
	}
</style>