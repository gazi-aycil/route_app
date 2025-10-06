const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Giriş yap
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasyon
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email ve şifre zorunludur' 
            });
        }

        // Kullanıcıyı bul (şifre dahil)
        const user = await User.findOne({ email, isActive: true }).select('+password');
        if (!user || !(await user.correctPassword(password))) {
            return res.status(401).json({ 
                success: false,
                message: 'Geçersiz email veya şifre' 
            });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Sunucu hatası' 
        });
    }
});

// Token doğrulama
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Token bulunamadı' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Geçersiz token' 
            });
        }

        res.json({ 
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Geçersiz token' 
        });
    }
});

// Çıkış yap
router.post('/logout', (req, res) => {
    res.json({ 
        success: true,
        message: 'Başarıyla çıkış yapıldı' 
    });
});

module.exports = router;