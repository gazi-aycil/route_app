class VisitManager {
    constructor() {
        this.currentVisits = [];
    }

    async loadVisits() {
        try {
            app.showLoading();
            const response = await api.getTodayVisits();
            this.currentVisits = response.data;
            this.renderVisits();
        } catch (error) {
            console.error('Visits load error:', error);
            alert('Ziyaretler yüklenirken hata oluştu: ' + error.message);
        } finally {
            app.hideLoading();
        }
    }

    renderVisits() {
        const container = document.getElementById('visitsList');
        if (!container) return;

        if (this.currentVisits.length === 0) {
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

        container.innerHTML = this.currentVisits.map(visit => `
            <div class="visit-item">
                <div class="visit-header">
                    <div class="customer-name">${visit.customer.name}</div>
                    <span class="visit-status status-${visit.status}">
                        ${this.getStatusText(visit.status)}
                    </span>
                </div>
                <div class="visit-details">
                    <div>📍 ${visit.customer.address}</div>
                    <div>📞 ${visit.customer.phone || 'Telefon yok'}</div>
                    <div>⏰ ${this.formatDate(visit.plannedDate)}</div>
                </div>
                <div class="visit-actions">
                    ${visit.status === 'planned' ? `
                        <button onclick="app.startVisit('${visit._id}')" class="btn btn-primary btn-sm">
                            Başlat
                        </button>
                    ` : ''}
                    ${visit.status === 'in-progress' ? `
                        <button onclick="app.showVisitCompletionForm('${visit._id}')" class="btn btn-success btn-sm">
                            Tamamla
                        </button>
                    ` : ''}
                    <button onclick="app.viewVisitDetails('${visit._id}')" class="btn btn-secondary btn-sm">
                        Detay
                    </button>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'planned': 'Planlandı',
            'in-progress': 'Devam Ediyor',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal Edildi'
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
}