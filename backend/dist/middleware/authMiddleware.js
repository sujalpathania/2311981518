"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = require("../utils/logger");
exports.protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = await User_1.default.findById(decoded.id).select('-password');
            if (!req.user) {
                (0, logger_1.log)('backend', 'warn', 'auth', 'User not found for token');
                res.status(401);
                throw new Error('Not authorized, user not found');
            }
            next();
        }
        catch (error) {
            (0, logger_1.log)('backend', 'error', 'auth', `Token verification failed: ${error}`);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }
    if (!token) {
        (0, logger_1.log)('backend', 'warn', 'auth', 'No token provided');
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});
