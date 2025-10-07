const express = require('express');
const Visit = require('../models/Visit');
const router = express.Router();

// Tüm ziyaretlerin koordinatlarını düzelt
router.post('/fix-all-coordinates', async (req, res) => {
    try {
        const visits = await Visit.find({});
        let fixedCount = 0;

        for (let visit of visits) {
            console.log('🔍 Ziyaret kontrol ediliyor:', visit.customer.name, visit.customer.location);
            
            // Koordinatları kontrol et ve düzelt
            if (!visit.customer.location || 
                typeof visit.customer.location.lat !== 'number' ||
                typeof visit.customer.location.lng !== 'number' ||
                visit.customer.location.lat === 0 ||
                visit.customer.location.lng === 0) {
                
                console.log('❌ Geçersiz koordinatlar, düzeltiliyor:', visit.customer.name);
                
                // İstanbul içinde rastgele koordinatlar
                visit.customer.location = {
                    lat: 41.0082 + (Math.random() - 0.5) * 0.1,
                    lng: 28.9784 + (Math.random() - 0.5) * 0.1
                };
                
                await visit.save();
                fixedCount++;
                console.log('✅ Düzeltildi:', visit.customer.name, visit.customer.location);
            }
        }

        res.json({ 
            success: true, 
            message: `${fixedCount} ziyaretin koordinatları düzeltildi`,
            fixedCount: fixedCount
        });
    } catch (error) {
        console.error('❌ Koordinat düzeltme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Belirli bir ziyaretin koordinatlarını düzelt
router.post('/fix-visit/:id', async (req, res) => {
    try {
        const visit = await Visit.findById(req.params.id);
        if (!visit) {
            return res.status(404).json({ success: false, message: 'Ziyaret bulunamadı' });
        }

        console.log('🔍 Ziyaret kontrol ediliyor:', visit.customer.name, visit.customer.location);

        // Yeni koordinatlar (İstanbul merkezli)
        visit.customer.location = {
            lat: 41.0082 + (Math.random() - 0.5) * 0.05,
            lng: 28.9784 + (Math.random() - 0.5) * 0.05
        };

        await visit.save();

        res.json({ 
            success: true, 
            message: 'Ziyaret koordinatları düzeltildi',
            data: {
                name: visit.customer.name,
                location: visit.customer.location
            }
        });
    } catch (error) {
        console.error('❌ Ziyaret düzeltme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Tüm ziyaretlerin koordinatlarını listele
router.get('/list-coordinates', async (req, res) => {
    try {
        const visits = await Visit.find({});
        const coordinatesList = visits.map(visit => ({
            id: visit._id,
            customerName: visit.customer.name,
            address: visit.customer.address,
            location: visit.customer.location,
            isValid: visit.customer.location && 
                     typeof visit.customer.location.lat === 'number' &&
                     typeof visit.customer.location.lng === 'number' &&
                     visit.customer.location.lat !== 0 &&
                     visit.customer.location.lng !== 0
        }));

        res.json({ 
            success: true, 
            data: coordinatesList,
            total: visits.length,
            valid: coordinatesList.filter(item => item.isValid).length,
            invalid: coordinatesList.filter(item => !item.isValid).length
        });
    } catch (error) {
        console.error('❌ Koordinat listeleme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;