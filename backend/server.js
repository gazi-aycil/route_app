const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['https://saha-satis-app.netlify.app', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => console.log('❌ MongoDB bağlantı hatası:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));

// Health check - Render için önemli
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Saha Satış API'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Saha Satış API çalışıyor!',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            visits: '/api/visits',
            orders: '/api/orders',
            customers: '/api/customers'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'API endpoint bulunamadı' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('🔥 Sunucu hatası:', err.stack);
    res.status(500).json({ 
        message: 'Sunucu hatası!',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Sunucu ${PORT} portunda çalışıyor`);
    console.log(`📊 MongoDB: ${mongoose.connection.readyState === 1 ? 'Bağlı' : 'Bağlı değil'}`);
});