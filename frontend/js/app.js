class SahaSatisApp {
    constructor() {
        this.apiBaseUrl = 'https://your-render-app.onrender.com/api';
        this.auth = new AuthManager();
        this.api = new ApiService();
        this.visitManager = new VisitManager();
        this.currentPage = 'login';
        
        this.init();
    }

    async init() {
        // Service Worker kaydı
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered: ', registration))
                .catch(error => console.log('SW registration failed: ', error));
        }

        // Çevrimdışı durum kontrolü
        window.addEventListener('online', this.updateOnlineStatus.bind(this));
        window.addEventListener('offline', this.updateOnlineStatus.bind(this));
        this.updateOnlineStatus();

        // Auth kontrolü
        await this.checkAuth();
    }

    async checkAuth() {
        const isAuthenticated = await this.auth.verifyToken();
        
        if (isAuthenticated) {
            this.showAuthenticatedUI();
            this.loadPage('dashboard');
        } else {
            this.showLogin();
        }
    }

    showAuthenticatedUI() {
        document.getElementById('navigation').style.display = 'flex';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('userName').textContent = this.auth.user.name;
    }

    showLogin() {
        this.currentPage = 'login';
        document.getElementById('mainContent').innerHTML = `
            <div class="login-container">
                <h2 class="login-title">Saha Satış Giriş</h2>
                <form onsubmit="app.handleLogin(event)">
                    <div class="form-group">
                        <label for="email">E-posta</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Şifre</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Giriş Yap</button>
                </form>
            </div>
        `;
    }

    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            this.showLoading();
            await this.auth.login(email, password);
            this.showAuthenticatedUI();
            this.loadPage('dashboard');
        } catch (error) {
            alert('Giriş hatası: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadPage(page) {
        this.currentPage = page;
        
        // Navigasyon aktif durumunu güncelle
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.nav-item[onclick="app.loadPage('${page}')"]`)?.classList.add('active');

        switch (page) {
            case 'dashboard':
                await this.showDashboard();
                break;
            case 'visits':
                await this.showVisits();
                break;
            case 'customers':
                await this.showCustomers();
                break;
            case 'orders':
                await this.showOrders();
                break;
        }
    }

    async showDashboard() {
        this.showLoading();
        
        try {
            const [visitsResponse, ordersResponse] = await Promise.all([
                this.api.getTodayVisits(),
                this.api.getOrders()
            ]);

            const todayVisits = visitsResponse.data;
            const pendingOrders = ordersResponse.data.filter(order => 
                order.status === 'pending'
            ).length;

            document.getElementById('mainContent').innerHTML = `
                <div class="dashboard">
                    <h2 class="card-title">Hoş Geldiniz, ${this.auth.user.name}!</h2>
                    
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-number">${todayVisits.length}</div>
                            <div class="stat-label">Bugünkü Ziyaret</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${pendingOrders}</div>
                            <div class="stat-label">Bekleyen Sipariş</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${this.getCompletedVisitsCount(todayVisits)}</div>
                            <div class="stat-label">Tamamlanan</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Bugünkü Ziyaretler</h3>
                            <button onclick="app.loadPage('visits')" class="btn btn-primary">
                                Tümünü Gör
                            </button>
                        </div>
                        <div id="dashboardVisitsList"></div>
                    </div>
                </div>
            `;

            // Dashboard için kısa ziyaret listesi
            this.renderDashboardVisits(todayVisits);

        } catch (error) {
            console.error('Dashboard load error:', error);
            document.getElementById('mainContent').innerHTML = `
                <div class="text-center">
                    <p>Dashboard yüklenirken hata oluştu.</p>
                    <button onclick="app.loadPage('dashboard')" class="btn btn-primary">
                        Tekrar Dene
                    </button>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }

    getCompletedVisitsCount(visits) {
        return visits.filter(visit => visit.status === 'completed').length;
    }

    renderDashboardVisits(visits) {
        const container = document.getElementById('dashboardVisitsList');
        if (!container) return;

        if (visits.length === 0) {
            container.innerHTML = '<p class="text-center">Bugün için ziyaret bulunmuyor.</p>';
            return;
        }

        const limitedVisits = visits.slice(0, 3);
        container.innerHTML = limitedVisits.map(visit => `
            <div class="visit-item">
                <div class="visit-header">
                    <div class="customer-name">${visit.customer.name}</div>
                    <span class="visit-status status-${visit.status}">
                        ${this.visitManager.getStatusText(visit.status)}
                    </span>
                </div>
                <div class="visit-details">
                    <div>📍 ${visit.customer.address}</div>
                    <div>⏰ ${this.visitManager.formatDate(visit.plannedDate)}</div>
                </div>
            </div>
        `).join('');

        if (visits.length > 3) {
            container.innerHTML += `
                <div class="text-center mt-2">
                    <p>+${visits.length - 3} daha ziyaret</p>
                </div>
            `;
        }
    }

    async showVisits() {
        document.getElementById('mainContent').innerHTML = `
            <div class="visits-page">
                <div class="card-header">
                    <h2 class="card-title">Ziyaretler</h2>
                    <button onclick="app.showVisitForm()" class="btn btn-primary">
                        + Yeni Ziyaret
                    </button>
                </div>
                <div id="visitsList"></div>
            </div>
        `;

        await this.visitManager.loadVisits();
    }

    showVisitForm() {
        document.getElementById('mainContent').innerHTML = `
            <div class="visit-form">
                <h2 class="card-title">Yeni Ziyaret Ekle</h2>
                <form onsubmit="app.handleVisitSubmit(event)">
                    <div class="form-group">
                        <label>Müşteri Adı *</label>
                        <input type="text" id="customerName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Adres *</label>
                        <textarea id="customerAddress" class="form-control" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Telefon</label>
                        <input type="tel" id="customerPhone" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Planlanan Tarih *</label>
                        <input type="datetime-local" id="plannedDate" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Enlem</label>
                        <input type="number" id="customerLat" class="form-control" step="any" value="41.0082">
                    </div>
                    <div class="form-group">
                        <label>Boylam</label>
                        <input type="number" id="customerLng" class="form-control" step="any" value="28.9784">
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="app.loadPage('visits')" class="btn btn-secondary">
                            İptal
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Ziyaret Oluştur
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Varsayılan tarih olarak şu anı ayarla
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('plannedDate').value = now.toISOString().slice(0, 16);
    }

    async handleVisitSubmit(event) {
        event.preventDefault();
        
        const visitData = {
            customer: {
                name: document.getElementById('customerName').value,
                address: document.getElementById('customerAddress').value,
                phone: document.getElementById('customerPhone').value,
                location: {
                    lat: parseFloat(document.getElementById('customerLat').value),
                    lng: parseFloat(document.getElementById('customerLng').value)
                }
            },
            plannedDate: document.getElementById('plannedDate').value
        };

        try {
            this.showLoading();
            await this.api.createVisit(visitData);
            alert('Ziyaret başarıyla oluşturuldu!');
            this.loadPage('visits');
        } catch (error) {
            alert('Ziyaret oluşturulurken hata: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async startVisit(visitId) {
        try {
            this.showLoading();
            await this.api.updateVisit(visitId, { status: 'in-progress' });
            alert('Ziyaret başlatıldı!');
            this.loadPage('visits');
        } catch (error) {
            alert('Ziyaret başlatılırken hata: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async showCustomers() {
        document.getElementById('mainContent').innerHTML = `
            <div class="customers-page">
                <h2 class="card-title">Müşteriler</h2>
                <div class="text-center">
                    <p>Müşteri yönetimi yakında eklenecek...</p>
                </div>
            </div>
        `;
    }

    async showOrders() {
        document.getElementById('mainContent').innerHTML = `
            <div class="orders-page">
                <h2 class="card-title">Siparişler</h2>
                <div class="text-center">
                    <p>Sipariş yönetimi yakında eklenecek...</p>
                </div>
            </div>
        `;
    }

    logout() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            this.auth.logout();
        }
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    updateOnlineStatus() {
        const indicator = document.getElementById('offlineIndicator');
        if (!navigator.onLine) {
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }
}

// Global app instance
const app = new SahaSatisApp();
const auth = app.auth;
const api = app.api;