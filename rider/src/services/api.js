const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class RiderApi {
  constructor() { this.baseUrl = API_BASE_URL; }

  getToken() {
    try { return JSON.parse(localStorage.getItem('rider-auth'))?.token || null; }
    catch { return null; }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...options.headers };
    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    if (response.status === 401) { localStorage.removeItem('rider-auth'); window.location.href = '/login'; throw new Error('Unauthorized'); }
    const data = await response.json();
    if (!response.ok) throw { status: response.status, message: data.message };
    return data;
  }

  login(phone, password) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }); }
  logout() { return this.request('/auth/logout', { method: 'POST' }); }
  getAssignedOrders() { return this.request('/rider/orders'); }
  getOrder(id) { return this.request(`/rider/orders/${id}`); }
  updateStatus(id, status) { return this.request(`/rider/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); }
  getStats() { return this.request('/rider/stats'); }
}

const api = new RiderApi();
export default api;
