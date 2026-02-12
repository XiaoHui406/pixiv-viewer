/**
 * 浏览记录设置类型定义
 */

/** 浏览记录时间限制选项 */
export type TimeLimitOption = 'unlimited' | '3months' | '6months' | '1year';

/** 浏览记录时间限制选项配置 */
export interface TimeLimitOptionConfig {
	label : string;
	value : TimeLimitOption;
	/** 对应的毫秒数，unlimited为null */
	milliseconds : number | null;
}

/** 浏览记录时间限制选项列表 */
export const TIME_LIMIT_OPTIONS : TimeLimitOptionConfig[] = [
	{ label: '无限制', value: 'unlimited', milliseconds: null },
	{ label: '3个月前', value: '3months', milliseconds: 3 * 30 * 24 * 60 * 60 * 1000 },
	{ label: '6个月前', value: '6months', milliseconds: 6 * 30 * 24 * 60 * 60 * 1000 },
	{ label: '1年前', value: '1year', milliseconds: 365 * 24 * 60 * 60 * 1000 }
];

export interface HistorySettings {
	/** 是否开启自动清理 */
	enabled : boolean;
	/** 最大浏览记录数量，null表示无限制 */
	maxCount : number | null;
	/** 时间限制，null表示无限制 */
	timeLimit : TimeLimitOption;
}

/**
 * 默认浏览记录设置
 */
export const defaultHistorySettings : HistorySettings = {
	enabled: false,
	maxCount: null,
	timeLimit: 'unlimited'
};

/**
 * 本地存储键名
 */
export const HISTORY_SETTINGS_KEY : string = 'history_settings';