// Çevrimdışı veri yönetimi
class OfflineManager {
    constructor() {
        this.dbName = 'SahaSatisDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB desteklenmiyor');
            return;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Visits store
                if (!db.objectStoreNames.contains('visits')) {
                    const visitsStore = db.createObjectStore('visits', { keyPath: '_id' });
                    visitsStore.createIndex('status', 'status', { unique: false });
                    visitsStore.createIndex('plannedDate', 'plannedDate', { unique: false });
                }

                // Orders store
                if (!db.objectStoreNames.contains('orders')) {
                    const ordersStore = db.createObjectStore('orders', { keyPath: '_id' });
                    ordersStore.createIndex('status', 'status', { unique: false });
                }

                // Sync queue store
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    syncStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }

    // Çevrimdışı veri ekleme
    async addOfflineData(storeName, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Çevrimdışı veri okuma
    async getOfflineData(storeName, key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Tüm verileri getir
    async getAllOfflineData(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // Çevrimiçi olduğunda senkronizasyon
    async syncOfflineData() {
        if (!navigator.onLine) return;

        try {
            const syncQueue = await this.getAllOfflineData('syncQueue');
            
            for (const item of syncQueue) {
                try {
                    // API'ye gönder
                    await fetch(item.url, {
                        method: item.method,
                        headers: item.headers,
                        body: item.body
                    });

                    // Başarılı olursa kuyruktan sil
                    await this.deleteOfflineData('syncQueue', item.id);
                } catch (error) {
                    console.error('Sync error:', error);
                }
            }
        } catch (error) {
            console.error('Sync manager error:', error);
        }
    }

    // Veri silme
    async deleteOfflineData(storeName, key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// Global offline manager
const offlineManager = new OfflineManager();

// Çevrimiçi/çevrimdışı event listener'ları
window.addEventListener('online', () => {
    console.log('Çevrimiçi oldu, senkronizasyon başlatılıyor...');
    offlineManager.syncOfflineData();
});

window.addEventListener('offline', () => {
    console.log('Çevrimdışı moda geçildi');
});