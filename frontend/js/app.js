// app.js - FRONTEND
class SahaSatisApp {
  constructor() {
    this.authManager = window.authManager;
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.checkAuth();
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
  }

  async handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('loginError');

    // Loading
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Logging in...';
    }

    // Clear errors
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }

    try {
      const result = await this.authManager.login(email, password);
      
      if (result.success) {
        alert('✅ Login successful!');
        // window.location.href = '/dashboard.html';
      } else {
        this.showError(result.message, errorDiv);
      }
    } catch (error) {
      this.showError(error.message, errorDiv);
    } finally {
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

    // Loading
    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = 'Registering...';
    }

    // Clear errors
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }

    try {
      const result = await this.authManager.register(name, email, password);
      
      if (result.success) {
        alert('✅ Registration successful!');
        // window.location.href = '/dashboard.html';
      } else {
        this.showError(result.message, errorDiv);
      }
    } catch (error) {
      this.showError(error.message, errorDiv);
    } finally {
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
      console.log('User is authenticated');
    }
  }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SahaSatisApp();
});