const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Middleware to protect routes and decode the user ID from the token
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('Token:', token);
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded:', decoded);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ message: 'Unauthorized' });
        }
    } else {
        console.error('No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
};


// Profile route
router.get('/profile', protect, async (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            data: { user: req.user }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Generate Token Function
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = await User.create({ email, password });

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: {
                user: {
                    id: newUser._id,
                    email: newUser.email
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if password is correct
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            status: 'success',
            message: 'Logged in successfully',
            token, // Include the token in the response
            data: {
                user: {
                    id: user._id,
                    email: user.email
                }
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
});

module.exports = router;