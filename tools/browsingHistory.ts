// 浏览记录存储键
const BROWSING_HISTORY_KEY = 'pixiv_browsing_history';

// 浏览记录项接口
export interface BrowsingHistoryItem {
	id : string;
	url : string;
	imageUrl : string;
	timestamp : number;
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

// 添加浏览记录
export function addBrowsingHistory(url : string, imageUrl : string) : void {
	try {
		const history = getBrowsingHistory();

		// 提取作品ID
		const match = url.match(/\/artworks\/(\d+)/);
		if (!match) {
			console.log('不是作品页面，不记录:', url);
			return;
		}

		const id = match[1];

		// 检查是否已存在相同记录
		const existingIndex = history.findIndex(item => item.id === id);
		if (existingIndex !== -1) {
			// 移除旧记录，新记录会添加到最前面
			history.splice(existingIndex, 1);
		}

		// 添加新记录到最前面
		history.unshift({
			id,
			url,
			imageUrl,
			timestamp: Date.now()
		});

		// 限制最多保存100条记录
		const maxHistory = 100;
		if (history.length > maxHistory) {
			history.splice(maxHistory);
		}

		uni.setStorageSync(BROWSING_HISTORY_KEY, history);
		console.log('浏览记录已保存:', id);
	} catch (e) {
		console.error('保存浏览记录失败:', e);
	}
}

// 清除所有浏览记录
export function clearBrowsingHistory() : void {
	try {
		uni.removeStorageSync(BROWSING_HISTORY_KEY);
	} catch (e) {
		console.error('清除浏览记录失败:', e);
	}
}

// 删除单条浏览记录
export function removeBrowsingHistory(id : string) : void {
	try {
		const history = getBrowsingHistory();
		const filtered = history.filter(item => item.id !== id);
		uni.setStorageSync(BROWSING_HISTORY_KEY, filtered);
	} catch (e) {
		console.error('删除浏览记录失败:', e);
	}
}