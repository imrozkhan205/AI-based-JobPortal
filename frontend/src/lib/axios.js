import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

export const useAxios = () => {
  const { getToken } = useAuth();

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
  });

  axiosInstance.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return axiosInstance;
};
