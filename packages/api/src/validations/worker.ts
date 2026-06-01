import { z } from 'zod'

// POST /workers
export const createWorkerRules = z
  .object({
    name: z.string().min(1),
    categoryId: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    bio: z.string().optional(),
    walletAddress: z.string().optional(),
  })
  .refine((d) => d.phone || d.email, {
    message: 'Either phone or email is required',
    path: ['phone'],
  })

// PUT /workers/:id — all fields optional
export const updateWorkerRules = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  bio: z.string().optional(),
  walletAddress: z.string().optional(),
})

// POST /workers/:id/reviews
export const createReviewRules = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

// POST /workers/:id/contact
export const contactRequestRules = z.object({
  message: z.string().min(10),
})
