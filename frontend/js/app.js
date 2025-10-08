// app.js
class SahaSatisApp {
    constructor() {
      this.authManager = window.authManager; // Global instance kullan
      this.init();
    }
  
    init() {
      console.log('🔄 App initializing...');
      this.attachEventListeners();
      this.checkAuth();
    }
  
    attachEventListeners() {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.onsubmit = (e) => this.handleLogin(e);
        console.log('✅ Login form attached');
      }
  
      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.onsubmit = (e) => this.handleRegister(e);
        console.log('✅ Register form attached');
      }
    }
  
    async handleLogin(event) {
      event.preventDefault();
      console.log('🔄 Login process starting...');
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const loginBtn = document.getElementById('loginBtn');
      const errorDiv = document.getElementById('loginError');
  
      // Loading state
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
      }
  
      // Clear previous errors
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
  
      try {
        const result = await this.authManager.login(email, password);
        
        if (result.success) {
          console.log('🎉 Login successful, redirecting...');
          alert('Login successful!');
          // window.location.href = '/dashboard.html';
        } else {
          console.error('💥 Login failed:', result.error);
          this.showError(result.error, errorDiv);
        }
      } catch (error) {
        console.error('💥 Login handler error:', error);
        this.showError('An unexpected error occurred', errorDiv);
      } finally {
        // Reset button
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login';
        }
      }
    }
  
    async handleRegister(event) {
      event.preventDefault();
      console.log('🔄 Register process starting...');
      
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const registerBtn = document.getElementById('registerBtn');
      const errorDiv = document.getElementById('registerError');
  
      // Loading state
      if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
      }
  
      // Clear previous errors
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
  
      try {
        const result = await this.authManager.register(name, email, password);
        
        if (result.success) {
          console.log('🎉 Registration successful, redirecting...');
          alert('Registration successful!');
          // window.location.href = '/dashboard.html';
        } else {
          console.error('💥 Registration failed:', result.error);
          this.showError(result.error, errorDiv);
        }
      } catch (error) {
        console.error('💥 Registration handler error:', error);
        this.showError('An unexpected error occurred', errorDiv);
      } finally {
        // Reset button
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Register';
        }
      }
    }
  
    showError(message, errorElement = null) {
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      } else {
        alert(`Error: ${message}`);
      }
    }
  
    checkAuth() {
      if (this.authManager.isAuthenticated()) {
        console.log('🔐 User is authenticated');
        // Giriş yapılmışsa dashboard'a yönlendir
        // if (!window.location.pathname.includes('/dashboard.html')) {
        //   window.location.href = '/dashboard.html';
        // }
      } else {
        console.log('🔓 User is not authenticated');
      }
    }
  }
  
  // App başlatma
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, starting app...');
    window.app = new SahaSatisApp();
  });