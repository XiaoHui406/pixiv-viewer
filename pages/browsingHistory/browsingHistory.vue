<template>
	<view class="container">
		<!-- 顶部导航栏 -->
		<view class="nav-bar">
			<text class="nav-title">浏览记录</text>
			<view class="nav-clear" @click="clearHistory" v-if="historyList.length > 0">
				<text class="clear-text">清空</text>
			</view>
			<view class="nav-clear" v-else></view>
		</view>

		<!-- 浏览记录列表 -->
		<scroll-view class="history-list" scroll-y>
			<view v-if="historyList.length === 0" class="empty-state">
				<text class="empty-text">暂无浏览记录</text>
			</view>

			<view v-else class="history-grid">
				<view v-for="item in processedHistoryList" :key="item.id" class="history-item"
					@click="openArtwork(item)" @longpress="deleteItem(item)">
					<view v-if="!item.localPath" class="image-placeholder">
						<text class="placeholder-text">加载中...</text>
					</view>
					<image v-else class="history-image" :src="item.localPath" mode="aspectFill" lazy-load></image>
					<!-- 					<view class="history-overlay">
						<text class="artwork-id">ID: {{ item.id }}</text>
					</view> -->
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import { ref, onMounted, computed } from 'vue';
	import {
		getBrowsingHistory,
		clearBrowsingHistory,
		removeBrowsingHistory,
		type BrowsingHistoryItem
	} from '@/tools/browsingHistory.ts';

	interface ProcessedHistoryItem extends BrowsingHistoryItem {
		localPath ?: string;
	}

	const historyList = ref<BrowsingHistoryItem[]>([]);
	const downloadedImages = ref<Map<string, string>>(new Map());

	// 处理后的历史记录列表
	const processedHistoryList = computed(() => {
		return historyList.value.map(item => ({
			...item,
			localPath: downloadedImages.value.get(item.imageUrl)
		}));
	});

	// 加载浏览记录
	const loadHistory = () => {
		historyList.value = getBrowsingHistory();
		console.log('浏览记录:', historyList.value);
		// 下载图片
		downloadImages();
	};

	// 下载图片（带 Referer）
	const downloadImages = async () => {
		for (const item of historyList.value) {
			if (downloadedImages.value.has(item.imageUrl)) {
				continue; // 已经下载过
			}

			try {
				const res = await uni.downloadFile({
					url: item.imageUrl,
					header: {
						'Referer': 'https://www.pixiv.net'
					}
				});

				if (res.statusCode === 200 && res.tempFilePath) {
					downloadedImages.value.set(item.imageUrl, res.tempFilePath);
				}
			} catch (err) {
				console.error('下载图片失败:', item.imageUrl, err);
			}
		}
	};

	// 清空浏览记录
	const clearHistory = () => {
		uni.showModal({
			title: '确认清空',
			content: '确定要清空所有浏览记录吗？',
			success: (res) => {
				if (res.confirm) {
					clearBrowsingHistory();
					historyList.value = [];
					downloadedImages.value.clear();
					uni.showToast({
						title: '已清空',
						icon: 'success'
					});
				}
			}
		});
	};

	// 打开作品详情
	const openArtwork = (item : ProcessedHistoryItem) => {
		// 返回首页并打开对应的作品页面
		uni.switchTab({
			url: '/pages/index/index'
		});

		// 使用事件或存储传递URL给index页面
		uni.setStorageSync('target_artwork_url', item.url);
		uni.setStorageSync('target_artwork_id', item.id);
	};

	// 长按删除单条记录
	const deleteItem = (item : ProcessedHistoryItem) => {
		uni.showActionSheet({
			itemList: ['删除此记录'],
			success: (res) => {
				if (res.tapIndex === 0) {
					removeBrowsingHistory(item.id);
					loadHistory();
				}
			}
		});
	};

	onMounted(() => {
		loadHistory();
	});
</script>

<style scoped>
	.container {
		width: 100%;
		height: 100vh;
		background-color: #f5f5f5;
	}

	.nav-bar {
		height: 44px;
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 15px;
		border-bottom: 1px solid #e8e8e8;
		margin-top: var(--status-bar-height);
	}

	.nav-title {
		font-size: 17px;
		font-weight: 600;
		color: #333;
	}

	.nav-clear {
		width: 50px;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.clear-text {
		font-size: 14px;
		color: #ff6b6b;
	}

	.history-list {
		flex: 1;
		height: calc(100vh - 44px - var(--status-bar-height));
	}

	.empty-state {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-text {
		font-size: 16px;
		color: #999;
	}

	.history-grid {
		display: flex;
		flex-wrap: wrap;
		padding: 10px;
		gap: 10px;
	}

	.history-item {
		width: calc(50% - 5px);
		aspect-ratio: 1;
		border-radius: 12px;
		overflow: hidden;
		position: relative;
		background-color: #eee;
	}

	.history-image {
		width: 100%;
		height: 100%;
	}

	.image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ddd;
	}

	.placeholder-text {
		font-size: 12px;
		color: #999;
	}

	.history-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		padding: 20px 8px 8px;
	}

	.artwork-id {
		font-size: 12px;
		color: #fff;
	}
</style>