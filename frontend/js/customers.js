class CustomerManager {
    constructor() {
        this.currentCustomers = [];
        this.currentPage = 1;
        this.searchQuery = '';
        this.selectedCategory = '';
        this.selectedStatus = '';
    }

    // Müşterileri yükle
    async loadCustomers(page = 1) {
        try {
            app.showLoading();
            
            const params = {
                page: page,
                limit: 20
            };

            if (this.searchQuery) {
                params.search = this.searchQuery;
            }

            if (this.selectedCategory) {
                params.category = this.selectedCategory;
            }

            if (this.selectedStatus) {
                params.status = this.selectedStatus;
            }

            const response = await api.getCustomers(params);
            this.currentCustomers = response.data;
            this.currentPage = page;

            this.renderCustomers();
            this.renderPagination(response.pagination);
            
        } catch (error) {
            console.error('Müşteri yükleme hatası:', error);
            alert('Müşteriler yüklenirken hata oluştu: ' + error.message);
        } finally {
            app.hideLoading();
        }
    }

    // Müşteri listesini render et
    renderCustomers() {
        const container = document.getElementById('customersList');
        if (!container) return;

        if (this.currentCustomers.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        container.innerHTML = this.currentCustomers.map(customer => `
            <div class="customer-item" onclick="customerManager.showCustomerDetail('${customer._id}')">
                <div class="customer-header">
                    <div class="customer-name">${customer.name}</div>
                    <div class="customer-badges">
                        <span class="customer-category badge-${customer.category}">
                            ${this.getCategoryText(customer.category)}
                        </span>
                        <span class="customer-status status-${customer.status}">
                            ${this.getStatusText(customer.status)}
                        </span>
                    </div>
                </div>
                
                <div class="customer-details">
                    <div>📞 ${customer.phone}</div>
                    <div>📧 ${customer.email || 'Email yok'}</div>
                    <div>🏢 ${customer.company || 'Firma yok'}</div>
                    <div>📍 ${customer.address}</div>
                </div>
                
                <div class="customer-stats">
                    <div class="stat">
                        <span class="stat-number">${customer.totalOrders}</span>
                        <span class="stat-label">Sipariş</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${this.formatCurrency(customer.totalSpent)}</span>
                        <span class="stat-label">Toplam</span>
                    </div>
                    <div class="stat">
                        <span class="stat-date">${this.formatLastVisit(customer.lastVisitDate)}</span>
                        <span class="stat-label">Son Ziyaret</span>
                    </div>
                </div>
                
                <div class="customer-actions">
                    <button onclick="event.stopPropagation(); customerManager.editCustomer('${customer._id}')" 
                            class="btn btn-secondary btn-sm">
                        ✏️ Düzenle
                    </button>
                    <button onclick="event.stopPropagation(); customerManager.createVisitForCustomer('${customer._id}')" 
                            class="btn btn-primary btn-sm">
                        📅 Ziyaret Ekle
                    </button>
                    <button onclick="event.stopPropagation(); customerManager.showOnMap(${customer.location.lat}, ${customer.location.lng})" 
                            class="btn btn-secondary btn-sm">
                        🗺️ Harita
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Boş state HTML'i
    getEmptyStateHTML() {
        if (this.searchQuery || this.selectedCategory || this.selectedStatus) {
            return `
                <div class="empty-state">
                    <h3>🤔 Müşteri bulunamadı</h3>
                    <p>Arama kriterlerinize uygun müşteri bulunamadı.</p>
                    <button onclick="customerManager.clearFilters()" class="btn btn-primary">
                        Filtreleri Temizle
                    </button>
                </div>
            `;
        }

        return `
            <div class="empty-state">
                <h3>👥 Henüz müşteriniz yok</h3>
                <p>İlk müşterinizi ekleyerek başlayın!</p>
                <button onclick="customerManager.showCustomerForm()" class="btn btn-primary">
                    + İlk Müşteriyi Ekle
                </button>
            </div>
        `;
    }

    // Sayfalama render
    renderPagination(pagination) {
        const container = document.getElementById('customersPagination');
        if (!container || !pagination || pagination.pages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Önceki sayfa butonu
        if (this.currentPage > 1) {
            paginationHTML += `<button onclick="customerManager.loadCustomers(${this.currentPage - 1})" class="btn btn-secondary">← Önceki</button>`;
        }

        // Sayfa numaraları
        for (let i = 1; i <= pagination.pages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<span class="pagination-current">${i}</span>`;
            } else {
                paginationHTML += `<button onclick="customerManager.loadCustomers(${i})" class="btn pagination-btn">${i}</button>`;
            }
        }

        // Sonraki sayfa butonu
        if (this.currentPage < pagination.pages) {
            paginationHTML += `<button onclick="customerManager.loadCustomers(${this.currentPage + 1})" class="btn btn-secondary">Sonraki →</button>`;
        }

        container.innerHTML = paginationHTML;
    }

    // Müşteri detayını göster
    async showCustomerDetail(customerId) {
        try {
            app.showLoading();
            const response = await api.getCustomerStats(customerId);
            app.hideLoading();

            const { customer, visitStats, monthlyVisits } = response.data;

            document.getElementById('mainContent').innerHTML = `
                <div class="customer-detail">
                    <div class="detail-header">
                        <button onclick="app.loadPage('customers')" class="btn btn-secondary">
                            ← Müşterilere Dön
                        </button>
                        <div class="header-actions">
                            <button onclick="customerManager.editCustomer('${customer._id}')" class="btn btn-secondary">
                                ✏️ Düzenle
                            </button>
                            <button onclick="customerManager.createVisitForCustomer('${customer._id}')" class="btn btn-primary">
                                📅 Yeni Ziyaret
                            </button>
                        </div>
                    </div>

                    <div class="customer-info-card">
                        <h2>${customer.name}</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>📞 Telefon</label>
                                <span>${customer.phone}</span>
                            </div>
                            <div class="info-item">
                                <label>📧 Email</label>
                                <span>${customer.email || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="info-item">
                                <label>🏢 Firma</label>
                                <span>${customer.company || 'Belirtilmemiş'}</span>
                            </div>
                            <div class="info-item">
                                <label>📋 Kategori</label>
                                <span class="customer-category badge-${customer.category}">
                                    ${this.getCategoryText(customer.category)}
                                </span>
                            </div>
                            <div class="info-item">
                                <label>📍 Adres</label>
                                <span>${customer.address}</span>
                            </div>
                            <div class="info-item">
                                <label>📊 Durum</label>
                                <span class="customer-status status-${customer.status}">
                                    ${this.getStatusText(customer.status)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="stats-cards">
                        <div class="stat-card">
                            <div class="stat-number">${customer.totalOrders}</div>
                            <div class="stat-label">Toplam Sipariş</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${this.formatCurrency(customer.totalSpent)}</div>
                            <div class="stat-label">Toplam Tutar</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${this.formatLastVisit(customer.lastVisitDate, true)}</div>
                            <div class="stat-label">Son Ziyaret</div>
                        </div>
                    </div>

                    ${visitStats && visitStats.length > 0 ? `
                        <div class="visits-stats">
                            <h3>Ziyaret İstatistikleri</h3>
                            <div class="stats-grid">
                                ${visitStats.map(stat => `
                                    <div class="visit-stat">
                                        <span class="stat-type">${this.getStatusText(stat._id)}</span>
                                        <span class="stat-count">${stat.count} ziyaret</span>
                                        <span class="stat-amount">${this.formatCurrency(stat.totalAmount || 0)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="notes-section">
                        <h3>Notlar</h3>
                        <p>${customer.notes || 'Henüz not eklenmemiş.'}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            app.hideLoading();
            alert('Müşteri detayı yüklenirken hata oluştu: ' + error.message);
        }
    }

    // Yardımcı fonksiyonlar
    getCategoryText(category) {
        const categories = {
            'retail': 'Perakende',
            'corporate': 'Kurumsal',
            'wholesale': 'Toptan',
            'other': 'Diğer'
        };
        return categories[category] || category;
    }

    getStatusText(status) {
        const statuses = {
            'active': 'Aktif',
            'inactive': 'Pasif',
            'blocked': 'Bloke'
        };
        return statuses[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount);
    }

    formatLastVisit(date, short = false) {
        if (!date) return 'Henüz yok';
        
        const visitDate = new Date(date);
        if (short) {
            return visitDate.toLocaleDateString('tr-TR');
        }
        return visitDate.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Filtreleri temizle
    clearFilters() {
        this.searchQuery = '';
        this.selectedCategory = '';
        this.selectedStatus = '';
        this.loadCustomers(1);
    }

    // Haritada göster
    showOnMap(lat, lng) {
        app.loadPage('map');
        setTimeout(() => {
            app.focusOnMap(lat, lng);
        }, 500);
    }
    // Müşteri formunu göster
// Müşteri formunu göster - GÜNCELLENMİŞ
showCustomerForm(customerData = null) {
    const isEdit = !!customerData;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="customer-form-container">
            <div class="card-header">
                <h2 class="card-title">${isEdit ? '✏️ Müşteri Düzenle' : '👥 Yeni Müşteri Ekle'}</h2>
                <button onclick="app.loadPage('customers')" class="btn btn-secondary">
                    ← Müşterilere Dön
                </button>
            </div>

            <form onsubmit="customerManager.handleCustomerSubmit(event, ${isEdit ? `'${customerData?._id}'` : 'null'})" 
                  id="customerForm">
                
                <div class="form-section">
                    <h3>📋 Temel Bilgiler</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Müşteri Adı *</label>
                            <input type="text" id="customerName" class="form-control" 
                                   value="${customerData?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Telefon *</label>
                            <input type="tel" id="customerPhone" class="form-control"
                                   value="${customerData?.phone || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="customerEmail" class="form-control"
                                   value="${customerData?.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>Firma</label>
                            <input type="text" id="customerCompany" class="form-control"
                                   value="${customerData?.company || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>📍 Adres Bilgileri</h3>
                    
                    <div class="form-group">
                        <label>Adres *</label>
                        <div class="address-input-group">
                            <textarea id="customerAddress" class="form-control" rows="3" 
                                      placeholder="Örn: İstiklal Caddesi No:123 Beyoğlu/İstanbul" 
                                      required>${customerData?.address || ''}</textarea>
                            <button type="button" onclick="customerManager.geocodeAddressFromForm()" 
                                    class="btn btn-primary address-resolve-btn">
                                📍 Adres Çözümle
                            </button>
                        </div>
                        <small class="form-text">Adresi yazdıktan sonra "Adres Çözümle" butonuna tıklayın</small>
                    </div>

                    <div class="coordinates-display" id="coordinatesDisplay" style="display: none;">
                        <div style="background: #e8f5e8; padding: 0.5rem; border-radius: 5px; margin-bottom: 1rem;">
                            <strong>✅ Koordinatlar Bulundu:</strong>
                            <div id="coordinatesInfo"></div>
                        </div>
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>Enlem *</label>
                            <input type="number" id="customerLat" class="form-control" step="any" 
                                   value="${customerData?.location?.lat || '41.0082'}" required>
                        </div>
                        <div class="form-group">
                            <label>Boylam *</label>
                            <input type="number" id="customerLng" class="form-control" step="any"
                                   value="${customerData?.location?.lng || '28.9784'}" required>
                        </div>
                    </div>

                    <div class="location-buttons">
                        <button type="button" onclick="customerManager.useCurrentLocation()" class="btn btn-outline">
                            📍 Mevcut Konumu Kullan
                        </button>
                        <button type="button" onclick="customerManager.testCoordinatesOnMap()" class="btn btn-outline">
                            🗺️ Haritada Test Et
                        </button>
                        <button type="button" onclick="customerManager.useSampleLocation('istanbul')" class="btn btn-outline">
                            🏙️ İstanbul Merkez
                        </button>
                    </div>
                </div>

                <div class="form-section">
                    <h3>📊 Ek Bilgiler</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Kategori</label>
                            <select id="customerCategory" class="form-control">
                                <option value="retail" ${customerData?.category === 'retail' ? 'selected' : ''}>Perakende</option>
                                <option value="corporate" ${customerData?.category === 'corporate' ? 'selected' : ''}>Kurumsal</option>
                                <option value="wholesale" ${customerData?.category === 'wholesale' ? 'selected' : ''}>Toptan</option>
                                <option value="other" ${customerData?.category === 'other' ? 'selected' : ''}>Diğer</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Durum</label>
                            <select id="customerStatus" class="form-control">
                                <option value="active" ${(!customerData || customerData?.status === 'active') ? 'selected' : ''}>Aktif</option>
                                <option value="inactive" ${customerData?.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                                <option value="blocked" ${customerData?.status === 'blocked' ? 'selected' : ''}>Bloke</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Vergi No</label>
                            <input type="text" id="customerTaxNumber" class="form-control"
                                   value="${customerData?.taxNumber || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>📝 Notlar</h3>
                    <div class="form-group">
                        <textarea id="customerNotes" class="form-control" rows="4" 
                                  placeholder="Müşteri hakkında notlar...">${customerData?.notes || ''}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" onclick="app.loadPage('customers')" class="btn btn-secondary">
                        İptal
                    </button>
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? '✏️ Müşteriyi Güncelle' : '👥 Müşteri Ekle'}
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Müşteri form submit işlemi
async handleCustomerSubmit(event, customerId = null) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('customerName').value,
        phone: document.getElementById('customerPhone').value,
        email: document.getElementById('customerEmail').value || undefined,
        company: document.getElementById('customerCompany').value || undefined,
        address: document.getElementById('customerAddress').value,
        location: {
            lat: parseFloat(document.getElementById('customerLat').value),
            lng: parseFloat(document.getElementById('customerLng').value)
        },
        category: document.getElementById('customerCategory').value,
        status: document.getElementById('customerStatus').value,
        taxNumber: document.getElementById('customerTaxNumber').value || undefined,
        notes: document.getElementById('customerNotes').value || undefined
    };

    console.log('📝 Müşteri verisi:', formData);

    try {
        app.showLoading();
        
        let result;
        if (customerId) {
            // Güncelleme
            result = await api.updateCustomer(customerId, formData);
        } else {
            // Yeni müşteri
            result = await api.createCustomer(formData);
        }

        app.hideLoading();

        if (result.success) {
            alert(`✅ Müşteri ${customerId ? 'güncellendi' : 'oluşturuldu'}!`);
            app.loadPage('customers');
        } else {
            alert(`❌ Hata: ${result.message}`);
        }
    } catch (error) {
        app.hideLoading();
        console.error('Müşteri kaydetme hatası:', error);
        alert(`❌ Müşteri kaydedilemedi: ${error.message}`);
    }
}

// Müşteri düzenle
editCustomer(customerId) {
    const customer = this.currentCustomers.find(c => c._id === customerId);
    if (customer) {
        this.showCustomerForm(customer);
    }
}

// Müşteri için ziyaret oluştur
createVisitForCustomer(customerId) {
    const customer = this.currentCustomers.find(c => c._id === customerId);
    if (customer) {
        // Ziyaret formuna git ve müşteri bilgilerini otomatik doldur
        app.showVisitForm();
        
        // Form elementleri yüklendikten sonra müşteri bilgilerini doldur
        setTimeout(() => {
            const nameInput = document.getElementById('customerName');
            const addressInput = document.getElementById('customerAddress');
            const phoneInput = document.getElementById('customerPhone');
            const latInput = document.getElementById('customerLat');
            const lngInput = document.getElementById('customerLng');
            
            if (nameInput) nameInput.value = customer.name;
            if (addressInput) addressInput.value = customer.address;
            if (phoneInput) phoneInput.value = customer.phone || '';
            if (latInput) latInput.value = customer.location.lat;
            if (lngInput) lngInput.value = customer.location.lng;
        }, 100);
    }
}

// Adres çözümle (Google Maps API)
async geocodeAddressFromForm() {
    const address = document.getElementById('customerAddress').value;
    if (!address) {
        alert('Lütfen önce adres giriniz.');
        return;
    }

    try {
        const coordinates = await app.geocodeAddress(address);
        document.getElementById('customerLat').value = coordinates.lat;
        document.getElementById('customerLng').value = coordinates.lng;
        
        alert(`✅ Adres çözümlendi!\nEnlem: ${coordinates.lat.toFixed(6)}\nBoylam: ${coordinates.lng.toFixed(6)}`);
    } catch (error) {
        console.error('Adres çözümleme hatası:', error);
        alert('❌ Adres çözümlenemedi: ' + error.message);
    }
}

// Mevcut konumu kullan
async useCurrentLocation() {
    if (!app.locationManager.currentLocation) {
        const granted = await app.locationManager.requestLocationPermission();
        if (!granted) {
            alert('Konum erişimi yok.');
            return;
        }
    }

    document.getElementById('customerLat').value = app.locationManager.currentLocation.lat;
    document.getElementById('customerLng').value = app.locationManager.currentLocation.lng;
    
    alert(`📍 Mevcut konum kullanılıyor!\nEnlem: ${app.locationManager.currentLocation.lat.toFixed(6)}\nBoylam: ${app.locationManager.currentLocation.lng.toFixed(6)}`);
}

// Arama işlemi
handleSearch(query) {
    this.searchQuery = query;
    this.loadCustomers(1);
}

// Kategori değişimi
handleCategoryChange(category) {
    this.selectedCategory = category;
    this.loadCustomers(1);
}

// Durum değişimi
handleStatusChange(status) {
    this.selectedStatus = status;
    this.loadCustomers(1);
}
}


// Global instance
const customerManager = new CustomerManager();