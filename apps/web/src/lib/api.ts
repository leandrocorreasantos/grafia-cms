import axios from 'axios';
import { getToken } from './auth';

export const apiClient = axios.create({
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
    post: async <T>(url: string, data: any, config?: Record<string, unknown>): Promise<T> => {
        const response = await apiClient.post<T>(url, data, config);
        return response.data;
    },
    put: async <T>(url: string, data: any): Promise<T> => {
        const response = await apiClient.put<T>(url, data);
        return response.data;
    },
    delete: async <T = void>(url: string): Promise<T> => {
        const response = await apiClient.delete<T>(url);
        return response.data;
    },
    postForm: async <T>(url: string, data: FormData, config?: Record<string, unknown>): Promise<T> => {
        const response = await apiClient.post<T>(url, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            ...config,
        });
        return response.data;
    }
};