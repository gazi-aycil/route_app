class SahaSatisApp {
    constructor() {
      this.authManager = authManager;
      this.init();
    }
  
    init() {
      this.checkAuthStatus();
      this.attachEventListeners();
    }
  
    attachEventListeners() {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.onsubmit = (e) => this.handleLogin(e);
      }
  
      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.onsubmit = (e) => this.handleRegister(e);
      }
  
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.onclick = () => this.handleLogout();
      }
    }
  
    async handleLogin(event) {
      event.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const loginBtn = document.getElementById('loginBtn');
      const errorDiv = document.getElementById('loginError');
  
      // Reset error message
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
  
      // Show loading state
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
      }
  
      try {
        const result = await this.authManager.login(email, password);
        
        if (result.success) {
          this.showMessage('Login successful!', 'success');
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1000);
        } else {
          this.showError(result.error, errorDiv);
        }
      } catch (error) {
        console.error('Login handler error:', error);
        this.showError('An unexpected error occurred. Please try again.', errorDiv);
      } finally {
        // Reset button state
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login';
        }
      }
    }
  
    async handleRegister(event) {
      event.preventDefault();
      
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const registerBtn = document.getElementById('registerBtn');
      const errorDiv = document.getElementById('registerError');
  
      // Reset error message
      if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
  
      // Show loading state
      if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registering...';
      }
  
      try {
        const result = await this.authManager.register(name, email, password);
        
        if (result.success) {
          this.showMessage('Registration successful!', 'success');
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 1000);
        } else {
          this.showError(result.error, errorDiv);
        }
      } catch (error) {
        console.error('Registration handler error:', error);
        this.showError('An unexpected error occurred. Please try again.', errorDiv);
      } finally {
        // Reset button state
        if (registerBtn) {
          registerBtn.disabled = false;
          registerBtn.textContent = 'Register';
        }
      }
    }
  
    handleLogout() {
      this.authManager.logout();
      this.showMessage('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    }
  
    showError(message, errorElement = null) {
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      } else {
        alert(`Error: ${message}`);
      }
    }
  
    showMessage(message, type = 'info') {
      // Implement your notification system here
      console.log(`${type.toUpperCase()}: ${message}`);
      alert(message); // Temporary solution
    }
  
    checkAuthStatus() {
      if (this.authManager.isAuthenticated() && 
          !window.location.pathname.includes('/dashboard.html')) {
        window.location.href = '/dashboard.html';
      }
    }
  }
  
  // Initialize app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new SahaSatisApp();
  });