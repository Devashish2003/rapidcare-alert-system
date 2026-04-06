import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              localStorage.setItem('access_token', access);

              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.api.post('/users/login/', { email, password });
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/users/register/', userData);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/users/logout/');
    return response.data;
  }

  async getUserProfile() {
    const response = await this.api.get('/users/me/');
    return response.data;
  }

  async updateUserProfile(userData) {
    const response = await this.api.put('/users/me/', userData);
    return response.data;
  }

  async changePassword(passwordData) {
    const response = await this.api.post('/users/change-password/', passwordData);
    return response.data;
  }

  async getDashboard() {
    const response = await this.api.get('/users/dashboard/');
    return response.data;
  }
}

export default new ApiService();
