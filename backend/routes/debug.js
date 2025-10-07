const express = require('express');
const Visit = require('../models/Visit');
const router = express.Router();

// Tüm ziyaretleri ve koordinatlarını listele
router.get('/visits-with-coords', async (req, res) => {
    try {
        const visits = await Visit.find({});
        const visitsWithCoords = visits.map(visit => ({
            _id: visit._id,
            customerName: visit.customer.name,
            address: visit.customer.address,
            location: visit.customer.location,
            coordinates: `Lat: ${visit.customer.location?.lat || 'N/A'}, Lng: ${visit.customer.location?.lng || 'N/A'}`,
            isValid: visit.customer.location && 
                     typeof visit.customer.location.lat === 'number' &&
                     typeof visit.customer.location.lng === 'number'
        }));
        
        res.json({ 
            success: true, 
            data: visitsWithCoords,
            total: visits.length,
            valid: visitsWithCoords.filter(item => item.isValid).length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// MongoDB bağlantı durumunu kontrol et
router.get('/database-status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState;
        const statusMap = {
            0: 'disconnected',
            1: 'connected', 
            2: 'connecting',
            3: 'disconnecting'
        };

        // Test query
        const visitCount = await Visit.countDocuments();

        res.json({ 
            success: true,
            database: {
                status: statusMap[dbStatus],
                readyState: dbStatus,
                visitCount: visitCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;