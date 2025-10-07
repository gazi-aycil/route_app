const express = require('express');
const auth = require('../middleware/auth');
const Visit = require('../models/Visit');
const router = express.Router();

// Tüm ziyaretleri getir
router.get('/', auth, async (req, res) => {
    try {
        console.log('📋 Ziyaretler getiriliyor, kullanıcı:', req.user._id);
        const visits = await Visit.find({ salesPerson: req.user._id }).sort({ plannedDate: 1 });
        console.log('✅ Ziyaretler bulundu:', visits.length);
        res.json({ success: true, data: visits });
    } catch (error) {
        console.error('❌ Ziyaret getirme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Bugünkü ziyaretleri getir
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('📅 Bugünkü ziyaretler getiriliyor:', today);
        
        const visits = await Visit.find({
            salesPerson: req.user._id,
            plannedDate: { $gte: today, $lt: tomorrow }
        }).sort({ plannedDate: 1 });

        console.log('✅ Bugünkü ziyaretler bulundu:', visits.length);
        res.json({ success: true, data: visits });
    } catch (error) {
        console.error('❌ Bugünkü ziyaret getirme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Yeni ziyaret oluştur
router.post('/', auth, async (req, res) => {
    try {
        console.log('🆕 Yeni ziyaret oluşturuluyor:', req.body);
        
        const visitData = {
            ...req.body,
            salesPerson: req.user._id
        };

        const visit = new Visit(visitData);
        const savedVisit = await visit.save();
        
        console.log('✅ Ziyaret oluşturuldu:', savedVisit._id);
        res.json({ 
            success: true, 
            data: savedVisit, 
            message: 'Ziyaret başarıyla oluşturuldu' 
        });
    } catch (error) {
        console.error('❌ Ziyaret oluşturma hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ziyaret güncelle
router.put('/:id', auth, async (req, res) => {
    try {
        console.log('✏️ Ziyaret güncelleniyor:', req.params.id, req.body);
        
        const visit = await Visit.findOneAndUpdate(
            { _id: req.params.id, salesPerson: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!visit) {
            console.log('❌ Ziyaret bulunamadı:', req.params.id);
            return res.status(404).json({ success: false, message: 'Ziyaret bulunamadı' });
        }

        console.log('✅ Ziyaret güncellendi:', visit._id);
        res.json({ success: true, data: visit, message: 'Ziyaret güncellendi' });
    } catch (error) {
        console.error('❌ Ziyaret güncelleme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ziyaret sil
router.delete('/:id', auth, async (req, res) => {
    try {
        console.log('🗑️ Ziyaret siliniyor:', req.params.id);
        
        const visit = await Visit.findOneAndDelete({
            _id: req.params.id,
            salesPerson: req.user._id
        });

        if (!visit) {
            return res.status(404).json({ success: false, message: 'Ziyaret bulunamadı' });
        }

        console.log('✅ Ziyaret silindi:', req.params.id);
        res.json({ success: true, message: 'Ziyaret silindi' });
    } catch (error) {
        console.error('❌ Ziyaret silme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ziyaret detayını getir
router.get('/:id', auth, async (req, res) => {
    try {
        const visit = await Visit.findOne({
            _id: req.params.id,
            salesPerson: req.user._id
        });

        if (!visit) {
            return res.status(404).json({ success: false, message: 'Ziyaret bulunamadı' });
        }

        res.json({ success: true, data: visit });
    } catch (error) {
        console.error('❌ Ziyaret detay hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;