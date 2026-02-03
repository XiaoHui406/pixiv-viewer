import { ref } from 'vue';
import type { AdBlockSettings } from '../types/adblock';
import { defaultAdBlockSettings, STORAGE_KEY } from '../types/adblock';

/**
 * 广告屏蔽设置管理
 */
export function useAdBlockSettings() {
	const settings = ref<AdBlockSettings>({ ...defaultAdBlockSettings });

	/**
	 * 从本地存储加载设置
	 */
	const loadSettings = () : void => {
		try {
			const stored = uni.getStorageSync(STORAGE_KEY);
			if (stored) {
				settings.value = { ...defaultAdBlockSettings, ...stored };
			}
		} catch (e) {
			console.error('加载广告屏蔽设置失败:', e);
		}
	};

	/**
	 * 保存设置到本地存储
	 */
	const saveSettings = () : void => {
		try {
			uni.setStorageSync(STORAGE_KEY, settings.value);
		} catch (e) {
			console.error('保存广告屏蔽设置失败:', e);
		}
	};

	/**
	 * 更新单个设置项
	 */
	const updateSetting = <K extends keyof AdBlockSettings>(
		key : K,
		value : AdBlockSettings[K]
	) : void => {
		settings.value[key] = value;
		saveSettings();
	};

	/**
	 * 重置为默认设置
	 */
	const resetSettings = () : void => {
		settings.value = { ...defaultAdBlockSettings };
		saveSettings();
	};

	return {
		settings,
		loadSettings,
		saveSettings,
		updateSetting,
		resetSettings
	};
}