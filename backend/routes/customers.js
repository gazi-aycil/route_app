const express = require('express');
const auth = require('../middleware/auth');
const Customer = require('../models/Customer');
const Visit = require('../models/Visit');
const router = express.Router();

// Tüm müşterileri getir
router.get('/', auth, async (req, res) => {
    try {
        const { search, category, status, page = 1, limit = 20 } = req.query;
        
        let query = { salesPerson: req.user._id };
        
        // Arama filtresi
        if (search) {
            query.$text = { $search: search };
        }
        
        // Kategori filtresi
        if (category) {
            query.category = category;
        }
        
        // Durum filtresi
        if (status) {
            query.status = status;
        }

        const customers = await Customer.find(query)
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Customer.countDocuments(query);

        res.json({
            success: true,
            data: customers,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total: total
            }
        });
    } catch (error) {
        console.error('Müşteri listeleme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Yeni müşteri oluştur
router.post('/', auth, async (req, res) => {
    try {
        const customerData = {
            ...req.body,
            salesPerson: req.user._id
        };

        // Email benzersizlik kontrolü
        if (customerData.email) {
            const existingCustomer = await Customer.findOne({ 
                email: customerData.email, 
                salesPerson: req.user._id 
            });
            if (existingCustomer) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Bu email adresi zaten kullanılıyor' 
                });
            }
        }

        const customer = new Customer(customerData);
        await customer.save();

        res.status(201).json({
            success: true,
            data: customer,
            message: 'Müşteri başarıyla oluşturuldu'
        });
    } catch (error) {
        console.error('Müşteri oluşturma hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Müşteri detayını getir
router.get('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            salesPerson: req.user._id
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Müşteri bulunamadı' });
        }

        // Müşterinin ziyaret geçmişini getir
        const visits = await Visit.find({ 
            'customer.name': customer.name,
            salesPerson: req.user._id 
        })
        .sort({ plannedDate: -1 })
        .limit(10);

        res.json({
            success: true,
            data: {
                customer,
                recentVisits: visits
            }
        });
    } catch (error) {
        console.error('Müşteri detay hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Müşteri güncelle
router.put('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findOneAndUpdate(
            { _id: req.params.id, salesPerson: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Müşteri bulunamadı' });
        }

        res.json({
            success: true,
            data: customer,
            message: 'Müşteri başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Müşteri güncelleme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Müşteri sil
router.delete('/:id', auth, async (req, res) => {
    try {
        const customer = await Customer.findOneAndDelete({
            _id: req.params.id,
            salesPerson: req.user._id
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Müşteri bulunamadı' });
        }

        res.json({
            success: true,
            message: 'Müşteri başarıyla silindi'
        });
    } catch (error) {
        console.error('Müşteri silme hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Müşteri istatistikleri
router.get('/:id/stats', auth, async (req, res) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            salesPerson: req.user._id
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Müşteri bulunamadı' });
        }

        // Ziyaret istatistikleri
        const visitStats = await Visit.aggregate([
            {
                $match: {
                    'customer.name': customer.name,
                    salesPerson: req.user._id
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalOrderAmount' }
                }
            }
        ]);

        // Son 6 aylık ziyaret trendi
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyVisits = await Visit.aggregate([
            {
                $match: {
                    'customer.name': customer.name,
                    salesPerson: req.user._id,
                    plannedDate: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$plannedDate' },
                        month: { $month: '$plannedDate' }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalOrderAmount' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                customer,
                visitStats,
                monthlyVisits
            }
        });
    } catch (error) {
        console.error('Müşteri istatistik hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Hızlı müşteri arama
router.get('/search/quick', auth, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const customers = await Customer.find({
            salesPerson: req.user._id,
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { phone: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        })
        .select('name phone email address')
        .limit(10);

        res.json({ success: true, data: customers });
    } catch (error) {
        console.error('Müşteri arama hatası:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;