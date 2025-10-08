class AuthManager {
    constructor() {
      this.baseURL = 'https://route-app.onrender.com/api';
      this.token = localStorage.getItem('authToken');
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }
  
    async login(email, password) {
      try {
        const response = await fetch(`${this.baseURL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'omit' // 'include' yerine 'omit' kullanıyoruz
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        
        // Save token and user data
        this.token = data.token;
        this.user = data.user;
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return { success: true, data };
        
      } catch (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.message || 'Login failed. Please try again.' 
        };
      }
    }
  
    async register(name, email, password) {
      try {
        const response = await fetch(`${this.baseURL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
          credentials: 'omit'
        });
  
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        
        // Save token and user data
        this.token = data.token;
        this.user = data.user;
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        return { success: true, data };
        
      } catch (error) {
        console.error('Registration error:', error);
        return { 
          success: false, 
          error: error.message || 'Registration failed. Please try again.' 
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
      return !!this.token && !!this.user;
    }
  
    getToken() {
      return this.token;
    }
  
    getUser() {
      return this.user;
    }
  
    // API istekleri için auth header
    getAuthHeaders() {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      };
    }
  }
  
  // Global auth instance
  const authManager = new AuthManager();