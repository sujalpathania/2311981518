"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.winstonLogger = void 0;
const axios_1 = __importDefault(require("axios"));
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { combine, timestamp, printf, colorize } = winston_1.default.format;
// Standard student-friendly console format
const myFormat = printf(({ level, message, timestamp, stack, pkg }) => {
    return `${timestamp} [${level}] [${stack || 'backend'}] [${pkg || 'unknown'}]: ${message}`;
});
exports.winstonLogger = winston_1.default.createLogger({
    level: 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), colorize(), myFormat),
    transports: [
        new winston_1.default.transports.Console()
    ],
});
/**
 * Reusable logging function as per requirements
 * @param stack 'backend' | 'frontend'
 * @param level 'debug' | 'info' | 'warn' | 'error' | 'fatal'
 * @param pkg package name (e.g., 'controller', 'db')
 * @param message log message
 */
const log = async (stack, level, pkg, message) => {
    // 1. Log to console via Winston
    exports.winstonLogger.log(level === 'fatal' ? 'error' : level, message, { stack, pkg });
    // 2. Log to external evaluation service (Async, don't block)
    const evalUrl = process.env.EVALUATION_SERVICE_URL;
    if (evalUrl) {
        axios_1.default.post(evalUrl, {
            stack,
            level,
            package: pkg,
            message,
            timestamp: new Date().toISOString()
        }).catch(err => {
            // Silent fail to avoid terminal clutter when external service is down
        });
    }
};
exports.log = log;
