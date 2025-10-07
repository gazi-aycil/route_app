const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());

// MongoDB bağlantısı - GÜNCELLENDİ
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB bağlantısı başarılı'))
.catch(err => {
    console.log('❌ MongoDB bağlantı hatası:', err.message);
    process.exit(1);
});

// MongoDB bağlantı event'leri
mongoose.connection.on('connected', () => {
    console.log('📊 MongoDB veritabanına bağlandı');
});

mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB bağlantı hatası:', err);
});

// Routes

app.use('/api/auth', require('./routes/auth'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/customers', require('./routes/customers')); // YENİ
//app.use('/api/orders', require('./routes/orders'));


// Test route - test kullanıcısı oluştur
app.post('/api/create-test-user', async (req, res) => {
    try {
        const User = require('./models/User');
        
        // Önce kullanıcı var mı kontrol et
        const existingUser = await User.findOne({ email: 'test@test.com' });
        if (existingUser) {
            return res.json({ 
                success: true, 
                message: 'Test kullanıcısı zaten var: test@test.com / 123456' 
            });
        }

        const testUser = new User({
            name: 'Test Kullanıcı',
            email: 'test@test.com',
            password: '123456',
            role: 'sales_person'
        });
        await testUser.save();
        res.json({ 
            success: true, 
            message: 'Test kullanıcısı oluşturuldu: test@test.com / 123456' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tüm kullanıcıları listele (test için)
app.get('/api/users', async (req, res) => {
    try {
        const User = require('./models/User');
        const users = await User.find().select('-password');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tüm ziyaretleri listele (test için)
app.get('/api/all-visits', async (req, res) => {
    try {
        const Visit = require('./models/Visit');
        const visits = await Visit.find().populate('salesPerson', 'name email');
        res.json({ success: true, data: visits });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Health check - MongoDB durumunu da göster
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({ 
        status: 'OK', 
        message: 'Backend çalışıyor!',
        database: statusMap[dbStatus],
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚀 Backend http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📊 MongoDB durumu: ${mongoose.connection.readyState === 1 ? 'Bağlı' : 'Bağlı değil'}`);
});
// Debug routes (sadece development'ta)
if (process.env.NODE_ENV === 'development') {
    app.use('/api/debug', require('./routes/debug'));

}
if (process.env.NODE_ENV === 'development') {
    app.use('/api/fix', require('./routes/fix-coordinates'));
}
if (process.env.NODE_ENV === 'development') {
    app.use('/api/debug', require('./routes/debug'));
    app.use('/api/fix', require('./routes/fix-coordinates'));
    
    console.log('🔧 Debug routes aktif: /api/debug, /api/fix');
}
