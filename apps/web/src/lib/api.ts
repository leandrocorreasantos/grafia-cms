import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
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