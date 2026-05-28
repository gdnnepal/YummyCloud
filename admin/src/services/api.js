const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class AdminApi {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    try {
      const data = JSON.parse(localStorage.getItem('admin-auth'));
      return data?.token || null;
    } catch { return null; }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      localStorage.removeItem('admin-auth');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const data = await response.json();
    if (!response.ok) {
      if (data.license_error) {
        window.dispatchEvent(new CustomEvent('license-error', { detail: data.message }));
        return Promise.reject({ silent: true });
      }
      throw { status: response.status, message: data.message, errors: data.errors };
    }
    return data;
  }

  async upload(endpoint, formData) {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw { status: response.status, message: data.message };
    return data;
  }

  // Auth
  login(phone, password) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }); }
  logout() { return this.request('/auth/logout', { method: 'POST' }); }

  // Dashboard
  getDashboard(params = '') { return this.request(`/admin/dashboard${params}`); }

  // Orders
  getOrders(params = '') { return this.request(`/admin/orders${params}`); }
  getOrder(id) { return this.request(`/admin/orders/${id}`); }
  updateOrderStatus(id, status) { return this.request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); }
  assignDelivery(orderId, partnerId) { return this.request(`/admin/orders/${orderId}/assign`, { method: 'PUT', body: JSON.stringify({ delivery_partner_id: partnerId }) }); }

  // Menu
  getCategories() { return this.request('/admin/categories'); }
  createCategory(data) { return this.request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }); }
  updateCategory(id, data) { return this.request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteCategory(id) { return this.request(`/admin/categories/${id}`, { method: 'DELETE' }); }
  getMenuItems() { return this.request('/admin/menu-items'); }
  createMenuItem(data) { return this.request('/admin/menu-items', { method: 'POST', body: JSON.stringify(data) }); }
  updateMenuItem(id, data) { return this.request(`/admin/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteMenuItem(id) { return this.request(`/admin/menu-items/${id}`, { method: 'DELETE' }); }
  toggleMenuItemAvailability(id) { return this.request(`/admin/menu-items/${id}/toggle`, { method: 'PUT' }); }

  // Users
  getUsers() { return this.request('/admin/users'); }
  getUser(id) { return this.request(`/admin/users/${id}`); }

  // Coupons
  getCoupons() { return this.request('/admin/coupons'); }
  createCoupon(data) { return this.request('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }); }
  updateCoupon(id, data) { return this.request(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteCoupon(id) { return this.request(`/admin/coupons/${id}`, { method: 'DELETE' }); }

  // Messages
  sendMessage(data) { return this.request('/admin/messages', { method: 'POST', body: JSON.stringify(data) }); }
  getMessages() { return this.request('/admin/messages'); }

  // Refunds
  getRefunds() { return this.request('/admin/refunds'); }
  processRefund(id, status, note) { return this.request(`/admin/refunds/${id}`, { method: 'PUT', body: JSON.stringify({ status, admin_note: note }) }); }

  // Delivery Partners
  getDeliveryPartners() { return this.request('/admin/delivery-partners'); }
}

const api = new AdminApi();
export default api;
