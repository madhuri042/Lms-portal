const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            console.log(`[AUTH DEBUG] Verifying token: ${token.substring(0, 10)}...`);
            console.log(`[AUTH DEBUG] Secret Prefix: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 4) : 'MISSING'}`);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({
                    success: false,
                    message: 'Database is currently disconnected. Please check the server logs and IP whitelist.'
                });
            }

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ 
                success: false, 
                message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Not authorized, token failed' 
            });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Grant access to specific roles
exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
