const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    salesPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String },
        location: { lat: Number, lng: Number }
    },
    plannedDate: { type: Date, required: true },
    actualDate: { type: Date },
    status: { type: String, enum: ['planned', 'in-progress', 'completed'], default: 'planned' },
    notes: { type: String },
    orders: [{
        productName: String,
        quantity: Number,
        unitPrice: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);