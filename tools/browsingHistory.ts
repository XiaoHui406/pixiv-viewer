// 浏览记录存储键
const BROWSING_HISTORY_KEY = 'pixiv_browsing_history';

// 浏览记录项接口
export interface BrowsingHistoryItem {
	id: string;
	url: string;
	localImagePath: string; // 本地图片路径
	timestamp: number;
}

// 获取浏览记录
export function getBrowsingHistory(): BrowsingHistoryItem[] {
	try {
		const history = uni.getStorageSync(BROWSING_HISTORY_KEY);
		return history || [];
	} catch (e) {
		console.error('获取浏览记录失败:', e);
		return [];
	}
}

// 下载图片到本地
async function downloadImageToLocal(imageUrl: string, artworkId: string): Promise<string | null> {
	try {
		const res = await uni.downloadFile({
			url: imageUrl,
			header: {
				'Referer': 'https://www.pixiv.net'
			}
		});

		if (res.statusCode === 200 && res.tempFilePath) {
			// 保存到持久化存储
			const saveRes = await uni.saveFile({
				tempFilePath: res.tempFilePath
			});
			
			console.log('图片已保存到:', saveRes.savedFilePath);
			return saveRes.savedFilePath;
		}
	} catch (err) {
		console.error('下载图片失败:', imageUrl, err);
	}
	return null;
}

// 添加浏览记录（异步）
export async function addBrowsingHistory(url: string, imageUrl: string): Promise<void> {
	try {
		// 提取作品ID
		const match = url.match(/\/artworks\/(\d+)/);
		if (!match) {
			console.log('不是作品页面，不记录:', url);
			return;
		}

		const id = match[1];
		const history = getBrowsingHistory();

		// 检查是否已存在相同记录
		const existingIndex = history.findIndex(item => item.id === id);
		if (existingIndex !== -1) {
			// 如果已有记录，移动到最前面
			const existingItem = history.splice(existingIndex, 1)[0];
			history.unshift(existingItem);
			uni.setStorageSync(BROWSING_HISTORY_KEY, history);
			console.log('浏览记录已更新位置:', id);
			return;
		}

		// 下载图片到本地
		console.log('正在下载图片:', imageUrl);
		const localImagePath = await downloadImageToLocal(imageUrl, id);
		
		if (!localImagePath) {
			console.error('图片下载失败，不保存记录:', id);
			return;
		}

		// 添加新记录到最前面
		history.unshift({
			id,
			url,
			localImagePath,
			timestamp: Date.now()
		});

		// 限制最多保存100条记录
		const maxHistory = 100;
		if (history.length > maxHistory) {
			// 删除多余的记录和对应的本地图片
			const removed = history.splice(maxHistory);
			for (const item of removed) {
				try {
					await uni.removeSavedFile({ filePath: item.localImagePath });
				} catch (e) {
					console.error('删除旧图片失败:', e);
				}
			}
		}

		uni.setStorageSync(BROWSING_HISTORY_KEY, history);
		console.log('浏览记录已保存:', id, localImagePath);
	} catch (e) {
		console.error('保存浏览记录失败:', e);
	}
}

// 清除所有浏览记录
export async function clearBrowsingHistory(): Promise<void> {
	try {
		const history = getBrowsingHistory();
		
		// 删除所有本地图片
		for (const item of history) {
			try {
				if (item.localImagePath) {
					await uni.removeSavedFile({ filePath: item.localImagePath });
				}
			} catch (e) {
				console.error('删除图片失败:', item.localImagePath, e);
			}
		}
		
		uni.removeStorageSync(BROWSING_HISTORY_KEY);
		console.log('浏览记录和图片已清空');
	} catch (e) {
		console.error('清除浏览记录失败:', e);
	}
}

// 删除单条浏览记录
export async function removeBrowsingHistory(id: string): Promise<void> {
	try {
		const history = getBrowsingHistory();
		const item = history.find(item => item.id === id);
		
		if (item && item.localImagePath) {
			try {
				await uni.removeSavedFile({ filePath: item.localImagePath });
			} catch (e) {
				console.error('删除图片失败:', item.localImagePath, e);
			}
		}
		
		const filtered = history.filter(item => item.id !== id);
		uni.setStorageSync(BROWSING_HISTORY_KEY, filtered);
	} catch (e) {
		console.error('删除浏览记录失败:', e);
	}
}
