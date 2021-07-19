const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const userSchma = new Schema({
    firstname: {
        type: String
    },
    middlename: {
        type: String
    },
    surname: {
        type: String
    },
    email: {
        type: String
    },
    gender: {
        type: String
    },
    dob: {
        type: String
    },
    address: {
        type: String
    },
    branch: {
        type: String
    },
    zone: {
        type: String
    },
    unit: {
        type: String
    },
    state: {
        type: String
    },
    phone_no: {
        type: Number
    },
    next_of_kin_name: {
        type: String
    },
    next_of_kin_address: {
        type: String
    },
    next_of_kin_phone_no: {
        type: String
    },
    image: {
        type: String
    },
    imageId: {
        type: String
    },
    imageBlob: {
        type: String
    },
    vehicleNumber: {
        type: String
    },
    transportation_type: {
        type: String
    },
    verifiedIdType: {
        type: String
    },
    verifiedId: {
        type: String
    },
    finger1: {
        type: String,
        text: true
    },

    finger2: {
        type: String,
        text: true
    },
    fingerId: {
        type: String,
        text: true
    },
    signature: {
        type: String
    },
    uniqueId: {
        type: String,
        text: true,
        default: null
    },
    password: {
        type: String,
    },
    resetToken: String,
    resetTokenExpiration: Date,
    updatedAt: {
        type: Date,
        default: Date.now()
    },
    agentId: {
        type: Schema.Types.ObjectId,
        ref: 'Agent'
    },
    approved: {
        type: Boolean,
        default: false
    }
});
// userSchma.index({finger1:'text', finger2:'text', uniqueId:'text', fingerId: 'text'});
module.exports = mongoose.model('User', userSchma);