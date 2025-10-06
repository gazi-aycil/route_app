const express = require('express');
const auth = require('../middleware/auth');
const Visit = require('../models/Visit');
const router = express.Router();

// Tüm ziyaretleri getir
router.get('/', auth, async (req, res) => {
    try {
        const visits = await Visit.find({ salesPerson: req.user.id })
            .sort({ plannedDate: 1 })
            .lean();

        res.json({
            success: true,
            data: visits,
            count: visits.length
        });
    } catch (error) {
        console.error('Get visits error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ziyaretler yüklenirken hata oluştu' 
        });
    }
});

// Bugünkü ziyaretleri getir
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const visits = await Visit.find({
            salesPerson: req.user.id,
            plannedDate: {
                $gte: today,
                $lt: tomorrow
            }
        }).sort({ plannedDate: 1 });

        res.json({
            success: true,
            data: visits,
            count: visits.length
        });
    } catch (error) {
        console.error('Get today visits error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Bugünkü ziyaretler yüklenirken hata oluştu' 
        });
    }
});

// Yeni ziyaret oluştur
router.post('/', auth, async (req, res) => {
    try {
        const visitData = {
            ...req.body,
            salesPerson: req.user.id
        };

        const visit = new Visit(visitData);
        await visit.save();

        res.status(201).json({
            success: true,
            data: visit,
            message: 'Ziyaret başarıyla oluşturuldu'
        });
    } catch (error) {
        console.error('Create visit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ziyaret oluşturulurken hata oluştu' 
        });
    }
});

// Ziyaret güncelle
router.put('/:id', auth, async (req, res) => {
    try {
        const visit = await Visit.findOneAndUpdate(
            { _id: req.params.id, salesPerson: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!visit) {
            return res.status(404).json({ 
                success: false,
                message: 'Ziyaret bulunamadı' 
            });
        }

        res.json({
            success: true,
            data: visit,
            message: 'Ziyaret başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Update visit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ziyaret güncellenirken hata oluştu' 
        });
    }
});

// Ziyaret onayla
router.post('/:id/confirm', auth, async (req, res) => {
    try {
        const { notes, orders, signature } = req.body;

        const visit = await Visit.findOneAndUpdate(
            { _id: req.params.id, salesPerson: req.user.id },
            {
                status: 'completed',
                actualDate: new Date(),
                notes,
                orders,
                confirmation: {
                    confirmed: true,
                    confirmedAt: new Date(),
                    signature
                }
            },
            { new: true }
        );

        if (!visit) {
            return res.status(404).json({ 
                success: false,
                message: 'Ziyaret bulunamadı' 
            });
        }

        res.json({
            success: true,
            data: visit,
            message: 'Ziyaret başarıyla onaylandı'
        });
    } catch (error) {
        console.error('Confirm visit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ziyaret onaylanırken hata oluştu' 
        });
    }
});

// Ziyaret sil
router.delete('/:id', auth, async (req, res) => {
    try {
        const visit = await Visit.findOneAndDelete({
            _id: req.params.id,
            salesPerson: req.user.id
        });

        if (!visit) {
            return res.status(404).json({ 
                success: false,
                message: 'Ziyaret bulunamadı' 
            });
        }

        res.json({
            success: true,
            message: 'Ziyaret başarıyla silindi'
        });
    } catch (error) {
        console.error('Delete visit error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Ziyaret silinirken hata oluştu' 
        });
    }
});

module.exports = router;