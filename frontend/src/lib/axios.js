import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

export const useAxios = () => {
  const { getToken } = useAuth();

  const axiosInstance = axios.create({
    baseURL: '/api', // Proxied to backend by Vite (see vite.config.js)
  });

  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getToken({ template: "default" });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return axiosInstance;
};
