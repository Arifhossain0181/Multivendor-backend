import { prisma } from '../../prisma/client';
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import bcrypt from 'bcryptjs';

type Role = "USER" | "ADMIN" | "SELLER";

type TokenPayload = {
  userId: string;
  email: string;
  role: Role;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// secret keys and dummy hash for timing attack protection
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";

// Timing Attack 
const DUMMY_HASH = '$2b$10$nOUIs5kJ7naTuTFkPy1Ve.7ODq6D5bGF8gYmS.uWb2O2bH2hS1z6m';


// HELPERS


const createHttpError = (statusCode: number, message: string) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

// token sign
const signToken = (payload: TokenPayload, secret: string, expiresIn: StringValue | number): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

// token object 
const getSanitizedUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role as Role
});

// final authentication payload builder
export const buildAuthPayload = (user: any) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as Role,
  };

  return {
    accessToken: signToken(payload, JWT_ACCESS_SECRET, (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as StringValue),
    refreshToken: signToken(payload, JWT_REFRESH_SECRET, (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue),
    user: getSanitizedUser(user)
  };
};

// SERVICE FUNCTIONS

export const login = async (email: string, password: string) => {
  if (!email?.trim() || !password) {
    throw createHttpError(400, "Email and password are required");
  }
  // find user by user from the data base and also trim and lowercase the email for consistency
  const user = await prisma.user.findUnique({ 
    where: { email: email.trim().toLowerCase() } 
  });

  // Timing Attack Protection: If user is not found, we still perform a bcrypt compare with a dummy hash to ensure consistent response time, preventing attackers from inferring valid emails based on timing differences.
  const passwordToCompare = user ? user.password : DUMMY_HASH;
  const isMatch = await bcrypt.compare(password, passwordToCompare);

  if (!user || !isMatch) {
    throw createHttpError(401, "Invalid email or password");
  }

  return buildAuthPayload(user);
};

export const register = async (name: string, email: string, password: string) => {
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    throw createHttpError(400, "Name, valid email and password (min 6 chars) are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    throw createHttpError(400, "Invalid email format");
  }

  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    throw createHttpError(409, "Email already in use");
  }

  // Fixed: Using bcrypt instead of brotliCompress
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "USER"
    }
  });

  return buildAuthPayload(user);
};

export const refreshToken = async (token: string) => {
  if (!token) throw createHttpError(400, "Refresh token is required");
  
  try {
    // Verify the refresh token using the correct secret and extract the payload
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw createHttpError(401, "Invalid refresh token");

    const newPayload: TokenPayload = { userId: user.id, email: user.email, role: user.role as Role };

    return {
      accessToken: signToken(newPayload, JWT_ACCESS_SECRET, (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as StringValue),
      user: getSanitizedUser(user)
    };
  } catch (error) {
    throw createHttpError(401, "Invalid or expired refresh token");
  }
};

export const getme = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw createHttpError(404, 'User not found');
  return user;
};

export const updateMe = async (userId: string, input: { name?: string; email?: string }) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!currentUser) throw createHttpError(404, 'User not found');

  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!name && !email) throw createHttpError(400, 'Name or email is required');
  if (name && name.length < 3) throw createHttpError(400, 'Name must be at least 3 characters long');
  if (email && !emailRegex.test(email)) throw createHttpError(400, 'Valid email is required');

  if (currentUser.role === 'ADMIN' && email && email !== currentUser.email) {
    throw createHttpError(403, 'Admin can only change name');
  }

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) throw createHttpError(409, 'Email already in use');
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
    },
    select: { id: true, name: true, email: true, role: true },
  });
};
