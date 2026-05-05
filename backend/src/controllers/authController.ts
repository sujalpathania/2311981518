import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { log } from '../utils/logger';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({ name, email, password }); // Note: real app should bcrypt

  if (user) {
    const token = generateToken(String(user._id));
    log('backend', 'info', 'controller', `User registered: ${email} - Token Start: ${token.substring(0, 10)}...`);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && user.password === password) { // Note: real app should bcrypt.compare
    const token = generateToken(String(user._id));
    log('backend', 'info', 'controller', `User logged in: ${email} - Token Start: ${token.substring(0, 10)}...`);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    log('backend', 'warn', 'controller', `Failed login attempt for: ${email}`);
    res.status(401);
    throw new Error('Invalid email or password');
  }
});
