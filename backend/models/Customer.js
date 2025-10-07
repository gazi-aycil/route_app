const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Müşteri adı zorunludur'],
        trim: true,
        maxlength: [100, 'Müşteri adı 100 karakterden uzun olamaz']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir email adresi girin']
    },
    phone: {
        type: String,
        trim: true,
        required: [true, 'Telefon numarası zorunludur']
    },
    address: {
        type: String,
        required: [true, 'Adres zorunludur']
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    company: {
        type: String,
        trim: true
    },
    taxNumber: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['retail', 'corporate', 'wholesale', 'other'],
        default: 'retail'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active'
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notlar 1000 karakterden uzun olamaz']
    },
    salesPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastVisitDate: {
        type: Date
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Son ziyaret tarihini otomatik güncelle
customerSchema.methods.updateLastVisit = function() {
    this.lastVisitDate = new Date();
    return this.save();
};

// Toplam sipariş sayısını artır
customerSchema.methods.incrementOrderCount = function(amount = 0) {
    this.totalOrders += 1;
    this.totalSpent += amount;
    return this.save();
};

// Text search index
customerSchema.index({
    name: 'text',
    email: 'text',
    phone: 'text',
    address: 'text',
    company: 'text'
});

// Performans index'leri
customerSchema.index({ salesPerson: 1, status: 1 });
customerSchema.index({ category: 1 });
customerSchema.index({ lastVisitDate: -1 });

module.exports = mongoose.model('Customer', customerSchema);