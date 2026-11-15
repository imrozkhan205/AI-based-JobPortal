import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

export const useAxios = () => {
  const { getToken } = useAuth();

  const axiosInstance = axios.create({
    baseURL: `${API_BASE_URL}/api`,
  });

  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getToken({ template: 'default' });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return axiosInstance;
};
