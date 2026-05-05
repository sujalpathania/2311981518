"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = require("../utils/logger");
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};
/**
 * @desc    Register user
 * @route   POST /api/auth/register
 */
exports.registerUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User_1.default.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }
    const user = await User_1.default.create({ name, email, password }); // Note: real app should bcrypt
    if (user) {
        (0, logger_1.log)('backend', 'info', 'controller', `User registered: ${email}`);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(String(user._id)),
        });
    }
    else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
exports.loginUser = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const user = await User_1.default.findOne({ email });
    if (user && user.password === password) { // Note: real app should bcrypt.compare
        (0, logger_1.log)('backend', 'info', 'controller', `User logged in: ${email}`);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(String(user._id)),
        });
    }
    else {
        (0, logger_1.log)('backend', 'warn', 'controller', `Failed login attempt for: ${email}`);
        res.status(401);
        throw new Error('Invalid email or password');
    }
});
