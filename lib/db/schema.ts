import { relations } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  uuid,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// Users table (customers)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  avatar: text('avatar'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  displayNameIdx: index('users_display_name_idx').on(table.displayName),
}));

// Creators table
export const creators = pgTable('creators', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  isVerified: boolean('is_verified').default(false),
  isSponsored: boolean('is_sponsored').default(false),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('15.00'),
  withdrawalPermission: boolean('withdrawal_permission').default(true),
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0.00'),
  availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).default('0.00'),
  payoutMethod: jsonb('payout_method').$type<{
    type: 'bank';
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    accountHolderName: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('creators_email_idx').on(table.email),
  displayNameIdx: index('creators_display_name_idx').on(table.displayName),
  sponsoredIdx: index('creators_sponsored_idx').on(table.isSponsored),
}));

// Admin table
export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Shoutout types table
export const shoutoutTypes = pgTable('shoutout_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Creator shoutouts table
export const creatorShoutouts = pgTable('creator_shoutouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id, { onDelete: 'cascade' }),
  shoutoutTypeId: uuid('shoutout_type_id').notNull().references(() => shoutoutTypes.id),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  deliveryTime: integer('delivery_time').notNull(), // in hours
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  creatorIdx: index('creator_shoutouts_creator_idx').on(table.creatorId),
  typeIdx: index('creator_shoutouts_type_idx').on(table.shoutoutTypeId),
}));

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  shoutoutId: uuid('shoutout_id').notNull().references(() => creatorShoutouts.id),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  instructions: text('instructions'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(),
  creatorEarnings: decimal('creator_earnings', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, rejected, completed, cancelled
  paymentStatus: varchar('payment_status', { length: 20 }).notNull().default('pending'), // pending, paid, failed, refunded
  paymentId: varchar('payment_id', { length: 100 }),
  deliveryFile: text('delivery_file'),
  creatorMessage: text('creator_message'),
  userResponse: text('user_response'),
  acceptedAt: timestamp('accepted_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('orders_user_idx').on(table.userId),
  creatorIdx: index('orders_creator_idx').on(table.creatorId),
  statusIdx: index('orders_status_idx').on(table.status),
  orderNumberIdx: index('orders_number_idx').on(table.orderNumber),
}));

// Withdrawals table
export const withdrawals = pgTable('withdrawals', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: uuid('creator_id').notNull().references(() => creators.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processing, completed, rejected
  payoutMethod: jsonb('payout_method').notNull(),
  adminNotes: text('admin_notes'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  creatorIdx: index('withdrawals_creator_idx').on(table.creatorId),
  statusIdx: index('withdrawals_status_idx').on(table.status),
}));

// Activity logs table
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userType: varchar('user_type', { length: 20 }).notNull(), // user, creator, admin
  userId: uuid('user_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userTypeIdx: index('activity_logs_user_type_idx').on(table.userType),
  userIdx: index('activity_logs_user_idx').on(table.userId),
  createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
}));

// Site settings table
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  type: varchar('type', { length: 20 }).notNull().default('string'), // string, number, boolean, json
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const creatorsRelations = relations(creators, ({ many }) => ({
  shoutouts: many(creatorShoutouts),
  orders: many(orders),
  withdrawals: many(withdrawals),
}));

export const shoutoutTypesRelations = relations(shoutoutTypes, ({ many }) => ({
  creatorShoutouts: many(creatorShoutouts),
}));

export const creatorShoutoutsRelations = relations(creatorShoutouts, ({ one, many }) => ({
  creator: one(creators, {
    fields: [creatorShoutouts.creatorId],
    references: [creators.id],
  }),
  shoutoutType: one(shoutoutTypes, {
    fields: [creatorShoutouts.shoutoutTypeId],
    references: [shoutoutTypes.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  creator: one(creators, {
    fields: [orders.creatorId],
    references: [creators.id],
  }),
  shoutout: one(creatorShoutouts, {
    fields: [orders.shoutoutId],
    references: [creatorShoutouts.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  creator: one(creators, {
    fields: [withdrawals.creatorId],
    references: [creators.id],
  }),
}));