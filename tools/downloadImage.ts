/**
 * 下载并保存图片到相册 (最终修复版)
 * 使用原生下载器下载图片 (支持 Referer 且节省内存)
 */
export const downloadImageToDirectory = (url : string) : Promise<unknown> => {
	return new Promise((resolve, reject) => {
		console.log('开始原生下载:', url);

		// 1. 创建下载任务
		const downloadTask = plus.downloader.createDownload(url, {
			// 指定下载路径，_doc/ 为应用私有文档目录
			filename: '_doc/download/' + Date.now() + '.jpg'
		}, (download, status) => {
			// 下载完成回调
			if (status == 200) {
				console.log('文件下载成功:', download.filename);

				// 2. 将下载完成的临时文件保存到系统相册
				uni.saveImageToPhotosAlbum({
					filePath: download.filename,
					success: () => {
						uni.showToast({
							title: '已保存至相册',
							icon: 'success'
						});
						// 3. 清理临时文件（可选）
						plus.io.resolveLocalFileSystemURL(download.filename, (
							entry) => {
							entry.remove();
						});
						resolve(download.filename);
					},
					fail: (err) => {
						uni.showToast({
							title: '保存相册失败',
							icon: 'none'
						});
						reject(err);
					}
				});
			} else {
				console.error('下载失败状态码:', status);
				uni.showToast({
					title: '下载失败',
					icon: 'none'
				});
				reject(new Error('Download failed'));
			}
		});

		// 4. 设置关键 Header
		downloadTask.setRequestHeader('Referer', 'https://www.pixiv.net/');
		downloadTask.setRequestHeader('User-Agent',
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		// 5. 启动任务
		downloadTask.start();
	});
};