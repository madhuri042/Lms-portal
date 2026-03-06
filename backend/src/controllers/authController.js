const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            role,
            phone,
            otp,
            dob,
            street,
            area,
            city,
            state,
            pincode
        } = req.body;

        const userExists = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (userExists) {
            const field = userExists.email === email ? 'Email' : 'Phone number';
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'student',
            phone,
            otp,
            dob,
            street,
            area,
            city,
            state,
            pincode,
        });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                state: user.state,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.status(200).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                phone: user.phone,
                city: user.city,
                state: user.state,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update current user profile (name, email)
// @route   PUT /api/auth/me
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;
        const fields = {};
        if (firstName !== undefined) fields.firstName = firstName;
        if (lastName !== undefined) fields.lastName = lastName;
        if (email !== undefined) {
            const trimmed = String(email).trim().toLowerCase();
            if (!trimmed) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }
            const emailExists = await User.findOne({ email: trimmed, _id: { $ne: req.user.id } });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email already in use by another account' });
            }
            fields.email = trimmed;
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            fields,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update current user password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current password and new password',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

