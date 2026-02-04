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
				<view 
					v-for="item in historyList" 
					:key="item.id" 
					class="history-item" 
					@click="openArtwork(item)"
					@longpress="deleteItem(item)"
				>
					<image 
						class="history-image" 
						:src="item.localImagePath" 
						mode="aspectFill" 
						lazy-load
					></image>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup lang="ts">
	import { ref, onMounted } from 'vue';
	import {
		getBrowsingHistory,
		clearBrowsingHistory,
		removeBrowsingHistory,
		type BrowsingHistoryItem
	} from '@/tools/browsingHistory.ts';

	const historyList = ref<BrowsingHistoryItem[]>([]);

	// 加载浏览记录
	const loadHistory = () => {
		historyList.value = getBrowsingHistory();
		console.log('浏览记录:', historyList.value);
	};

	// 清空浏览记录
	const clearHistory = async () => {
		uni.showModal({
			title: '确认清空',
			content: '确定要清空所有浏览记录吗？',
			success: async (res) => {
				if (res.confirm) {
					await clearBrowsingHistory();
					historyList.value = [];
					uni.showToast({
						title: '已清空',
						icon: 'success'
					});
				}
			}
		});
	};

	// 打开作品详情
	const openArtwork = (item: BrowsingHistoryItem) => {
		// 使用事件或存储传递URL给index页面
		uni.setStorageSync('target_artwork_url', item.url);
		uni.setStorageSync('target_artwork_id', item.id);

		uni.redirectTo({
			url: "/pages/index/index"
		});
	};

	// 长按删除单条记录
	const deleteItem = async (item: BrowsingHistoryItem) => {
		uni.showActionSheet({
			itemList: ['删除此记录'],
			success: async (res) => {
				if (res.tapIndex === 0) {
					await removeBrowsingHistory(item.id);
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
</style>
