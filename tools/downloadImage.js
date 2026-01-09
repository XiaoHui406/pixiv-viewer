import request from '@/tools/request.js'

/**
 * 下载并保存图片到相册 (最终修复版)
 */
export const downloadImageToDirectory = async (url) => {
	try {
		console.log('开始处理图片:', url);

		// 1. 获取图片二进制数据
		const response = await request.get(url, {
			responseType: 'arraybuffer',
		});

		// 2. 转为 Base64
		const base64Data = uni.arrayBufferToBase64(response.data);

		// 3. 写入临时文件
		const tempFilePath = await saveToTempFile(base64Data, url);

		// 4. 保存到相册
		return new Promise((resolve, reject) => {
			uni.saveImageToPhotosAlbum({
				filePath: tempFilePath,
				success: () => {
					console.log(tempFilePath);
					// deleteTempFile(tempFilePath); // 清理
					uni.showToast({
						title: '已保存至相册',
						icon: 'success'
					});
					resolve(tempFilePath);
				},
				fail: (err) => {
					// deleteTempFile(tempFilePath);
					uni.showToast({
						title: '保存相册失败',
						icon: 'none'
					});
					reject(err);
				}
			});
		});
	} catch (error) {
		console.error('下载失败:', error);
		throw error;
	}
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
								absolutePath = absolutePath.substring(7); // 去掉 file:// 前缀
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