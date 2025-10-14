const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - Tüm origin'lere izin ver
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json());

// BASİT ROUTE'lar - kesin çalışsın
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend çalışıyor!',
        timestamp: new Date().toISOString(),
        service: 'Route App API'
    });
});

// Login route - kesin çalışsın
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // Test kullanıcısı - her zaman çalışsın
    if (email === 'test@test.com' && password === '123456') {
        res.json({
            success: true,
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token_route_app_12345',
            user: {
                id: '507f1f77bcf86cd799439011',
                name: 'Test Satış Elemanı',
                email: 'test@test.com',
                role: 'sales_person',
                phone: '0555 555 55 55'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Geçersiz email veya şifre'
        });
    }
});

// Token doğrulama
app.get('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && token.includes('test_token')) {
        res.json({
            success: true,
            user: {
                id: '507f1f77bcf86cd799439011',
                name: 'Test Satış Elemanı',
                email: 'test@test.com',
                role: 'sales_person'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Geçersiz token'
        });
    }
});

// Test için basit visits route
app.get('/api/visits/today', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                _id: '1',
                customer: {
                    name: 'Örnek Müşteri 1',
                    address: 'İstiklal Caddesi No:123 Beyoğlu/İstanbul',
                    phone: '0555 123 45 67',
                    location: { lat: 41.0082, lng: 28.9784 }
                },
                plannedDate: new Date().toISOString(),
                status: 'planned'
            },
            {
                _id: '2',
                customer: {
                    name: 'Örnek Müşteri 2',
                    address: 'Bağdat Caddesi No:456 Kadıköy/İstanbul',
                    phone: '0555 987 65 43',
                    location: { lat: 40.9861, lng: 29.0365 }
                },
                plannedDate: new Date().toISOString(),
                status: 'in-progress'
            }
        ]
    });
});

// Tüm ziyaretler
app.get('/api/visits', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                _id: '1',
                customer: {
                    name: 'Örnek Müşteri 1',
                    address: 'İstiklal Caddesi No:123 Beyoğlu/İstanbul',
                    phone: '0555 123 45 67',
                    location: { lat: 41.0082, lng: 28.9784 }
                },
                plannedDate: new Date().toISOString(),
                status: 'planned'
            }
        ]
    });
});

// Ziyaret oluştur
app.post('/api/visits', (req, res) => {
    console.log('📍 Create visit:', req.body);
    res.json({
        success: true,
        data: { ...req.body, _id: 'new_visit_id' },
        message: 'Ziyaret oluşturuldu'
    });
});

// Ziyaret güncelle
app.put('/api/visits/:id', (req, res) => {
    console.log('✏️ Update visit:', req.params.id, req.body);
    res.json({
        success: true,
        data: { ...req.body, _id: req.params.id },
        message: 'Ziyaret güncellendi'
    });
});

// Test için basit customers route
app.get('/api/customers', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                _id: '1',
                name: 'Örnek Müşteri 1',
                phone: '0555 123 45 67',
                email: 'musteri1@ornek.com',
                address: 'İstiklal Caddesi No:123 Beyoğlu/İstanbul',
                location: { lat: 41.0082, lng: 28.9784 },
                category: 'retail',
                status: 'active',
                totalOrders: 5,
                totalSpent: 12500,
                company: 'Örnek Şirket A.Ş.',
                notes: 'Örnek notlar buraya yazılabilir'
            },
            {
                _id: '2',
                name: 'Örnek Müşteri 2',
                phone: '0555 987 65 43',
                email: 'musteri2@ornek.com',
                address: 'Bağdat Caddesi No:456 Kadıköy/İstanbul',
                location: { lat: 40.9861, lng: 29.0365 },
                category: 'corporate',
                status: 'active',
                totalOrders: 12,
                totalSpent: 45000,
                company: 'Örnek Ltd. Şti.',
                notes: 'Kurumsal müşteri'
            }
        ]
    });
});

