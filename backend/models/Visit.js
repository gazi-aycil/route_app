const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    salesPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Satış elemanı zorunludur']
    },
    customer: {
        name: { 
            type: String, 
            required: [true, 'Müşteri adı zorunludur'],
            trim: true
        },
        address: { 
            type: String, 
            required: [true, 'Adres zorunludur'] 
        },
        phone: { 
            type: String,
            trim: true
        },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        }
    },
    plannedDate: {
        type: Date,
        required: [true, 'Planlanan tarih zorunludur']
    },
    actualDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'cancelled'],
        default: 'planned'
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notlar 1000 karakterden uzun olamaz']
    },
    confirmation: {
        confirmed: { type: Boolean, default: false },
        confirmedAt: { type: Date },
        signature: { type: String } // Base64 imza
    },
    orders: [{
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
    }],
    totalOrderAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Toplam sipariş tutarını hesapla
visitSchema.pre('save', function(next) {
    if (this.orders && this.orders.length > 0) {
        this.totalOrderAmount = this.orders.reduce((total, order) => {
            return total + (order.quantity * order.unitPrice);
        }, 0);
    }
    next();
});

// Bugünkü ziyaretleri bulmak için index
visitSchema.index({ salesPerson: 1, plannedDate: 1 });
visitSchema.index({ status: 1 });

module.exports = mongoose.model('Visit', visitSchema);