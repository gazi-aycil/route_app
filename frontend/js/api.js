class ApiService {
    constructor() {
        this.baseUrl = 'https://your-render-app.onrender.com/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: auth.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Visits
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

    async confirmVisit(id, confirmationData) {
        return this.request(`/visits/${id}/confirm`, {
            method: 'POST',
            body: JSON.stringify(confirmationData)
        });
    }

    async deleteVisit(id) {
        return this.request(`/visits/${id}`, {
            method: 'DELETE'
        });
    }

    // Orders
    async getOrders() {
        return this.request('/orders');
    }

    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    // Customers
    async getCustomers() {
        return this.request('/customers');
    }

    async createCustomer(customerData) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData)
        });
    }
}