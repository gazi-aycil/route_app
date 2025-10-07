class AuthManager {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
    }

    async login(email, password) {
        const response = await fetch('http://localhost:5010/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (data.success) {
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
        }
        return data;
    }

    async verifyToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch('http://localhost:5010/api/auth/verify', {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            return false;
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}