class SahaSatisApp {
    constructor() {
        this.auth = new AuthManager();
        this.api = new ApiService();
        this.locationManager = new LocationManager();
        this.mapManager = new MapManager();
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

        // Auth kontrolü
        if (await this.auth.verifyToken()) {
            this.showApp();
            // Konum izni iste (1 saniye sonra)
            setTimeout(() => {
                this.locationManager.requestLocationPermission();
            }, 1000);
        } else {
            this.showLogin();
        }
    }

    showApp() {
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('navigation').style.display = 'flex';
        document.getElementById('userName').textContent = this.auth.user.name;
        this.loadPage('dashboard');
    }

    showLogin() {
        this.currentPage = 'login';
        document.getElementById('mainContent').innerHTML = `
            <div class="login-container">
                <h2>Giriş Yap</h2>
                <form onsubmit="app.handleLogin(event)">
                    <div class="form-group">
                        <input type="email" id="email" placeholder="E-posta" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="password" placeholder="Şifre" required>
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

        this.showLoading();
        const result = await this.auth.login(email, password);
        this.hideLoading();

        if (result.success) {
            this.showApp();
        } else {
            alert('Giriş başarısız: ' + result.message);
        }
    }

    async loadPage(page) {
        this.currentPage = page;
        
        // Navigasyon aktif durumunu güncelle
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Sayfayı yükle
        if (page === 'dashboard') await this.showDashboard();
        if (page === 'visits') await this.showVisits();
        if (page === 'customers') this.showCustomers();
        if (page === 'map') await this.showMap();
        if (page === 'customers') await this.showCustomers(); // GÜNCELLENDİ
    }

    async showDashboard() {
        this.showLoading();
        
        try {
            const [visitsResponse, ordersResponse] = await Promise.all([
                this.api.getTodayVisits(),
                this.api.getOrders()
            ]);

            const todayVisits = visitsResponse.data || [];
            const pendingOrders = ordersResponse.data ? 
                ordersResponse.data.filter(order => order.status === 'pending').length : 0;

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
                        <div class="stat-card">
                            <div class="stat-number">
                                ${this.locationManager.currentLocation ? '📍' : '❌'}
                            </div>
                            <div class="stat-label">Konum</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Bugünkü Ziyaretler</h3>
                            <div>
                                <button onclick="app.locationManager.requestLocationPermission()" class="btn" style="margin-right: 0.5rem;">
                                    📍 Konum Al
                                </button>
                                <button onclick="app.loadPage('visits')" class="btn btn-primary">
                                    Tümünü Gör
                                </button>
                            </div>
                        </div>
                        <div id="dashboardVisitsList"></div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Hızlı İşlemler</h3>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <button onclick="app.loadPage('map')" class="btn btn-primary">
                                🗺️ Haritayı Aç
                            </button>
                            <button onclick="app.showVisitForm()" class="btn btn-primary">
                                📍 Yeni Ziyaret
                            </button>
                        </div>
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
                        ${this.getStatusText(visit.status)}
                    </span>
                    ${this.locationManager.currentLocation ? `
                        <span class="location-status ${this.locationManager.isLocationNearby(visit.customer.location.lat, visit.customer.location.lng) ? 'status-nearby' : 'status-far'}">
                            ${this.locationManager.isLocationNearby(visit.customer.location.lat, visit.customer.location.lng) ? '📍 Yakın' : '❌ Uzak'}
                        </span>
                    ` : ''}
                </div>
                <div class="visit-details">
                    <div>📍 ${visit.customer.address}</div>
                    <div>⏰ ${this.formatDate(visit.plannedDate)}</div>
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
        this.showLoading();
        const visitsResponse = await this.api.getTodayVisits();
        this.hideLoading();

        const visits = visitsResponse.data || [];
        
        document.getElementById('mainContent').innerHTML = `
            <div class="visits-page">
                <div class="card-header">
                    <h2 class="card-title">Ziyaretler</h2>
                    <div>
                        <button onclick="app.locationManager.requestLocationPermission()" class="btn" style="margin-right: 0.5rem;">
                            📍 Konum Güncelle
                        </button>
                        <button onclick="app.showVisitForm()" class="btn btn-primary">
                            + Yeni Ziyaret
                        </button>
                    </div>
                </div>
                
                ${this.locationManager.currentLocation ? `
                    <div style="background: #e8f5e8; padding: 0.5rem; border-radius: 5px; margin-bottom: 1rem;">
                        📍 Konumunuz: ${this.locationManager.currentLocation.lat.toFixed(4)}, ${this.locationManager.currentLocation.lng.toFixed(4)}
                    </div>
                ` : `
                    <div style="background: #ffebee; padding: 0.5rem; border-radius: 5px; margin-bottom: 1rem;">
                        ❌ Konum bilgisi yok. Ziyaret başlatmak için konum erişimine izin verin.
                    </div>
                `}
                
                <div id="visitsList"></div>
            </div>
        `;

        this.renderVisitsList(visits);
    }

    renderVisitsList(visits) {
        const container = document.getElementById('visitsList');
        if (!container) return;

        if (visits.length === 0) {
            container.innerHTML = `
                <div class="text-center">
                    <p>Bugün için planlanmış ziyaret bulunmuyor.</p>
                    <button onclick="app.showVisitForm()" class="btn btn-primary mt-2">
                        Yeni Ziyaret Ekle
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = visits.map(visit => `
            <div class="visit-item">
                <div class="visit-header">
                    <div class="customer-name">${visit.customer.name}</div>
                    <div>
                        <span class="visit-status status-${visit.status}">
                            ${this.getStatusText(visit.status)}
                        </span>
                        ${this.locationManager.currentLocation ? `
                            <span class="location-status ${this.locationManager.isLocationNearby(visit.customer.location.lat, visit.customer.location.lng) ? 'status-nearby' : 'status-far'}">
                                ${this.locationManager.isLocationNearby(visit.customer.location.lat, visit.customer.location.lng) ? '📍 Yakın' : '❌ Uzak'}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="visit-details">
                    <div>📍 ${visit.customer.address}</div>
                    <div>📞 ${visit.customer.phone || 'Telefon yok'}</div>
                    <div>⏰ ${this.formatDate(visit.plannedDate)}</div>
                    ${this.locationManager.currentLocation ? `
                        <div class="distance-info">
                            📏 Mesafe: ${this.locationManager.calculateDistance(
                                this.locationManager.currentLocation.lat,
                                this.locationManager.currentLocation.lng,
                                visit.customer.location.lat,
                                visit.customer.location.lng
                            )} metre
                        </div>
                    ` : ''}
                </div>
                <div class="visit-actions">
                    ${visit.status === 'planned' ? `
                        <button onclick="app.startVisitWithLocationCheck('${visit._id}', ${visit.customer.location.lat}, ${visit.customer.location.lng})" 
                                class="btn btn-primary btn-sm">
                            🚀 Başlat
                        </button>
                    ` : ''}
                    ${visit.status === 'in-progress' ? `
                        <button onclick="app.completeVisitWithLocationCheck('${visit._id}', ${visit.customer.location.lat}, ${visit.customer.location.lng})" 
                                class="btn btn-success btn-sm">
                            ✅ Tamamla
                        </button>
                    ` : ''}
                    <button onclick="app.viewVisitOnMap(${visit.customer.location.lat}, ${visit.customer.location.lng})" 
                            class="btn btn-secondary btn-sm">
                        🗺️ Harita
                    </button>
                    <button onclick="app.loadPage('map')" class="btn btn-secondary btn-sm">
                        📋 Detay
                    </button>
                </div>
            </div>
        `).join('');
    }

    async showMap() {
        this.showLoading();
        const visitsResponse = await this.api.getTodayVisits();
        this.hideLoading();

        const visits = visitsResponse.data || [];
        
        document.getElementById('mainContent').innerHTML = `
            <div>
                <div class="card-header">
                    <h2 class="card-title">🗺️ Ziyaret Haritası</h2>
                    <div>
                        <button onclick="app.locationManager.requestLocationPermission()" class="btn" style="margin-right: 0.5rem;">
                            📍 Konumumu Güncelle
                        </button>
                        <button onclick="app.showOptimalRoute()" class="btn btn-primary">
                            🛣️ Optimal Rota
                        </button>
                    </div>
                </div>
                
                ${!this.locationManager.currentLocation ? `
                    <div style="background: #fff3e0; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
                        <strong>⚠️ Konum Gerekli</strong>
                        <p style="margin: 0.5rem 0 0 0;">Harita özelliklerini kullanmak ve ziyaret başlatabilmek için konum erişimine izin verin.</p>
                        <button onclick="app.locationManager.requestLocationPermission()" class="btn btn-primary" style="margin-top: 0.5rem;">
                            📍 Konum İzni Ver
                        </button>
                    </div>
                ` : ''}
                
                <div class="map-container" id="map"></div>
                
                <div style="margin-top: 1rem;">
                    <h3>Ziyaret Konumları</h3>
                    <div id="mapVisitsList">
                        ${visits.map(visit => `
                            <div class="visit-map-item">
                                <div class="visit-header">
                                    <div class="customer-name">${visit.customer.name}</div>
                                    <span class="visit-status status-${visit.status}">
                                        ${this.getStatusText(visit.status)}
                                    </span>
                                    ${this.locationManager.currentLocation ? `
                                        <span class="location-status ${this.locationManager.isLocationNearby(visit.customer.location.lat, visit.customer.location.lng) ? 'status-nearby' : 'status-far'}">
                                            ${this.locationManager.isLocationNearby(visit.customer.location.lat, visit.customer.location.lng) ? '📍 Yakın' : '❌ Uzak'}
                                        </span>
                                    ` : ''}
                                </div>
                                <div>${visit.customer.address}</div>
                                <div>${this.formatDate(visit.plannedDate)}</div>
                                <div class="location-actions">
                                    <button onclick="app.focusOnMap(${visit.customer.location.lat}, ${visit.customer.location.lng})" class="btn-location">
                                        🔍 Haritada Göster
                                    </button>
                                    ${visit.status === 'planned' ? `
                                        <button onclick="app.startVisitWithLocationCheck('${visit._id}', ${visit.customer.location.lat}, ${visit.customer.location.lng})" 
                                                class="btn-location btn-get-location">
                                            🚀 Ziyareti Başlat
                                        </button>
                                    ` : ''}
                                    ${visit.status === 'in-progress' ? `
                                        <button onclick="app.completeVisitWithLocationCheck('${visit._id}', ${visit.customer.location.lat}, ${visit.customer.location.lng})" 
                                                class="btn-location btn-check-distance">
                                            ✅ Ziyareti Tamamla
                                        </button>
                                    ` : ''}
                                </div>
                                ${this.locationManager.currentLocation ? `
                                    <div class="distance-info">
                                        📏 Mesafe: ${this.locationManager.calculateDistance(
                                            this.locationManager.currentLocation.lat,
                                            this.locationManager.currentLocation.lng,
                                            visit.customer.location.lat,
                                            visit.customer.location.lng
                                        )} metre
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Haritayı başlat
        setTimeout(() => {
            this.initializeMap(visits);
        }, 100);
    }

    // Haritayı başlat ve marker'ları ekle
    initializeMap(visits) {
        // Haritayı başlat
        const initialLocation = this.locationManager.currentLocation || { lat: 41.0082, lng: 28.9784 };
        this.mapManager.initMap('map', initialLocation, 12);

        // Mevcut konum marker'ı ekle
        if (this.locationManager.currentLocation) {
            this.mapManager.addCurrentLocationMarker();
        }

        // Müşteri marker'larını ekle
        visits.forEach(visit => {
            this.mapManager.addCustomerMarker(visit.customer, visit.status);
        });

        // Haritayı marker'lara göre ayarla
        if (visits.length > 0 || this.locationManager.currentLocation) {
            this.mapManager.fitToMarkers();
        }
    }

    // Konum kontrolü ile ziyaret başlatma
    async startVisitWithLocationCheck(visitId, targetLat, targetLng) {
        if (!this.locationManager.currentLocation) {
            const granted = await this.locationManager.requestLocationPermission();
            if (!granted) {
                alert('Konum erişimi gerekiyor! Lütfen konum paylaşımına izin verin.');
                return;
            }
        }

        const isNearby = this.locationManager.isLocationNearby(targetLat, targetLng);
        const distance = this.locationManager.calculateDistance(
            this.locationManager.currentLocation.lat,
            this.locationManager.currentLocation.lng,
            targetLat,
            targetLng
        );
        
        if (isNearby) {
            this.showLoading();
            const result = await this.api.updateVisit(visitId, { status: 'in-progress' });
            this.hideLoading();
            
            if (result.success) {
                alert('✅ Ziyaret başlatıldı!');
                this.loadPage('visits');
            } else {
                alert('Hata: ' + result.message);
            }
        } else {
            alert(`Müşteri konumuna çok uzaktasınız!\n\n📏 Mesafe: ${distance} metre\n✅ Gereken: 500 metre içinde olmalısınız`);
        }
    }

    // Konum kontrolü ile ziyaret tamamlama
    async completeVisitWithLocationCheck(visitId, targetLat, targetLng) {
        if (!this.locationManager.currentLocation) {
            const granted = await this.locationManager.requestLocationPermission();
            if (!granted) {
                alert('Konum erişimi gerekiyor! Lütfen konum paylaşımına izin verin.');
                return;
            }
        }

        const isNearby = this.locationManager.isLocationNearby(targetLat, targetLng);
        const distance = this.locationManager.calculateDistance(
            this.locationManager.currentLocation.lat,
            this.locationManager.currentLocation.lng,
            targetLat,
            targetLng
        );
        
        if (isNearby) {
            this.showLoading();
            const result = await this.api.updateVisit(visitId, { 
                status: 'completed',
                actualDate: new Date()
            });
            this.hideLoading();
            
            if (result.success) {
                alert('✅ Ziyaret tamamlandı!');
                this.loadPage('visits');
            } else {
                alert('Hata: ' + result.message);
            }
        } else {
            alert(`Müşteri konumuna çok uzaktasınız!\n\n📏 Mesafe: ${distance} metre\n✅ Gereken: 500 metre içinde olmalısınız`);
        }
    }

    // Haritada belirli bir noktaya odaklan
    focusOnMap(lat, lng) {
        if (this.mapManager.map) {
            this.mapManager.map.setCenter({ lat, lng });
            this.mapManager.map.setZoom(15);
        } else {
            alert('Harita henüz yüklenmedi. Lütfen bekleyin...');
        }
    }

    // Haritada ziyareti göster
    viewVisitOnMap(lat, lng) {
        this.loadPage('map');
        setTimeout(() => {
            this.focusOnMap(lat, lng);
        }, 500);
    }

    // Optimal rotayı göster
    async showOptimalRoute() {
        if (!this.locationManager.currentLocation) {
            alert('Rota oluşturmak için önce konumunuzu alın!');
            return;
        }

        const visitsResponse = await this.api.getTodayVisits();
        const visits = visitsResponse.data || [];
        
        if (visits.length < 1) {
            alert('Rota oluşturmak için en az 1 ziyaret gerekli!');
            return;
        }

        const waypoints = visits.map(visit => visit.customer.location);
        
        // Mevcut konumu başlangıç noktası olarak ekle
        waypoints.unshift(this.locationManager.currentLocation);

        this.mapManager.calculateRoute(waypoints);
        alert('🛣️ Optimal rota haritada çizildi!');
    }

    showVisitForm() {
        document.getElementById('mainContent').innerHTML = `
            <div>
                <h2 class="card-title">Yeni Ziyaret Ekle</h2>
                
                <div style="background: #e3f2fd; padding: 1rem; border-radius: 5px; margin-bottom: 1rem;">
                    <strong>📍 Konum Bilgisi</strong>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                        Adresi otomatik koordinata çevirmek için "Adres Çözümle" butonunu kullanın.
                        Veya manuel olarak koordinat girebilirsiniz.
                    </p>
                </div>
                
                <form onsubmit="app.handleVisitSubmit(event)" style="background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div class="form-group">
                        <label>Müşteri Adı *</label>
                        <input type="text" id="customerName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Adres *</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <textarea id="customerAddress" class="form-control" rows="3" required style="flex: 1;"></textarea>
                            <button type="button" onclick="app.geocodeAddressFromForm()" class="btn" style="align-self: flex-start;">
                                📍 Adres Çözümle
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Telefon</label>
                        <input type="tel" id="customerPhone" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Planlanan Tarih *</label>
                        <input type="datetime-local" id="plannedDate" class="form-control" required>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
                        <label style="font-weight: bold; display: block; margin-bottom: 0.5rem;">📍 Koordinatlar</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group">
                                <label>Enlem</label>
                                <input type="number" id="customerLat" class="form-control" step="any" value="41.0082">
                            </div>
                            <div class="form-group">
                                <label>Boylam</label>
                                <input type="number" id="customerLng" class="form-control" step="any" value="28.9784">
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <button type="button" onclick="app.useCurrentLocation()" class="btn">
                                📍 Mevcut Konumu Kullan
                            </button>
                            <button type="button" onclick="app.testCoordinatesOnMap()" class="btn">
                                🗺️ Haritada Test Et
                            </button>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
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
    
        // Varsayılan tarih
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('plannedDate').value = now.toISOString().slice(0, 16);
    }
    
    // Formdan adres çözümle
    async geocodeAddressFromForm() {
        const address = document.getElementById('customerAddress').value;
        if (!address) {
            alert('Lütfen önce adres giriniz.');
            return;
        }
    
        try {
            const coordinates = await this.geocodeAddress(address);
            document.getElementById('customerLat').value = coordinates.lat;
            document.getElementById('customerLng').value = coordinates.lng;
            
            alert(`✅ Adres çözümlendi!\nEnlem: ${coordinates.lat.toFixed(6)}\nBoylam: ${coordinates.lng.toFixed(6)}`);
        } catch (error) {
            alert('❌ Adres çözümlenemedi: ' + error.message);
        }
    }
    
    // Mevcut konumu kullan
    async useCurrentLocation() {
        if (!this.locationManager.currentLocation) {
            const granted = await this.locationManager.requestLocationPermission();
            if (!granted) {
                alert('Konum erişimi yok.');
                return;
            }
        }
    
        document.getElementById('customerLat').value = this.locationManager.currentLocation.lat;
        document.getElementById('customerLng').value = this.locationManager.currentLocation.lng;
        
        alert(`📍 Mevcut konum kullanılıyor!\nEnlem: ${this.locationManager.currentLocation.lat.toFixed(6)}\nBoylam: ${this.locationManager.currentLocation.lng.toFixed(6)}`);
    }
    
    // Koordinatları haritada test et
    testCoordinatesOnMap() {
        const lat = parseFloat(document.getElementById('customerLat').value);
        const lng = parseFloat(document.getElementById('customerLng').value);
        
        if (!lat || !lng) {
            alert('Lütfen geçerli koordinatlar giriniz.');
            return;
        }
    
        // Harita sayfasına git ve koordinatı göster
        this.loadPage('map');
        setTimeout(() => {
            this.mapManager.clearMarkers();
            this.mapManager.addMarker({ lat, lng }, 'Test Konumu', 'https://maps.google.com/mapfiles/ms/icons/red-dot.png');
            this.mapManager.map.setCenter({ lat, lng });
            this.mapManager.map.setZoom(15);
            
            alert(`📍 Test konumu haritada gösteriliyor:\n${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }, 1000);
    }

    async handleVisitSubmit(event) {
        event.preventDefault();
        
        const customerName = document.getElementById('customerName').value;
        const customerAddress = document.getElementById('customerAddress').value;
        
        console.log('🆕 Ziyaret oluşturuluyor:', { customerName, customerAddress });
    
        this.showLoading();
        try {
            // Önce adresi koordinata çevir
            const coordinates = await this.geocodeAddress(customerAddress);
            
            const visitData = {
                customer: {
                    name: customerName,
                    address: customerAddress,
                    phone: document.getElementById('customerPhone').value,
                    location: {
                        lat: coordinates.lat,
                        lng: coordinates.lng
                    }
                },
                plannedDate: document.getElementById('plannedDate').value
            };
    
            console.log('📍 Koordinatlar alındı:', coordinates);
    
            const result = await this.api.createVisit(visitData);
            this.hideLoading();
    
            if (result.success) {
                alert('✅ Ziyaret başarıyla oluşturuldu!');
                this.loadPage('visits');
            } else {
                alert('❌ Hata: ' + result.message);
            }
        } catch (error) {
            this.hideLoading();
            console.error('❌ Adres çevirme hatası:', error);
            alert('❌ Adres koordinata çevrilemedi: ' + error.message + '\n\nVarsayılan konum kullanılıyor...');
            
            // Hata durumunda varsayılan konumla kaydet
            this.createVisitWithDefaultLocation(customerName, customerAddress);
        }
    }
    
    // Adresi koordinata çevir
 
async geocodeAddress(address) {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.maps) {
            reject(new Error('Google Maps API yüklenmedi. Lütfen API key kontrol edin.'));
            return;
        }

        const geocoder = new google.maps.Geocoder();
        
        console.log('📍 Adres çözümleniyor:', address);
        
        geocoder.geocode({ address: address }, (results, status) => {
            console.log('📍 Geocoding sonucu:', status, results);
            
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                const coordinates = {
                    lat: location.lat(),
                    lng: location.lng()
                };
                console.log('✅ Koordinatlar bulundu:', coordinates);
                resolve(coordinates);
            } else {
                reject(new Error('Adres çözümlenemedi: ' + status));
            }
        });
    });
}
    
    // Varsayılan konumla ziyaret oluştur
    async createVisitWithDefaultLocation(customerName, customerAddress) {
        const visitData = {
            customer: {
                name: customerName,
                address: customerAddress,
                phone: document.getElementById('customerPhone').value,
                location: {
                    lat: 41.0082,  // İstanbul varsayılan
                    lng: 28.9784
                }
            },
            plannedDate: document.getElementById('plannedDate').value
        };
    
        const result = await this.api.createVisit(visitData);
        if (result.success) {
            alert('⚠️ Ziyaret oluşturuldu ama adres koordinata çevrilemedi. Varsayılan konum kullanıldı.');
            this.loadPage('visits');
        } else {
            alert('❌ Hata: ' + result.message);
        }
    }

 // showCustomers fonksiyonunu tamamen değiştirin
