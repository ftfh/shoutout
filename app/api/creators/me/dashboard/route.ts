import { NextRequest, NextResponse } from 'next/server';
import { db, orders, creatorShoutouts, withdrawals } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { eq, count, sum, desc, and, gte } from 'drizzle-orm';

// Get creator dashboard stats
async function GET(request: AuthenticatedRequest) {
  try {
    const creatorId = request.user!.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const periodDate = new Date();
    periodDate.setDate(periodDate.getDate() - parseInt(period));

    // Get total stats
    const [totalOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.creatorId, creatorId));

    const [completedOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.creatorId, creatorId),
          eq(orders.status, 'completed')
        )
      );

    const [pendingOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.creatorId, creatorId),
          eq(orders.status, 'pending'),
          eq(orders.paymentStatus, 'paid')
        )
      );

    const [activeShoutoutsResult] = await db
      .select({ count: count() })
      .from(creatorShoutouts)
      .where(
        and(
          eq(creatorShoutouts.creatorId, creatorId),
          eq(creatorShoutouts.isActive, true)
        )
      );

    // Get period stats
    const [periodOrdersResult] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.creatorId, creatorId),
          gte(orders.createdAt, periodDate)
        )
      );

    const [periodEarningsResult] = await db
      .select({ 
        total: sum(orders.creatorEarnings)
      })
      .from(orders)
      .where(
        and(
          eq(orders.creatorId, creatorId),
          eq(orders.status, 'completed'),
          gte(orders.completedAt, periodDate)
        )
      );

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        price: orders.price,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        acceptedAt: orders.acceptedAt,
        completedAt: orders.completedAt,
        shoutout: {
          title: creatorShoutouts.title,
        },
      })
      .from(orders)
      .innerJoin(creatorShoutouts, eq(orders.shoutoutId, creatorShoutouts.id))
      .where(eq(orders.creatorId, creatorId))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Get recent withdrawals
    const recentWithdrawals = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        createdAt: withdrawals.createdAt,
        processedAt: withdrawals.processedAt,
      })
      .from(withdrawals)
      .where(eq(withdrawals.creatorId, creatorId))
      .orderBy(desc(withdrawals.createdAt))
      .limit(5);

    return NextResponse.json({
      success: true,
      dashboard: {
        stats: {
          totalOrders: totalOrdersResult.count,
          completedOrders: completedOrdersResult.count,
          pendingOrders: pendingOrdersResult.count,
          activeShoutouts: activeShoutoutsResult.count,
          periodOrders: periodOrdersResult.count,
          periodEarnings: parseFloat(periodEarningsResult.total || '0'),
        },
        recentOrders,
        recentWithdrawals,
      },
    });

  } catch (error: any) {
    console.error('Get creator dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['creator']) as GET };