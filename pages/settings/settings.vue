<template>
	<view class="settings-page">
		<!-- 广告屏蔽设置卡片 -->
		<view class="card">
			<view class="card-title">广告屏蔽设置</view>

			<!-- 基本广告屏蔽 -->
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">基本广告屏蔽</text>
					<text class="setting-desc">屏蔽页面中的基础广告内容</text>
				</view>
				<switch :checked="settings.basicAds" @change="handleSwitchChange('basicAds', $event)" color="#2196F3" />
			</view>

			<!-- Pixiv高级会员相关 -->
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">Pixiv高级会员推广</text>
					<text class="setting-desc">屏蔽Pixiv Premium相关推广</text>
				</view>
				<switch :checked="settings.premiumAds" @change="handleSwitchChange('premiumAds', $event)"
					color="#2196F3" />
			</view>

			<!-- 画师BOOTH相关 -->
			<view class="setting-item last-item">
				<view class="setting-info">
					<text class="setting-label">画师BOOTH推广</text>
					<text class="setting-desc">屏蔽画师BOOTH商店推广</text>
				</view>
				<switch :checked="settings.boothAds" @change="handleSwitchChange('boothAds', $event)" color="#2196F3" />
			</view>
		</view>

		<!-- 操作按钮 -->
		<view class="card">
			<button class="reset-btn" @click="handleReset">恢复默认设置</button>
		</view>

		<!-- 提示信息 -->
		<view class="tips">
			<text class="tips-text">设置将自动保存，无需手动点击保存按钮</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { onMounted } from 'vue';
	import { useAdBlockSettings } from '../../composables/useAdBlockSettings';
	import type { AdBlockSettings } from '../../types/adblock';

	const { settings, loadSettings, updateSetting, resetSettings } = useAdBlockSettings();

	/**
	 * 处理开关切换
	 */
	const handleSwitchChange = <K extends keyof AdBlockSettings>(
		key : K,
		event : any
	) : void => {
		const value = event.detail.value;
		updateSetting(key, value);
	};

	/**
	 * 处理重置
	 */
	const handleReset = () : void => {
		uni.showModal({
			title: '确认重置',
			content: '确定要恢复默认设置吗？',
			success: (res) => {
				if (res.confirm) {
					resetSettings();
					uni.showToast({
						title: '已恢复默认设置',
						icon: 'success'
					});
				}
			}
		});
	};

	// 页面加载时读取设置
	onMounted(() => {
		loadSettings();
	});
</script>

<style scoped>
	.settings-page {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
	}

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

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.setting-item.last-item {
		border-bottom: none;
	}

	.setting-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		margin-right: 20rpx;
	}

	.setting-label {
		font-size: 30rpx;
		color: #333;
		font-weight: 500;
	}

	.setting-desc {
		font-size: 24rpx;
		color: #999;
	}

	.reset-btn {
		margin: 20rpx 30rpx;
		height: 80rpx;
		line-height: 80rpx;
		font-size: 28rpx;
		color: #ff5252;
		background-color: #fff;
		border: 2rpx solid #ff5252;
		border-radius: 8rpx;
	}

	.reset-btn::after {
		border: none;
	}

	.reset-btn:active {
		background-color: #fff5f5;
	}

	.tips {
		text-align: center;
		padding: 20rpx;
	}

	.tips-text {
		font-size: 24rpx;
		color: #999;
	}
</style>