import { TIME_LIMIT_OPTIONS, defaultHistorySettings, HISTORY_SETTINGS_KEY } from '../types/historySettings';
import type { HistorySettings } from '../types/historySettings';

// 浏览记录存储键
const BROWSING_HISTORY_KEY = 'pixiv_browsing_history';

// 浏览记录项接口
export interface BrowsingHistoryItem {
	id : string;
	url : string;
	localImagePath : string; // 本地图片路径
	timestamp : number;
}

// 获取浏览记录设置
function getHistorySettings() : HistorySettings {
	try {
		const stored = uni.getStorageSync(HISTORY_SETTINGS_KEY);
		if (stored) {
			return { ...defaultHistorySettings, ...stored };
		}
	} catch (e) {
		console.error('获取浏览记录设置失败:', e);
	}
	return { ...defaultHistorySettings };
}

// 执行自动清理
async function autoCleanHistory(history : BrowsingHistoryItem[]) : Promise<BrowsingHistoryItem[]> {
	const settings = getHistorySettings();

	if (!settings.enabled) {
		return history;
	}

	let cleanedHistory = [...history];
	let hasCleaned = false;

	// 按时间清理
	if (settings.timeLimit !== 'unlimited') {
		const timeOption = TIME_LIMIT_OPTIONS.find(opt => opt.value === settings.timeLimit);
		if (timeOption && timeOption.milliseconds) {
			const cutoffTime = Date.now() - timeOption.milliseconds;
			const expiredItems = cleanedHistory.filter(item => item.timestamp < cutoffTime);

			if (expiredItems.length > 0) {
				// 删除过期的本地图片
				for (const item of expiredItems) {
					try {
						if (item.localImagePath) {
							await uni.removeSavedFile({ filePath: item.localImagePath });
							console.log('自动清理: 删除过期图片', item.id);
						}
					} catch (e) {
						console.error('自动清理: 删除图片失败', item.localImagePath, e);
					}
				}

				cleanedHistory = cleanedHistory.filter(item => item.timestamp >= cutoffTime);
				hasCleaned = true;
				console.log(`自动清理: 已删除 ${expiredItems.length} 条过期记录`);
			}
		}
	}

	// 按数量清理
	if (settings.maxCount !== null && cleanedHistory.length > settings.maxCount) {
		const itemsToRemove = cleanedHistory.slice(settings.maxCount);

		// 删除超出数量的本地图片
		for (const item of itemsToRemove) {
			try {
				if (item.localImagePath) {
					await uni.removeSavedFile({ filePath: item.localImagePath });
					console.log('自动清理: 删除超出数量限制的图片', item.id);
				}
			} catch (e) {
				console.error('自动清理: 删除图片失败', item.localImagePath, e);
			}
		}

		cleanedHistory = cleanedHistory.slice(0, settings.maxCount);
		hasCleaned = true;
		console.log(`自动清理: 已删除 ${itemsToRemove.length} 条超出数量限制的记录`);
	}

	// 如果有清理操作，更新存储
	if (hasCleaned) {
		uni.setStorageSync(BROWSING_HISTORY_KEY, cleanedHistory);
	}

	return cleanedHistory;
}

// 获取浏览记录
export function getBrowsingHistory() : BrowsingHistoryItem[] {
	try {
		const history = uni.getStorageSync(BROWSING_HISTORY_KEY);
		return history || [];
	} catch (e) {
		console.error('获取浏览记录失败:', e);
		return [];
	}
}

// 下载图片到本地
async function downloadImageToLocal(imageUrl : string, artworkId : string) : Promise<string | null> {
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
export async function addBrowsingHistory(url : string, imageUrl : string) : Promise<void> {
	try {
		// 提取作品ID
		const match = url.match(/\/artworks\/(\d+)/);
		if (!match) {
			console.log('不是作品页面，不记录:', url);
			return;
		}

		const id = match[1];
		let history = getBrowsingHistory();

		// 执行自动清理
		history = await autoCleanHistory(history);

		// 检查是否已存在相同记录
		const existingIndex = history.findIndex(item => item.id === id);
		if (existingIndex !== -1) {
			// 如果已有记录，移动到最前面
			const existingItem = history.splice(existingIndex, 1)[0];
			// 更新时间戳
			existingItem.timestamp = Date.now();
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

		uni.setStorageSync(BROWSING_HISTORY_KEY, history);
		console.log('浏览记录已保存:', id, localImagePath);
	} catch (e) {
		console.error('保存浏览记录失败:', e);
	}
}

// 清除所有浏览记录
export async function clearBrowsingHistory() : Promise<void> {
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
export async function removeBrowsingHistory(id : string) : Promise<void> {
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

// 手动执行自动清理（用于页面加载时）
export async function performAutoClean() : Promise<BrowsingHistoryItem[]> {
	try {
		let history = getBrowsingHistory();
		const originalLength = history.length;
		history = await autoCleanHistory(history);

		if (history.length < originalLength) {
			console.log(`手动清理完成: 删除了 ${originalLength - history.length} 条记录`);
		}

		return history;
	} catch (e) {
		console.error('执行自动清理失败:', e);
		return getBrowsingHistory();
	}
}