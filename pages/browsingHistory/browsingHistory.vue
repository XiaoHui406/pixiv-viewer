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

			<view v-else class="history-content">
				<view v-for="group in groupedHistory" :key="group.date" class="date-group">
					<!-- 日期标题 -->
					<view class="date-header">
						<text class="date-text">{{ group.date }}</text>
						<text class="count-text">{{ group.items.length }}张</text>
					</view>
					<!-- 该日期的图片网格 -->
					<view class="history-grid">
						<view v-for="item in group.items" :key="item.id" class="history-item" @click="openArtwork(item)"
							@longpress="deleteItem(item)">
							<image class="history-image" :src="item.localImagePath" mode="aspectFill" lazy-load></image>
						</view>
					</view>
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
		performAutoClean,
		type BrowsingHistoryItem
	} from '@/tools/browsingHistory.ts';

	const historyList = ref<BrowsingHistoryItem[]>([]);

	// 按日期分组的历史记录
	interface HistoryGroup {
		date : string;
		items : BrowsingHistoryItem[];
	}

	const groupedHistory = computed<HistoryGroup[]>(() => {
		const groups : Map<string, BrowsingHistoryItem[]> = new Map();

		historyList.value.forEach(item => {
			const date = formatDate(item.timestamp);
			if (!groups.has(date)) {
				groups.set(date, []);
			}
			groups.get(date)!.push(item);
		});

		// 转换为数组并按日期降序排列
		return Array.from(groups.entries())
			.map(([date, items]) => ({ date, items }))
			.sort((a, b) => {
				// 解析日期字符串进行比较
				const dateA = parseDate(a.date);
				const dateB = parseDate(b.date);
				return dateB.getTime() - dateA.getTime();
			});
	});

	// 格式化日期为 "YYYY年MM月DD日 星期X"
	function formatDate(timestamp : number) : string {
		const date = new Date(timestamp);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
		const weekday = weekdays[date.getDay()];
		return `${year}年${month}月${day}日 星期${weekday}`;
	}

	// 从日期字符串解析日期
	function parseDate(dateStr : string) : Date {
		const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/);
		if (match) {
			return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
		}
		return new Date();
	}

	// 加载浏览记录
	const loadHistory = async () => {
		// 执行自动清理
		historyList.value = await performAutoClean();
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
	const openArtwork = (item : BrowsingHistoryItem) => {
		// 使用事件或存储传递URL给index页面
		uni.setStorageSync('target_artwork_url', item.url);
		uni.setStorageSync('target_artwork_id', item.id);

		uni.redirectTo({
			url: "/pages/index/index"
		});
	};

	// 长按删除单条记录
	const deleteItem = async (item : BrowsingHistoryItem) => {
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
	page {
		height: 100%;
	}

	.container {
		width: 100%;
		height: 100%;
		background-color: #fff;
	}

	.nav-bar {
		height: calc(44px + var(--status-bar-height));
		background-color: #fff;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 15px;
		border-bottom: 1px solid #e8e8e8;
		padding-top: var(--status-bar-height);
		box-sizing: border-box;
		z-index: 100;
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
		height: calc(100% - 44px - var(--status-bar-height));
		background-color: #fff;
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

	.history-content {
		padding-bottom: 20px;
		background-color: #fff;
	}

	.date-group {
		margin-bottom: 1px;
	}

	.date-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px 8px;
		background-color: #fff;
	}

	.date-text {
		font-size: 15px;
		font-weight: 600;
		color: #333;
	}

	.count-text {
		font-size: 13px;
		color: #999;
	}

	.history-grid {
		display: flex;
		flex-wrap: wrap;
		padding: 8px 12px;
		gap: 8px;
		background-color: #fff;
	}

	.history-item {
		width: calc(25% - 6px);
		aspect-ratio: 1;
		border-radius: 8px;
		overflow: hidden;
		position: relative;
		background-color: #eee;
	}

	.history-image {
		width: 100%;
		height: 100%;
	}
</style>