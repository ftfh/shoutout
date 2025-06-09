import { z } from 'zod';

// User registration schema
export const userRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  displayName: z.string()
    .min(3, 'Display name must be at least 3 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Display name can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 13;
  }, 'You must be at least 13 years old'),
  country: z.string().min(1, 'Country is required'),
  turnstileToken: z.string().min(1, 'Turnstile verification required'),
});

// Creator registration schema (same as user)
export const creatorRegistrationSchema = userRegistrationSchema;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  turnstileToken: z.string().min(1, 'Turnstile verification required'),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// User profile update schema
export const userProfileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  displayName: z.string()
    .min(3, 'Display name must be at least 3 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Display name can only contain letters, numbers, and underscores')
    .optional(),
  country: z.string().min(1, 'Country is required').optional(),
});

// User password change schema
export const userPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Profile update schema (generic)
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string()
    .min(3).max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  country: z.string().min(1).optional(),
  bio: z.string().max(1000).optional(),
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
});

// Shoutout creation schema
export const shoutoutSchema = z.object({
  shoutoutTypeId: z.string().uuid('Invalid shoutout type'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(1000),
  price: z.number().min(1, 'Price must be at least $1').max(10000, 'Price cannot exceed $10,000'),
  deliveryTime: z.number().min(1, 'Delivery time must be at least 1 hour').max(720, 'Delivery time cannot exceed 30 days'),
});

// Order creation schema
export const orderSchema = z.object({
  shoutoutId: z.string().uuid('Invalid shoutout ID'),
  instructions: z.string().max(1000, 'Instructions cannot exceed 1000 characters').optional(),
});

// Withdrawal request schema
export const withdrawalSchema = z.object({
  amount: z.number().min(10, 'Minimum withdrawal amount is $10'),
  payoutMethod: z.object({
    type: z.literal('bank'),
    bankName: z.string().min(1, 'Bank name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    routingNumber: z.string().optional(),
    accountHolderName: z.string().min(1, 'Account holder name is required'),
  }),
});

// Search and filter schemas
export const creatorSearchSchema = z.object({
  query: z.string().optional(),
  shoutoutType: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  maxDeliveryTime: z.number().min(1).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'delivery_time', 'newest', 'rating']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

// Admin schemas
export const adminUserUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isVerified: z.boolean().optional(),
});

export const adminCreatorUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  isVerified: z.boolean().optional(),
  isSponsored: z.boolean().optional(),
  commissionRate: z.number().min(0).max(50).optional(),
  withdrawalPermission: z.boolean().optional(),
});

export const siteSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  description: z.string().optional(),
});