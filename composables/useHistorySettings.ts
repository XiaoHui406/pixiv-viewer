import { ref } from 'vue';
import type { HistorySettings } from '../types/historySettings';
import { defaultHistorySettings, HISTORY_SETTINGS_KEY } from '../types/historySettings';

/**
 * 浏览记录设置管理
 */
export function useHistorySettings() {
	const settings = ref<HistorySettings>({ ...defaultHistorySettings });

	/**
	 * 从本地存储加载设置
	 */
	const loadSettings = (): void => {
		try {
			const stored = uni.getStorageSync(HISTORY_SETTINGS_KEY);
			if (stored) {
				settings.value = { ...defaultHistorySettings, ...stored };
			}
		} catch (e) {
			console.error('加载浏览记录设置失败:', e);
		}
	};

	/**
	 * 保存设置到本地存储
	 */
	const saveSettings = (): void => {
		try {
			uni.setStorageSync(HISTORY_SETTINGS_KEY, settings.value);
		} catch (e) {
			console.error('保存浏览记录设置失败:', e);
		}
	};

	/**
	 * 更新单个设置项
	 */
	const updateSetting = <K extends keyof HistorySettings>(
		key: K,
		value: HistorySettings[K]
	): void => {
		settings.value[key] = value;
		saveSettings();
	};

	/**
	 * 重置为默认设置
	 */
	const resetSettings = (): void => {
		settings.value = { ...defaultHistorySettings };
		saveSettings();
	};

	/**
	 * 获取设置（用于非组件场景）
	 */
	const getSettings = (): HistorySettings => {
		try {
			const stored = uni.getStorageSync(HISTORY_SETTINGS_KEY);
			if (stored) {
				return { ...defaultHistorySettings, ...stored };
			}
		} catch (e) {
			console.error('获取浏览记录设置失败:', e);
		}
		return { ...defaultHistorySettings };
	};

	return {
		settings,
		loadSettings,
		saveSettings,
		updateSetting,
		resetSettings,
		getSettings
	};
}
