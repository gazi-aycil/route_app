class LocationManager {
    constructor() {
        this.currentLocation = null;
        this.watchId = null;
        this.isTracking = false;
    }

    // Kullanıcı konumunu al
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('GPS desteklenmiyor'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date()
                    };
                    
                    // Konum durumunu güncelle
                    this.updateLocationStatus();
                    resolve(this.currentLocation);
                },
                (error) => {
                    const errorMessages = {
                        1: 'Konum erişimi reddedildi',
                        2: 'Konum bilgisi alınamadı',
                        3: 'Konum alma zaman aşımı'
                    };
                    reject(new Error(errorMessages[error.code] || 'Konum alınamadı'));
                },
                options
            );
        });
    }

    // Konum takibini başlat
    startTracking() {
        if (!navigator.geolocation || this.isTracking) return;

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date()
                };
                
                this.updateLocationStatus();
                console.log('📍 Konum güncellendi:', this.currentLocation);
            },
            (error) => {
                console.error('Konum takip hatası:', error);
            },
            options
        );

        this.isTracking = true;
        console.log('📍 Konum takibi başlatıldı');
    }

    // Konum takibini durdur
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.isTracking = false;
            console.log('📍 Konum takibi durduruldu');
        }
    }

    // İki konum arasındaki mesafeyi hesapla (metre cinsinden)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Dünya yarıçapı metre cinsinden
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return Math.round(distance);
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    // Konum yakınlığını kontrol et (500 metre)
    isLocationNearby(targetLat, targetLng, maxDistance = 500) {
        if (!this.currentLocation) return false;
        
        const distance = this.calculateDistance(
            this.currentLocation.lat,
            this.currentLocation.lng,
            targetLat,
            targetLng
        );
        
        return distance <= maxDistance;
    }

    // Konum durumunu header'da göster
    updateLocationStatus() {
        const statusElement = document.getElementById('locationStatus');
        if (!statusElement) return;

        if (this.currentLocation) {
            statusElement.innerHTML = `📍 Konum: ${this.currentLocation.lat.toFixed(4)}, ${this.currentLocation.lng.toFixed(4)}`;
            statusElement.style.color = '#4CAF50';
        } else {
            statusElement.innerHTML = '📍 Konum bilgisi yok';
            statusElement.style.color = '#f44336';
        }
    }

    // Konum izni iste
    async requestLocationPermission() {
        try {
            await this.getCurrentLocation();
            this.startTracking();
            return true;
        } catch (error) {
            console.error('Konum izni hatası:', error);
            return false;
        }
    }
}