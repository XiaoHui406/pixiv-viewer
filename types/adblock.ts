/**
 * 广告屏蔽设置类型定义
 */

export interface AdBlockSettings {
	/** 是否开启基本广告屏蔽 */
	basicAds : boolean;
	/** 是否开启Pixiv高级会员相关屏蔽 */
	premiumAds : boolean;
	/** 是否开启画师BOOTH相关屏蔽 */
	boothAds : boolean;
}

/**
 * 默认广告屏蔽设置
 */
export const defaultAdBlockSettings : AdBlockSettings = {
	basicAds: true,
	premiumAds: false,
	boothAds: false
};

/**
 * 本地存储键名
 */
export const STORAGE_KEY : string = 'adblock_settings';