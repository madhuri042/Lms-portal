const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please add a first name'],
        },
        lastName: {
            type: String,
            required: [true, 'Please add a last name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['admin', 'instructor', 'student'],
            default: 'student',
        },
        phone: {
            type: String,
            required: [true, 'Please add a phone number'],
            unique: true,
            match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
        },
        otp: {
            type: String,
            match: [/^[0-9]{6}$/, 'OTP must be exactly 6 digits'],
        },
        dob: {
            type: Date,
        },
        street: { type: String },
        area: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: {
            type: String,
            match: [/^[0-9]{6}$/, 'Pincode must be exactly 6 digits']
        },
    },
    { timestamps: true }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
