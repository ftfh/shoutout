import { NextRequest, NextResponse } from 'next/server';
import { db, users, creators, orders, withdrawals, activityLogs } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { eq, count, sum, desc, gte, and } from 'drizzle-orm';

// Get admin dashboard stats
async function getDashboardStats(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Get total counts
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const [totalCreatorsResult] = await db
      .select({ count: count() })
      .from(creators);

    const [totalOrdersResult] = await db
      .select({ count: count() })
      .from(orders);

    const [completedOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'completed'));

    const [pendingWithdrawalsResult] = await db
      .select({ count: count() })
      .from(withdrawals)
      .where(eq(withdrawals.status, 'pending'));

    // Get period stats
    const [periodUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, periodDate));

    const [periodCreatorsResult] = await db
      .select({ count: count() })
      .from(creators)
      .where(gte(creators.createdAt, periodDate));

    const [periodOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(gte(orders.createdAt, periodDate));

    const [periodRevenueResult] = await db
      .select({ 
        total: sum(orders.commissionAmount)
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'completed'),
          gte(orders.completedAt, periodDate)
        )
      );

    // Get recent activities
    const recentActivities = await db
      .select({
        id: activityLogs.id,
        userType: activityLogs.userType,
        userId: activityLogs.userId,
        action: activityLogs.action,
        description: activityLogs.description,
        ipAddress: activityLogs.ipAddress,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(20);

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        price: orders.price,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        user: {
          displayName: users.displayName,
        },
        creator: {
          displayName: creators.displayName,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(creators, eq(orders.creatorId, creators.id))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers: totalUsersResult.count,
          totalCreators: totalCreatorsResult.count,
          totalOrders: totalOrdersResult.count,
          completedOrders: completedOrdersResult.count,
          pendingWithdrawals: pendingWithdrawalsResult.count,
          periodUsers: periodUsersResult.count,
          periodCreators: periodCreatorsResult.count,
          periodOrders: periodOrdersResult.count,
          periodRevenue: parseFloat(periodRevenueResult.total || '0'),
        },
        recentActivities,
        recentOrders,
      },
    });
    
  } catch (error: any) {
    console.error('Get admin dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getDashboardStats, ['admin']);