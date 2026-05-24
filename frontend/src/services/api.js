const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    try {
      const authData = JSON.parse(localStorage.getItem('auth-storage'));
      return authData?.state?.token || null;
    } catch {
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      // Token expired - clear auth
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, message: data.message || 'Something went wrong', errors: data.errors, otp: data.otp };
    }

    return data;
  }

  async uploadRequest(endpoint, formData) {
    const token = this.getToken();
    const headers = {
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw { status: response.status, message: data.message || 'Something went wrong', errors: data.errors };
    }

    return data;
  }

  // Auth
  login(phone, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  register(name, phone, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password }),
    });
  }

  verifyOtp(phone, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  sendOtp(phone) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  resetPassword(phone, otp, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, password }),
    });
  }

  // Menu
  getCategories() {
    return this.request('/categories');
  }

  getPublicSettings() {
    return this.request('/settings/public');
  }

  getMenuItems(categoryId = null) {
    const query = categoryId ? `?category=${categoryId}` : '';
    return this.request(`/menu${query}`);
  }

  searchMenu(query) {
    return this.request(`/menu/search?q=${encodeURIComponent(query)}`);
  }

  // Orders
  placeOrder(orderData) {
    // If there's a screenshot file, use FormData
    if (orderData.payment_screenshot) {
      const formData = new FormData();
      formData.append('address', orderData.address);
      formData.append('payment_method', orderData.payment_method);
      formData.append('use_wallet', orderData.use_wallet ? '1' : '0');
      if (orderData.coupon_code) formData.append('coupon_code', orderData.coupon_code);
      if (orderData.note) formData.append('note', orderData.note);
      formData.append('payment_screenshot', orderData.payment_screenshot);
      orderData.items.forEach((item, i) => {
        formData.append(`items[${i}][id]`, item.id);
        formData.append(`items[${i}][quantity]`, item.quantity);
      });
      return this.uploadRequest('/orders', formData);
    }
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  getOrders() {
    return this.request('/orders');
  }

  getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  cancelOrder(id, reason) {
    return this.request(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Addresses
  getAddresses() {
    return this.request('/addresses');
  }

  addAddress(data) {
    return this.request('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAddress(id, data) {
    return this.request(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteAddress(id) {
    return this.request(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  // Wallet
  getWallet() {
    return this.request('/wallet');
  }

  getTransactions() {
    return this.request('/wallet/transactions');
  }

  // Coupons
  validateCoupon(code, total) {
    return this.request('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, total }),
    });
  }

  // Profile
  getProfile() {
    return this.request('/profile');
  }

  updateProfile(data) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  changePassword(currentPassword, newPassword) {
    return this.request('/profile/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  }

  // Messages
  getMessages() {
    return this.request('/messages');
  }

  getUnreadCount() {
    return this.request('/messages/unread-count');
  }

  markMessageRead(id) {
    return this.request(`/messages/${id}/read`, { method: 'POST' });
  }

  markAllMessagesRead() {
    return this.request('/messages/read-all', { method: 'POST' });
  }

  // Ratings
  rateOrder(orderId, rating, review) {
    return this.request(`/orders/${orderId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  }
}

const api = new ApiService();
export default api;
