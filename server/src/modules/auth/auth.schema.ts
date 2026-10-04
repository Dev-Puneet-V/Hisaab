import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Valid email is required').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().email('Valid email is required').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
  .strict();

export type RefreshInput = z.infer<typeof refreshSchema>;