// Create customer
app.post('/api/customers', (req, res) => {
    console.log('👥 Create customer:', req.body);
    res.json({
        success: true,
        data: { ...req.body, _id: 'new_customer_id' },
        message: 'Müşteri oluşturuldu'
    });
});

// Customer detail
app.get('/api/customers/:id', (req, res) => {
    res.json({
        success: true,
        data: {
            _id: req.params.id,
            name: 'Örnek Müşteri',
            phone: '0555 123 45 67',
            email: 'musteri@ornek.com',
            address: 'İstiklal Caddesi No:123 Beyoğlu/İstanbul',
            location: { lat: 41.0082, lng: 28.9784 },
            category: 'retail',
            status: 'active',
            totalOrders: 5,
            totalSpent: 12500,
            company: 'Örnek Şirket A.Ş.',
            notes: 'Örnek notlar buraya yazılabilir',
            lastVisitDate: new Date().toISOString()
        }
    });
});

// Customer stats
app.get('/api/customers/:id/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            customer: {
                _id: req.params.id,
                name: 'Örnek Müşteri',
                totalOrders: 5,
                totalSpent: 12500,
                lastVisitDate: new Date().toISOString()
            },
            visitStats: [
                { _id: 'completed', count: 3, totalAmount: 7500 },
                { _id: 'planned', count: 1, totalAmount: 0 },
                { _id: 'in-progress', count: 1, totalAmount: 0 }
            ],
            monthlyVisits: [
                { _id: { year: 2024, month: 1 }, count: 2, totalAmount: 5000 },
                { _id: { year: 2024, month: 2 }, count: 3, totalAmount: 7500 }
            ]
        }
    });
});

// Customer search
app.get('/api/customers/search/quick', (req, res) => {
    const { q } = req.query;
    res.json({
        success: true,
        data: [
            {
                _id: '1',
                name: 'Örnek Müşteri',
                phone: '0555 123 45 67',
                email: 'musteri@ornek.com',
                address: 'İstiklal Caddesi No:123 Beyoğlu/İstanbul'
            }
        ]
    });
});

// 404 handler - en sonda olmalı
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: `API route bulunamadı: ${req.originalUrl}`,
        availableRoutes: [
            'GET  /api/health',
            'POST /api/auth/login',
            'GET  /api/auth/verify',
            'GET  /api/visits',
            'GET  /api/visits/today',
            'POST /api/visits',
            'PUT  /api/visits/:id',
            'GET  /api/customers',
            'POST /api/customers',
            'GET  /api/customers/:id',
            'GET  /api/customers/:id/stats',
            'GET  /api/customers/search/quick'
        ]
    });
});

// Root handler
app.get('/', (req, res) => {
    res.json({
        message: 'Route App API çalışıyor!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET  /api/health',
            login: 'POST /api/auth/login',
            verify: 'GET  /api/auth/verify',
            visits: 'GET  /api/visits',
            visitsToday: 'GET  /api/visits/today',
            createVisit: 'POST /api/visits',
            updateVisit: 'PUT  /api/visits/:id',
            customers: 'GET  /api/customers',
            createCustomer: 'POST /api/customers',
            customerDetail: 'GET  /api/customers/:id',
            customerStats: 'GET  /api/customers/:id/stats',
            customerSearch: 'GET  /api/customers/search/quick'
        }
    });
});

// MongoDB bağlantısı
const connectDB = async () => {
    if (process.env.MONGODB_URI) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('✅ MongoDB bağlantısı başarılı');
        } catch (error) {
            console.log('❌ MongoDB bağlantı hatası:', error.message);
            console.log('⚠️ Memory modunda devam ediliyor');
        }
    } else {
        console.log('⚠️ MongoDB URI bulunamadı, memory modunda çalışıyor');
    }
};

connectDB();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Backend ${PORT} portunda çalışıyor`);
    console.log(`🔗 URL: https://route-app.onrender.com`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ MongoDB: ${mongoose.connection.readyState === 1 ? 'Bağlı' : 'Bağlı değil'}`);
});