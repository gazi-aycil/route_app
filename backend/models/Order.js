const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    visit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
        required: true
    },
    salesPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        name: { type: String, required: true },
        address: { type: String, required: true }
    },
    items: [{
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'delivered', 'invoiced', 'cancelled'],
        default: 'pending'
    },
    delivery: {
        plannedDate: { type: Date },
        actualDate: { type: Date },
        status: { 
            type: String, 
            enum: ['pending', 'scheduled', 'delivered', 'cancelled'], 
            default: 'pending' 
        }
    },
    invoice: {
        number: { type: String },
        date: { type: Date },
        status: { 
            type: String, 
            enum: ['pending', 'created', 'sent', 'paid'], 
            default: 'pending' 
        }
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

orderSchema.index({ salesPerson: 1, status: 1 });
orderSchema.index({ visit: 1 });

module.exports = mongoose.model('Order', orderSchema);