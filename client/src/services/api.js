import axios from 'axios';
import {cacheHospitals, enqueueRequest, getCachedHospitals} from '../utils/db';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Returns true when the error is a pure network failure (no server response)
function isNetworkError(error) {
  return !error.response && error.code !== 'ERR_CANCELED';
}

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

    // Add response interceptor to handle token refresh + offline queuing
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Queue write requests (POST/PUT/PATCH) when offline for later replay
        if (
            isNetworkError(error) &&
            originalRequest.method &&
            ['post', 'put', 'patch'].includes(originalRequest.method.toLowerCase()) &&
            !originalRequest._queued
        ) {
          originalRequest._queued = true;
          await enqueueRequest({
            url: originalRequest.baseURL
                ? originalRequest.baseURL + originalRequest.url
                : originalRequest.url,
            method: originalRequest.method.toUpperCase(),
            data: originalRequest.data ? JSON.parse(originalRequest.data) : null,
            headers: {},
          }).catch(() => {
          }); // never crash on queue failure
          const offlineError = new Error('You are offline. Request queued for replay.');
          offlineError.isOfflineQueued = true;
          return Promise.reject(offlineError);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
                refresh: refreshToken,
              });

              const { access } = response.data;
              localStorage.setItem('access_token', access);

              // Retry the original request with new token
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch {
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
    const response = await this.api.post('/api/auth/login/', {email, password});
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/api/auth/register/', userData);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/api/auth/logout/');
    return response.data;
  }

  async registerHospital(hospitalData) {
    const response = await this.api.post('/api/hospital/signup/', hospitalData);
    return response.data;
  }

  async getUserProfile() {
    const response = await this.api.get('/api/auth/me/');
    return response.data;
  }

  async updateUserProfile(userData) {
    const response = await this.api.put('/api/auth/me/', userData);
    return response.data;
  }

  async changePassword(passwordData) {
    const response = await this.api.post('/api/auth/change-password/', passwordData);
    return response.data;
  }

  async getDashboard() {
    const response = await this.api.get('/api/auth/dashboard/');
    return response.data;
  }

  // Ambulance endpoints
  async getAmbulanceDashboard() {
    const response = await this.api.get('/api/ambulance/ambulances/dashboard/');
    return response.data;
  }

  async getAmbulances() {
    const response = await this.api.get('/api/ambulance/ambulances/');
    return response.data;
  }

  async updateAmbulanceLocation(ambulanceId, locationData) {
    const response = await this.api.post(`/api/ambulance/ambulances/${ambulanceId}/update_location/`, locationData);
    return response.data;
  }

  async updateAmbulanceStatus(ambulanceId, status) {
    const response = await this.api.post(`/api/ambulance/ambulances/${ambulanceId}/update_status/`, { status });
    return response.data;
  }

  // Emergency endpoints
  async getEmergencies() {
    const response = await this.api.get('/api/ambulance/emergencies/');
    return response.data;
  }

  async createEmergency(emergencyData) {
    const response = await this.api.post('/api/ambulance/emergencies/', emergencyData);
    return response.data;
  }

  async getEmergency(id) {
    const response = await this.api.get(`/api/ambulance/emergencies/${id}/`);
    return response.data;
  }

  async updateEmergencyStatus(emergencyId, status) {
    const response = await this.api.post(`/api/ambulance/emergencies/${emergencyId}/update_status/`, { status });
    return response.data;
  }

  async assignHospital(emergencyId, hospitalId, isBackup = false, eta = null, distance = null) {
    const response = await this.api.post(`/api/ambulance/emergencies/${emergencyId}/assign_hospital/`, {
      hospital_id: hospitalId,
      is_backup: isBackup,
      ...(eta !== null && { eta }),
      ...(distance !== null && { distance }),
    });
    return response.data;
  }

  async recommendHospitals(params) {
    const response = await this.api.get('/api/ambulance/emergencies/recommend_hospitals/', { params });
    return response.data;
  }

  // Location tracking endpoints
  async getLocationUpdates(ambulanceId) {
    const response = await this.api.get('/api/ambulance/location-updates/', {
      params: { ambulance: ambulanceId }
    });
    return response.data;
  }

  async createLocationUpdate(locationData) {
    const response = await this.api.post('/api/ambulance/location-updates/', locationData);
    return response.data;
  }

  // Hospital endpoints
  async getHospitals() {
    try {
      const response = await this.api.get('/api/hospital/hospitals/');
      // Opportunistically cache for offline use
      const list = Array.isArray(response.data) ? response.data : response.data.results || [];
      cacheHospitals(list).catch(() => {
      });
      return response.data;
    } catch (err) {
      if (isNetworkError(err)) {
        return getCachedHospitals();
      }
      throw err;
    }
  }

  async getHospital(hospitalId) {
    const response = await this.api.get(`/api/hospital/hospitals/${hospitalId}/`);
    return response.data;
  }

  async updateHospital(hospitalId, data) {
    const response = await this.api.patch(`/api/hospital/hospitals/${hospitalId}/`, data);
    return response.data;
  }

  async setupHospitalDefaults(hospitalId) {
    const response = await this.api.post(`/api/hospital/hospitals/${hospitalId}/setup_defaults/`);
    return response.data;
  }

  async createDepartment(data) {
    const response = await this.api.post('/api/hospital/departments/', data);
    return response.data;
  }

  async updateDepartment(deptId, data) {
    const response = await this.api.patch(`/api/hospital/departments/${deptId}/`, data);
    return response.data;
  }

  async deleteDepartment(deptId) {
    await this.api.delete(`/api/hospital/departments/${deptId}/`);
  }

  async updateEquipment(equipmentId, data) {
    const response = await this.api.patch(`/api/hospital/equipment/${equipmentId}/`, data);
    return response.data;
  }

  async getHospitalDashboardStats(hospitalId) {
    const response = await this.api.get('/api/hospital/dashboard/stats/', { params: { hospital_id: hospitalId } });
    return response.data;
  }

  async getRecentAlerts(hospitalId) {
    const response = await this.api.get('/api/hospital/dashboard/recent_alerts/', { params: { hospital_id: hospitalId } });
    return response.data;
  }

  async getDepartmentStatus(hospitalId) {
    const response = await this.api.get('/api/hospital/dashboard/department_status/', { params: { hospital_id: hospitalId } });
    return response.data;
  }

  async getHospitalAlerts(hospitalId, filters = {}) {
    const response = await this.api.get('/api/hospital/emergency-alerts/', { params: { hospital_id: hospitalId, ...filters } });
    return response.data;
  }

  async acknowledgeAlert(alertId) {
    const response = await this.api.post(`/api/hospital/emergency-alerts/${alertId}/acknowledge/`);
    return response.data;
  }

  async rejectAlert(alertId) {
    const response = await this.api.post(`/api/hospital/emergency-alerts/${alertId}/reject/`);
    return response.data;
  }

  async getDepartments(hospitalId) {
    const response = await this.api.get('/api/hospital/departments/', { params: { hospital_id: hospitalId } });
    return response.data;
  }

  async updateDepartmentAvailability(deptId, data) {
    const response = await this.api.patch(`/api/hospital/departments/${deptId}/update_availability/`, data);
    return response.data;
  }

  async getBloodInventory(hospitalId) {
    const response = await this.api.get('/api/hospital/blood-inventory/', { params: { hospital_id: hospitalId } });
    return response.data;
  }

  async updateBloodInventory(inventoryId, data) {
    const response = await this.api.patch(`/api/hospital/blood-inventory/${inventoryId}/`, data);
    return response.data;
  }

  async getEquipment(hospitalId) {
    const response = await this.api.get('/api/hospital/equipment/', { params: { hospital_id: hospitalId } });
    return response.data;
  }

  async toggleEquipment(equipmentId, isAvailable) {
    const response = await this.api.patch(`/api/hospital/equipment/${equipmentId}/toggle_availability/`, { is_available: isAvailable });
    return response.data;
  }

  async getPatientReferrals(hospitalId, type = null, statusFilter = null) {
    const params = { hospital_id: hospitalId };
    if (type) params.type = type;
    if (statusFilter) params.status = statusFilter;
    const response = await this.api.get('/api/hospital/patient-referrals/', { params });
    return response.data;
  }

  async createReferral(data) {
    const response = await this.api.post('/api/hospital/patient-referrals/', data);
    return response.data;
  }

  async acceptReferral(referralId) {
    const response = await this.api.post(`/api/hospital/patient-referrals/${referralId}/accept/`);
    return response.data;
  }

  async rejectReferral(referralId, notes = '') {
    const response = await this.api.post(`/api/hospital/patient-referrals/${referralId}/reject/`, { notes });
    return response.data;
  }

  // ── File Upload endpoints ────────────────────────────────────────────────

  /**
   * Upload a single file.
   * @param {File}   file
   * @param {string} fileType  - 'voice_note' | 'medical_document' | 'patient_photo'
   * @param {object} links     - { emergencyId?, referralId? }
   * @param {function} onProgress - optional (percentComplete: number) => void
   */
  async uploadFile(file, fileType, {emergencyId, referralId} = {}, onProgress) {
    const form = new FormData();
    form.append('file', file);
    form.append('file_type', fileType);
    if (emergencyId) form.append('emergency_id', emergencyId);
    if (referralId) form.append('referral_id', referralId);

    const response = await this.api.post('/api/uploads/', form, {
      headers: {'Content-Type': 'multipart/form-data'},
      onUploadProgress: onProgress
          ? (e) => onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0)
          : undefined,
    });
    return response.data;
  }

  async getUploads({emergencyId, referralId} = {}) {
    const params = {};
    if (emergencyId) params.emergency = emergencyId;
    if (referralId) params.referral = referralId;
    const response = await this.api.get('/api/uploads/', {params});
    return response.data;
  }

  async deleteUpload(uploadId) {
    await this.api.delete(`/api/uploads/${uploadId}/`);
  }

  // ── Web Push endpoints ───────────────────────────────────────────────────

  async getVapidPublicKey() {
    const response = await this.api.get('/api/auth/push/vapid-public-key/');
    return response.data;
  }

  async pushSubscribe(subscription) {
    const response = await this.api.post('/api/auth/push/subscribe/', subscription);
    return response.data;
  }

  async pushUnsubscribe(data = {}) {
    const response = await this.api.delete('/api/auth/push/unsubscribe/', {data});
    return response.data;
  }
}

export default new ApiService();
