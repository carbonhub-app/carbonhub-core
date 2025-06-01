const mongoose = require('mongoose');
const { randomUUID } = require('crypto');

const companySchema = new mongoose.Schema({
    publicKey: { type: String, required: false },
    name: { type: String, required: true },
    apiKey: { type: String, required: true, default: randomUUID },
    emissions: {
        annual: [{
            year: { type: String, required: true },
            totalTon: { type: Number, required: true }
        }],
        monthly: [{
            month: { type: String, required: true },
            totalTon: { type: Number, required: true }
        }],
        daily: [{
            day: { type: String, required: true },
            totalTon: { type: Number, required: true }
        }],
    },
    reports: [{
        ppm: { type: Number, required: true },
        ton: { type: Number, required: true },
        time: { type: Date, required: true }
    }]
});

const Company = mongoose.model("Company", companySchema);

module.exports = {
    Company
};