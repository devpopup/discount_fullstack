import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Using ngrok tunnel to access local backend from mobile device
const API_BASE_URL = 'https://858447379145.ngrok-free.app/api/v1';
const TOKEN_KEY = '@auth_token';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

// Auth helpers
export const setAuthToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export default apiClient;
