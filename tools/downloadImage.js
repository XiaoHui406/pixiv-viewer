/**
 * 下载并保存图片到相册 (最终修复版)
 * 使用原生下载器下载图片 (支持 Referer 且节省内存)
 */
export const downloadImageToDirectory = (url) => {
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

/**
 * 修复版的写入函数
 * 解决“文件损坏”和“写入失败”的核心
 */
const saveToTempFile = (base64Data, originalUrl) => {
	return new Promise((resolve, reject) => {
		const fileName = `temp_${Date.now()}.jpg`;

		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
			fs.root.getFile(fileName, {
				create: true
			}, (fileEntry) => {
				fileEntry.createWriter((fileWriter) => {

					fileWriter.onwriteend = () => {
						resolve(fileEntry.fullPath);
					};

					fileWriter.onerror = (e) => {
						reject(new Error('写入失败: ' + e.message));
					};

					// --- 核心修复：手动构建二进制流 ---
					try {
						// 1. 去掉 base64 前缀
						const pureBase64 = base64Data.replace(
							/^data:image\/\w+;base64,/, "");

						// 2. 在 App 环境下，使用 plus.android / plus.ios 的原生能力写入（最稳健）
						if (plus.os.name === 'Android') {
							// Android 特有：直接通过 Java 层写入文件，绕过 FileWriter 的编码问题
							const NativeFile = plus.android.importClass(
								"java.io.File");
							const FileOutputStream = plus.android.importClass(
								"java.io.FileOutputStream");
							const Base64 = plus.android.importClass(
								"android.util.Base64");

							// 获取文件的真实绝对路径（修复版）
							// 使用 plus.io.convertLocalFileSystemURL 将 _www 等路径转为真实路径
							let absolutePath = fileEntry.fullPath;
							if (absolutePath.startsWith('file://')) {
								absolutePath = absolutePath.substring(
									7); // 去掉 file:// 前缀
							}

							const file = new NativeFile(absolutePath);
							const fos = new FileOutputStream(file);

							// 解码 Base64 并写入
							const bytes = Base64.decode(pureBase64,
								0); // 0 为 Base64.DEFAULT
							fos.write(bytes);
							fos.close();

							// 模拟 FileWriter 完成回调
							setTimeout(() => {
								resolve(fileEntry.fullPath);
							}, 100);
						} else {
							// iOS 或其他：尝试使用 blob (iOS 对 Blob 支持较好)
							const arrayBuffer = uni.base64ToArrayBuffer(pureBase64);
							const blob = new Blob([arrayBuffer], {
								type: 'image/jpeg'
							});
							fileWriter.write(blob);
						}
					} catch (err) {
						reject(new Error('原生写入失败: ' + err.message));
					}
				});
			}, (e) => reject(e));
		}, (e) => reject(e));
	});
};

/**
 * 清理函数
 */
const deleteTempFile = (fullPath) => {
	if (plus.os.name === 'Android') {
		try {
			const NativeFile = plus.android.importClass("java.io.File");
			// 将相对路径转为绝对路径
			const absolutePath = plus.io.convertLocalFileSystemURL(fullPath);
			const file = new NativeFile(absolutePath);
			if (file.exists()) {
				const result = file.delete(); // 直接调用系统级物理删除
				console.log(result ? '原生删除成功' : '原生删除失败');
			}
		} catch (e) {
			console.error('原生删除异常:', e);
		}
	} else {
		// iOS 保持原有逻辑即可，iOS 很少出现 0B 残留
		plus.io.resolveLocalFileSystemURL(fullPath, (entry) => {
			entry.remove();
		});
	}
};

/**
 * 简单提取文件名
 */
const getFileNameFromUrl = (url) => {
	const parts = url.split('/');
	return parts[parts.length - 1].split('?')[0] || 'image.jpg';
};