import { z } from 'zod'

// POST /auth/register
export const registerRules = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

// POST /auth/login
export const loginRules = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /auth/forgot-password
export const forgotPasswordRules = z.object({
  email: z.string().email(),
})

// PUT /auth/reset-password
export const resetPasswordRules = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

// PUT /auth/verify-account
export const verifyAccountRules = z.object({
  token: z.string().min(1),
})

// POST /auth/resend-verification
export const resendVerificationRules = z.object({
  email: z.string().email(),
})