async showCustomers() {
    document.getElementById('mainContent').innerHTML = `
        <div class="customers-page">
            <div class="card-header">
                <h2 class="card-title">👥 Müşteri Yönetimi</h2>
                <button onclick="customerManager.showCustomerForm()" class="btn btn-primary">
                    + Yeni Müşteri
                </button>
            </div>

            <div class="customer-filters">
                <div class="filter-grid">
                    <div class="filter-group">
                        <label>🔍 Müşteri Ara</label>
                        <input type="text" id="customerSearch" placeholder="İsim, telefon veya email ile ara..." 
                               class="form-control" oninput="customerManager.handleSearch(this.value)">
                    </div>
                    <div class="filter-group">
                        <label>📋 Kategori</label>
                        <select id="categoryFilter" class="form-control" onchange="customerManager.handleCategoryChange(this.value)">
                            <option value="">Tüm Kategoriler</option>
                            <option value="retail">Perakende</option>
                            <option value="corporate">Kurumsal</option>
                            <option value="wholesale">Toptan</option>
                            <option value="other">Diğer</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>📊 Durum</label>
                        <select id="statusFilter" class="form-control" onchange="customerManager.handleStatusChange(this.value)">
                            <option value="">Tüm Durumlar</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Pasif</option>
                            <option value="blocked">Bloke</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>&nbsp;</label>
                        <button onclick="customerManager.clearFilters()" class="btn btn-secondary">
                            🔄 Temizle
                        </button>
                    </div>
                </div>
            </div>

            <div id="customersList">
                <!-- Müşteriler buraya yüklenecek -->
            </div>

            <div id="customersPagination" class="pagination">
                <!-- Sayfalama buraya yüklenecek -->
            </div>
        </div>
    `;

    // Müşterileri yükle
    await customerManager.loadCustomers();
}

    getStatusText(status) {
        const statusMap = {
            'planned': 'Planlandı',
            'in-progress': 'Devam Ediyor',
            'completed': 'Tamamlandı'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    logout() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            this.locationManager.stopTracking();
            this.auth.logout();
            location.reload();
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
}

// Global instances
const app = new SahaSatisApp();
const auth = app.auth;
const api = app.api;
const locationManager = app.locationManager;
const mapManager = app.mapManager;