import axios from 'axios'
import store from '../store/store'
import { clearAuth } from '../store/slices/auth'

const unauthorizedCode = [401]

const baseURL = 'http://13.53.137.157:5002/api';
// const baseURL = 'http://sovo-env.eba-3aycdmpe.ca-central-1.elasticbeanstalk.com/api/v1';

export const axiosInstance = axios.create({
    timeout: 60000,
    baseURL: baseURL,
})

axiosInstance.interceptors.request.use(
    (config) => {
        

        // For form data requests, ensure proper handling
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
            // Prevent data transformation
            config.transformRequest = [(data) => data];
        }


        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error

        if (response && unauthorizedCode.includes(response.status)) {
            store.dispatch(clearAuth())
            location.replace('/')
        }

        return Promise.reject(error)
    }
)

export default axiosInstance
