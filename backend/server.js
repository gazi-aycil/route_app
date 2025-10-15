const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - Tüm origin'lere izin ver
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

// OPTIONS isteklerini handle et
app.options('*', cors());

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Route App Backend çalışıyor!',
        timestamp: new Date().toISOString()
    });
});

// Login route
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'test@test.com' && password === '123456') {
        res.json({
            success: true,
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test_token_route_app',
            user: {
                id: '1',
                name: 'Test Kullanıcı',
                email: 'test@test.com',
                role: 'sales_person'
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
    
    if (token) {
        res.json({
            success: true,
            user: {
                id: '1',
                name: 'Test Kullanıcı',
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

// Ziyaretler
app.get('/api/visits/today', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                _id: '1',
                customer: {
                    name: 'Örnek Müşteri',
                    address: 'İstanbul',
                    phone: '0555 123 45 67',
                    location: { lat: 41.0082, lng: 28.9784 }
                },
                plannedDate: new Date().toISOString(),
                status: 'planned'
            }
        ]
    });
});

app.post('/api/visits', (req, res) => {
    res.json({
        success: true,
        data: { ...req.body, _id: 'new_visit_id' },
        message: 'Ziyaret oluşturuldu'
    });
});

// Müşteriler
app.get('/api/customers', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                _id: '1',
                name: 'Örnek Müşteri',
                phone: '0555 123 45 67',
                email: 'musteri@ornek.com',
                address: 'İstanbul',
                location: { lat: 41.0082, lng: 28.9784 },
                category: 'retail',
                status: 'active'
            }
        ]
    });
});

app.post('/api/customers', (req, res) => {
    res.json({
        success: true,
        data: { ...req.body, _id: 'new_customer_id' },
        message: 'Müşteri oluşturuldu'
    });
});

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'API route bulunamadı'
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        message: 'Route App API çalışıyor!',
        version: '1.0.0'
    });
});

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/route-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.log('❌ MongoDB bağlantı hatası:', err.message));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Backend ${PORT} portunda çalışıyor`);
});