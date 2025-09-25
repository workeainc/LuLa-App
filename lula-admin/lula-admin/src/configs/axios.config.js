import axios from "axios";
import store from "../store";
import { clearAuth } from "../store/slice/auth";

const unauthorizedCode = [401];

const baseURL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'}/api`;

export const axiosInstance = axios.create({
  timeout: 60000,
  baseURL: baseURL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    let accessToken;

    if (!accessToken) {
      const { auth } = store.getState();
      accessToken = auth.token;
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response && unauthorizedCode.includes(response.status)) {
      store.dispatch(clearAuth());
      location.replace("/");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
