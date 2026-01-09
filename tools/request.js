import axios from 'axios'
import {
	createUniAppAxiosAdapter
} from '@uni-helper/axios-adapter'

const instance = axios.create({
	adapter: createUniAppAxiosAdapter(),
	timeout: 10000,
	headers: {
		"Referer": "https://www.pixiv.net/"
	}
});

export default instance;