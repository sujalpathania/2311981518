import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User';
import { log } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        log('backend', 'warn', 'auth', 'User not found for token');
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      log('backend', 'error', 'auth', `Token verification failed: ${error}`);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    log('backend', 'warn', 'auth', 'No token provided');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});
