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
				<switch :checked="adSettings.basicAds" @change="handleAdSwitchChange('basicAds', $event)"
					color="#2196F3" />
			</view>

			<!-- Pixiv高级会员相关 -->
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">Pixiv高级会员推广</text>
					<text class="setting-desc">屏蔽Pixiv Premium相关推广</text>
				</view>
				<switch :checked="adSettings.premiumAds" @change="handleAdSwitchChange('premiumAds', $event)"
					color="#2196F3" />
			</view>

			<!-- 画师BOOTH相关 -->
			<view class="setting-item last-item">
				<view class="setting-info">
					<text class="setting-label">画师BOOTH推广</text>
					<text class="setting-desc">屏蔽画师BOOTH商店推广</text>
				</view>
				<switch :checked="adSettings.boothAds" @change="handleAdSwitchChange('boothAds', $event)"
					color="#2196F3" />
			</view>
		</view>

		<!-- 浏览记录设置卡片 -->
		<view class="card">
			<view class="card-title">浏览记录设置</view>

			<!-- 自动清理开关 -->
			<view class="setting-item">
				<view class="setting-info">
					<text class="setting-label">自动清理浏览记录</text>
					<text class="setting-desc">当记录超过限制时自动删除旧记录</text>
					<text class="setting-desc">每条记录大约会占用存储20KB</text>
				</view>
				<switch :checked="historySettings.enabled" @change="handleHistorySwitchChange('enabled', $event)"
					color="#2196F3" />
			</view>

			<!-- 最大记录数量 -->
			<view class="setting-item" v-if="historySettings.enabled">
				<view class="setting-info">
					<text class="setting-label">最大记录数量</text>
					<text class="setting-desc">超过此数量将自动删除最早记录</text>
				</view>
				<picker mode="selector" :range="countOptions" :value="getCountIndex(historySettings.maxCount)"
					@change="handleCountChange">
					<view class="picker-value">
						<text class="picker-text">{{ getCountLabel(historySettings.maxCount) }}</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
			</view>

			<!-- 时间限制 -->
			<view class="setting-item last-item" v-if="historySettings.enabled">
				<view class="setting-info">
					<text class="setting-label">时间限制</text>
					<text class="setting-desc">删除超过指定时间的记录</text>
				</view>
				<picker mode="selector" :range="timeLimitLabels" :value="getTimeLimitIndex(historySettings.timeLimit)"
					@change="handleTimeLimitChange">
					<view class="picker-value">
						<text class="picker-text">{{ getTimeLimitLabel(historySettings.timeLimit) }}</text>
						<text class="picker-arrow">></text>
					</view>
				</picker>
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
	import { onMounted, computed } from 'vue';
	import { useAdBlockSettings } from '../../composables/useAdBlockSettings';
	import { useHistorySettings } from '../../composables/useHistorySettings';
	import type { AdBlockSettings } from '../../types/adblock';
	import { TIME_LIMIT_OPTIONS, type TimeLimitOption } from '../../types/historySettings';

	const { settings: adSettings, loadSettings: loadAdSettings, updateSetting: updateAdSetting, resetSettings: resetAdSettings } = useAdBlockSettings();
	const { settings: historySettings, loadSettings: loadHistorySettings, updateSetting: updateHistorySetting, resetSettings: resetHistorySettings } = useHistorySettings();

	// 数量选项
	const countOptions = ['50条', '100条', '200条', '500条', '1000条', '2000条', '5000条', '10000条', '无限制'];
	const countValues : (number | null)[] = [50, 100, 200, 500, 1000, 2000, 5000, 10000, null];

	// 时间限制选项标签
	const timeLimitLabels = computed(() => TIME_LIMIT_OPTIONS.map(opt => opt.label));

	/**
	 * 处理广告屏蔽开关切换
	 */
	const handleAdSwitchChange = <K extends keyof AdBlockSettings>(
		key : K,
		event : any
	) : void => {
		const value = event.detail.value;
		updateAdSetting(key, value);
	};

	/**
	 * 处理浏览记录开关切换
	 */
	const handleHistorySwitchChange = <K extends keyof typeof historySettings.value>(
		key : K,
		event : any
	) : void => {
		const value = event.detail.value;
		updateHistorySetting(key, value);
	};

	/**
	 * 获取数量索引
	 */
	const getCountIndex = (value : number | null) : number => {
		const index = countValues.indexOf(value);
		return index >= 0 ? index : 1; // 默认100条
	};

	/**
	 * 获取数量标签
	 */
	const getCountLabel = (value : number | null) : string => {
		if (value === null) return '无限制';
		return `${value}条`;
	};

	/**
	 * 处理数量选择变化
	 */
	const handleCountChange = (event : any) : void => {
		const index = event.detail.value;
		updateHistorySetting('maxCount', countValues[index]);
	};

	/**
	 * 获取时间限制索引
	 */
	const getTimeLimitIndex = (value : TimeLimitOption) : number => {
		const index = TIME_LIMIT_OPTIONS.findIndex(opt => opt.value === value);
		return index >= 0 ? index : 0;
	};

	/**
	 * 获取时间限制标签
	 */
	const getTimeLimitLabel = (value : TimeLimitOption) : string => {
		const option = TIME_LIMIT_OPTIONS.find(opt => opt.value === value);
		return option?.label || '无限制';
	};

	/**
	 * 处理时间限制选择变化
	 */
	const handleTimeLimitChange = (event : any) : void => {
		const index = event.detail.value;
		updateHistorySetting('timeLimit', TIME_LIMIT_OPTIONS[index].value);
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
					resetAdSettings();
					resetHistorySettings();
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
		loadAdSettings();
		loadHistorySettings();
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

	.picker-value {
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.picker-text {
		font-size: 28rpx;
		color: #666;
	}

	.picker-arrow {
		font-size: 28rpx;
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