import axios from 'axios';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const { combine, timestamp, printf, colorize } = winston.format;

// Standard student-friendly console format
const myFormat = printf(({ level, message, timestamp, stack, pkg }) => {
  return `${timestamp} [${level}] [${stack || 'backend'}] [${pkg || 'unknown'}]: ${message}`;
});

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    colorize(),
    myFormat
  ),
  transports: [
    new winston.transports.Console()
  ],
});

/**
 * Reusable logging function as per requirements
 * @param stack 'backend' | 'frontend'
 * @param level 'debug' | 'info' | 'warn' | 'error' | 'fatal'
 * @param pkg package name (e.g., 'controller', 'db')
 * @param message log message
 */
export const log = async (
  stack: 'backend' | 'frontend',
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  pkg: string,
  message: string
) => {
  // 1. Log to console via Winston
  winstonLogger.log(level === 'fatal' ? 'error' : level, message, { stack, pkg });

  // 2. Log to external evaluation service (Async, don't block)
  const evalUrl = process.env.EVALUATION_SERVICE_URL;
  if (evalUrl) {
    axios.post(evalUrl, {
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
