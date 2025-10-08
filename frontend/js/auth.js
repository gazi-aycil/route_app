// auth.js - Basit ve çalışan versiyon
class AuthManager {
    constructor() {
      // NET bir şekilde baseURL tanımla
      this.baseURL = 'https://route-app.onrender.com/api';
      this.token = localStorage.getItem('authToken') || null;
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
      
      console.log('🎯 AuthManager initialized');
      console.log('🔗 BaseURL:', this.baseURL);
    }
  
    async login(email, password) {
      try {
        console.log('📤 Login request to:', `${this.baseURL}/auth/login`);
        
        const response = await fetch(`${this.baseURL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password })
        });
  
        console.log('📥 Response status:', response.status);
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Login success');
        
        // Save data
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return { success: true, data };
        
      } catch (error) {
        console.error('❌ Login error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  
    async register(name, email, password) {
      try {
        console.log('📤 Register request to:', `${this.baseURL}/auth/register`);
        
        const response = await fetch(`${this.baseURL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password })
        });
  
        console.log('📥 Response status:', response.status);
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Registration success');
        
        // Save data
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return { success: true, data };
        
      } catch (error) {
        console.error('❌ Registration error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      console.log('🚪 Logged out');
    }
  
    isAuthenticated() {
      return !!this.token;
    }
  
    getToken() {
      return this.token;
    }
  
    getUser() {
      return this.user;
    }
  }
  
  // Global instance oluştur - EN ÖNEMLİ KISIM
  const authManager = new AuthManager();
  
  // Debug için global erişim
  window.authManager = authManager;
  
  console.log('🚀 AuthManager loaded, baseURL:', authManager.baseURL);