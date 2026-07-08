import axios from 'axios';
import { getToken } from './auth';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const api = {
    get: async <T>(url: string): Promise<T> => {
        const response = await apiClient.get<T>(url);
        return response.data;
    },
    post: async <T>(url: string, data: any): Promise<T> => {
        const response = await apiClient.post<T>(url, data);
        return response.data;
    },
    put: async <T>(url: string, data: any): Promise<T> => {
        const response = await apiClient.put<T>(url, data);
        return response.data;
    },
    delete: async (url: string): Promise<void> => {
        await apiClient.delete(url);
    }
};