class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:5010/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = { headers: auth.getAuthHeaders(), ...options };
        
        const response = await fetch(url, config);
        return await response.json();
    }

    async getVisits() {
        return this.request('/visits');
    }

    async getTodayVisits() {
        return this.request('/visits/today');
    }

    async createVisit(visitData) {
        return this.request('/visits', {
            method: 'POST',
            body: JSON.stringify(visitData)
        });
    }

    async updateVisit(id, visitData) {
        return this.request(`/visits/${id}`, {
            method: 'PUT',
            body: JSON.stringify(visitData)
        });
    }
     // Müşteri methodları
     async getCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/customers?${queryString}`);
    }

    async getCustomer(id) {
        return this.request(`/customers/${id}`);
    }

    async createCustomer(customerData) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }

    async updateCustomer(id, customerData) {
        return this.request(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(customerData)
        });
    }

    async deleteCustomer(id) {
        return this.request(`/customers/${id}`, {
            method: 'DELETE'
        });
    }

    async getCustomerStats(id) {
        return this.request(`/customers/${id}/stats`);
    }

    async searchCustomers(query) {
        return this.request(`/customers/search/quick?q=${encodeURIComponent(query)}`);
    }
}

