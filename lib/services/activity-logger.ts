import { db, activityLogs } from '@/lib/db';
import { eq, lt, count } from 'drizzle-orm';

export interface ActivityLogData {
  userType: 'user' | 'creator' | 'admin';
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export async function logActivity(data: ActivityLogData) {
  try {
    await db.insert(activityLogs).values({
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export async function cleanupOldLogs() {
  try {
    // Keep only last 30 days or 10,000 entries, whichever is more recent
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count total logs
    const [totalCount] = await db
      .select({ count: count() })
      .from(activityLogs);

    if (totalCount.count > 10000) {
      // Delete oldest entries beyond 10,000
      const offset = totalCount.count - 10000;
      await db.execute(`
        DELETE FROM activity_logs 
        WHERE id IN (
          SELECT id FROM activity_logs 
          ORDER BY created_at ASC 
          LIMIT ${offset}
        )
      `);
    }

    // Also delete entries older than 30 days if they exceed the limit
    await db
      .delete(activityLogs)
      .where(lt(activityLogs.createdAt, thirtyDaysAgo));

  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
  }
}

// Helper functions for common activities
export const ActivityLogger = {
  userRegistration: (userId: string, email: string, ipAddress?: string, userAgent?: string) =>
    logActivity({
      userType: 'user',
      userId,
      action: 'REGISTRATION',
      description: `User registered with email: ${email}`,
      ipAddress,
      userAgent,
    }),

  userLogin: (userId: string, email: string, ipAddress?: string, userAgent?: string) =>
    logActivity({
      userType: 'user',
      userId,
      action: 'LOGIN',
      description: `User logged in: ${email}`,
      ipAddress,
      userAgent,
    }),

  creatorRegistration: (creatorId: string, email: string, ipAddress?: string, userAgent?: string) =>
    logActivity({
      userType: 'creator',
      userId: creatorId,
      action: 'REGISTRATION',
      description: `Creator registered with email: ${email}`,
      ipAddress,
      userAgent,
    }),

  creatorLogin: (creatorId: string, email: string, ipAddress?: string, userAgent?: string) =>
    logActivity({
      userType: 'creator',
      userId: creatorId,
      action: 'LOGIN',
      description: `Creator logged in: ${email}`,
      ipAddress,
      userAgent,
    }),

  orderCreated: (userId: string, orderId: string, amount: number) =>
    logActivity({
      userType: 'user',
      userId,
      action: 'ORDER_CREATED',
      description: `Order created: ${orderId} for $${amount}`,
      metadata: { orderId, amount },
    }),

  orderAccepted: (creatorId: string, orderId: string) =>
    logActivity({
      userType: 'creator',
      userId: creatorId,
      action: 'ORDER_ACCEPTED',
      description: `Order accepted: ${orderId}`,
      metadata: { orderId },
    }),

  orderCompleted: (creatorId: string, orderId: string) =>
    logActivity({
      userType: 'creator',
      userId: creatorId,
      action: 'ORDER_COMPLETED',
      description: `Order completed: ${orderId}`,
      metadata: { orderId },
    }),

  withdrawalRequested: (creatorId: string, withdrawalId: string, amount: number) =>
    logActivity({
      userType: 'creator',
      userId: creatorId,
      action: 'WITHDRAWAL_REQUESTED',
      description: `Withdrawal requested: $${amount}`,
      metadata: { withdrawalId, amount },
    }),

  adminAction: (adminId: string, action: string, description: string, metadata?: any) =>
    logActivity({
      userType: 'admin',
      userId: adminId,
      action,
      description,
      metadata,
    }),
};