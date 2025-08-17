import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(40).max(300), // opaque token
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  token: z.string().min(40).max(300),
  password: z.string().min(8).max(128),
});
