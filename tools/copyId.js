/**
 * 从Pixiv URL中提取作品ID或画师ID
 * @param {string} url - Pixiv URL
 * @returns {Object} 包含类型和ID的对象
 */
export function extractIdFromUrl(url) {
	console.log("copyid.js url=" + url);
	if (!url || typeof url !== 'string') {
		return {
			type: null,
			id: null
		};
	}

	try {
		// 检查是否为作品页面
		const artworkMatch = url.match(/\/artworks\/(\d+)/);
		console.log('artworkMatch=' + artworkMatch);
		if (artworkMatch) {
			return {
				type: 'artwork',
				id: artworkMatch[1]
			};
		}

		// 检查是否为画师页面
		const userMatch = url.match(/\/users\/(\d+)/);
		console.log('userMatch=' + userMatch);
		if (userMatch) {
			return {
				type: 'user',
				id: userMatch[1]
			};
		}

		// 检查其他可能的URL格式
		// 例如：/member_illust.php?mode=medium&illust_id=139731500
		if (url.includes('member_illust.php')) {
			const illustIdMatch = url.match(/[?&]illust_id=(\d+)/);
			if (illustIdMatch) {
				return {
					type: 'artwork',
					id: illustIdMatch[1]
				};
			}
		}

		// 例如：/member.php?id=3388329
		if (url.includes('member.php')) {
			const userIdMatch = url.match(/[?&]id=(\d+)/);
			if (userIdMatch) {
				return {
					type: 'user',
					id: userIdMatch[1]
				};
			}
		}

		return {
			type: null,
			id: null
		};
	} catch (error) {
		console.error('解析URL失败:', error);
		return {
			type: null,
			id: null
		};
	}
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyToClipboard(text) {
	if (!text) {
		return false;
	}

	try {
		// 在uniapp中使用uni.setClipboardData
		return new Promise((resolve) => {
			uni.setClipboardData({
				data: text,
				success: () => {
					uni.hideToast()
					resolve(true);
				},
				fail: (error) => {
					console.error('复制失败:', error);
					uni.showToast({
						title: '复制失败',
						icon: 'none',
						duration: 1500
					});
					resolve(false);
				}
			});
		});
	} catch (error) {
		console.error('复制文本失败:', error);
		return false;
	}
}

/**
 * 检查当前URL并复制对应的ID
 * @param {string} url - 当前URL
 * @returns {Promise<boolean>} 是否成功复制
 */
export async function copyIdFromCurrentUrl(url) {
	const {
		type,
		id
	} = extractIdFromUrl(url);

	if (!type || !id) {
		// 当前URL不是作品或画师页面
		uni.showToast({
			title: '当前页面不支持复制ID',
			icon: 'none',
			duration: 2000
		});
		return false;
	}

	const typeName = type === 'artwork' ? '作品' : '画师';
	const success = await copyToClipboard(id);

	if (success) {
		// uni.showToast({
		// 	title: `已复制${typeName}ID: ${id}`,
		// 	icon: 'success',
		// 	duration: 2000
		// });
		uni.showModal({
			content: `已复制${typeName}ID: ${id} 至剪贴板`,
			showCancel: false
		})
	}

	return success;
}