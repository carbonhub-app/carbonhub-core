const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    publicKey: { type: String, required: true },
    type: { type: String, enum: ["user", "company"], required: true },
    latestChallenge: { type: String, required: false },
});

const Auth = mongoose.model("Auth", authSchema);

module.exports = {
    Auth
};