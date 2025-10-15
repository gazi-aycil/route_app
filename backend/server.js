const express = require('express');
const app = express();

// EN BASİT CORS ÇÖZÜMÜ
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});

app.use(express.json());

// KESİN ÇALIŞAN HEALTH CHECK
app.get('/api/health', (req, res) => {
    console.log('✅ Health check received');
    res.json({ 
        status: 'OK', 
        message: 'Backend çalışıyor!',
        timestamp: new Date().toISOString()
    });
});

// KESİN ÇALIŞAN LOGIN
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    // HER ZAMAN BAŞARILI DÖNSÜN - TEST İÇİN
    res.json({
        success: true,
        token: 'test_jwt_token_' + Date.now(),
        user: {
            id: '1',
            name: 'Test Kullanıcı',
            email: email,
            role: 'sales_person'
        }
    });
});

// Tüm diğer route'lar için basit cevaplar
app.get('/api/visits/today', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

app.get('/api/customers', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.json({ 
        message: 'Route App API',
        endpoint: req.originalUrl,
        method: req.method
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Backend ${PORT} portunda çalışıyor`);
    console.log(`✅ CORS: Aktif`);
    console.log(`✅ Health: /api/health`);
    console.log(`✅ Login: /api/auth/login`);
});