"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = void 0;
const logger_1 = require("../utils/logger");
const loggingMiddleware = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    // Log: Request Start
    (0, logger_1.log)('backend', 'info', 'middleware', `Incoming ${method} ${originalUrl}`);
    // Hook into response finish to log Success/Error
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        if (statusCode >= 400) {
            (0, logger_1.log)('backend', 'error', 'middleware', `${method} ${originalUrl} failed with ${statusCode} (${duration}ms)`);
        }
        else {
            (0, logger_1.log)('backend', 'info', 'middleware', `${method} ${originalUrl} success ${statusCode} (${duration}ms)`);
        }
    });
    next();
};
exports.loggingMiddleware = loggingMiddleware;
