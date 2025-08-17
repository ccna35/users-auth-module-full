import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});
