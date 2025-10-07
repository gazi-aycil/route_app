class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.directionsService = null;
        this.directionsRenderer = null;
    }

    // Haritayı başlat
    initMap(containerId, center = { lat: 41.0082, lng: 28.9784 }, zoom = 12) {
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) {
            console.error('Harita konteynırı bulunamadı:', containerId);
            return;
        }

        this.map = new google.maps.Map(mapContainer, {
            zoom: zoom,
            center: center,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true
        });

        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer();
        this.directionsRenderer.setMap(this.map);

        console.log('🗺️ Harita başlatıldı');
    }

    // Konuma marker ekle
    addMarker(position, title, icon = null) {
        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: title,
            icon: icon
        });

        this.markers.push(marker);
        return marker;
    }

    // Müşteri marker'ı ekle
 // Müşteri marker'ı ekle - GÜNCELLENMİŞ
addCustomerMarker(customer, visitStatus = 'planned') {
    console.log('📍 Marker ekleniyor:', customer.name, customer.location);
    
    // Koordinatları kontrol et
    if (!customer.location || typeof customer.location.lat !== 'number' || typeof customer.location.lng !== 'number') {
        console.error('❌ Geçersiz koordinatlar:', customer.location);
        return null;
    }

    const iconBase = 'https://maps.google.com/mapfiles/ms/icons/';
    const iconColors = {
        'planned': 'blue-dot.png',
        'in-progress': 'orange-dot.png',
        'completed': 'green-dot.png'
    };

    try {
        const marker = new google.maps.Marker({
            position: customer.location,
            map: this.map,
            title: customer.name,
            icon: iconBase + (iconColors[visitStatus] || 'blue-dot.png'),
            animation: google.maps.Animation.DROP
        });

        // Info window içeriği
        const infoContent = `
            <div style="padding: 0.5rem; min-width: 200px;">
                <h3 style="margin: 0 0 0.5rem 0; color: #333;">${customer.name}</h3>
                <p style="margin: 0 0 0.25rem 0; color: #666;">${customer.address}</p>
                <p style="margin: 0 0 0.25rem 0; color: #666;">📞 ${customer.phone || 'Telefon yok'}</p>
                <p style="margin: 0.25rem 0 0 0; font-weight: bold; color: ${
                    visitStatus === 'completed' ? '#4CAF50' : 
                    visitStatus === 'in-progress' ? '#FF9800' : '#2196F3'
                };">
                    Durum: ${this.getStatusText(visitStatus)}
                </p>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.8rem; color: #999;">
                    Koordinat: ${customer.location.lat.toFixed(6)}, ${customer.location.lng.toFixed(6)}
                </p>
            </div>
        `;

        const infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });

        marker.addListener('click', () => {
            // Önceki info window'ları kapat
            this.closeAllInfoWindows();
            infoWindow.open(this.map, marker);
            this.currentInfoWindow = infoWindow;
        });

        this.markers.push(marker);
        console.log('✅ Marker başarıyla eklendi:', customer.name);
        return marker;
    } catch (error) {
        console.error('❌ Marker oluşturma hatası:', error);
        return null;
    }
}

// Tüm info window'ları kapat
closeAllInfoWindows() {
    if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
    }
}

// Koordinatları doğrula
validateCoordinates(lat, lng) {
    return (lat >= -90 && lat <= 90) && (lng >= -180 && lng <= 180);
}

    // Mevcut konum marker'ı ekle
    addCurrentLocationMarker() {
        if (!locationManager.currentLocation) return null;

        const marker = this.addMarker(
            locationManager.currentLocation,
            'Mevcut Konumunuz',
            'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        );

        return marker;
    }

    // Rota çiz
    calculateRoute(waypoints) {
        if (waypoints.length < 2) return;

        const request = {
            origin: waypoints[0],
            destination: waypoints[waypoints.length - 1],
            waypoints: waypoints.slice(1, -1).map(location => ({
                location: location,
                stopover: true
            })),
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        };

        this.directionsService.route(request, (result, status) => {
            if (status === 'OK') {
                this.directionsRenderer.setDirections(result);
                
                // Rota bilgilerini göster
                const route = result.routes[0];
                const totalDistance = route.legs.reduce((total, leg) => total + leg.distance.value, 0);
                const totalDuration = route.legs.reduce((total, leg) => total + leg.duration.value, 0);
                
                console.log(`🛣️ Toplam mesafe: ${(totalDistance/1000).toFixed(1)}km`);
                console.log(`⏱️ Toplam süre: ${Math.round(totalDuration/60)} dakika`);
            } else {
                console.error('Rota hesaplama hatası:', status);
            }
        });
    }

    // Tüm marker'ları temizle
    clearMarkers() {
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

    // Haritayı konumlara göre zoomla
    fitToMarkers() {
        if (this.markers.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => bounds.extend(marker.getPosition()));
        this.map.fitBounds(bounds);
    }

    getStatusText(status) {
        const statusMap = {
            'planned': 'Planlandı',
            'in-progress': 'Devam Ediyor',
            'completed': 'Tamamlandı'
        };
        return statusMap[status] || status;
    }
}