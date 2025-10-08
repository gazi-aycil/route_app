// auth.js - FRONTEND
class AuthManager {
  constructor() {
    // RENDER BACKEND URL - DEĞİŞTİRME!
    this.baseURL = 'https://route-app.onrender.com/api';
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    
    console.log('🎯 AuthManager started with URL:', this.baseURL);
  }

  async login(email, password) {
    try {
      console.log('📤 Sending login to:', `${this.baseURL}/auth/login`);
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ Login successful');
      }

      return data;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  async register(name, email, password) {
    try {
      console.log('📤 Sending register to:', `${this.baseURL}/auth/register`);
      
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      console.log('📥 Register response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ Registration successful');
      }

      return data;
      
    } catch (error) {
      console.error('❌ Register error:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Global instance
const authManager = new AuthManager();