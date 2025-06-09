import { NextRequest, NextResponse } from 'next/server';
import { db, creators, orders, creatorShoutouts, withdrawals } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { adminCreatorUpdateSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, desc, count, sum } from 'drizzle-orm';

// Get single creator details
async function GET(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id;

    // Get creator details
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get creator's statistics
    const [orderStats] = await db
      .select({
        totalOrders: count(),
        totalRevenue: sum(orders.price),
        completedOrders: count(),
      })
      .from(orders)
      .where(eq(orders.creatorId, creatorId));

    const [shoutoutCount] = await db
      .select({ count: count() })
      .from(creatorShoutouts)
      .where(eq(creatorShoutouts.creatorId, creatorId));

    const [withdrawalStats] = await db
      .select({
        totalWithdrawals: count(),
        totalWithdrawn: sum(withdrawals.amount),
      })
      .from(withdrawals)
      .where(eq(withdrawals.creatorId, creatorId));

    // Get recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        price: orders.price,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
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
      creator: {
        ...creator,
        stats: {
          totalOrders: orderStats.totalOrders,
          totalRevenue: parseFloat(orderStats.totalRevenue || '0'),
          completedOrders: orderStats.completedOrders,
          shoutoutCount: shoutoutCount.count,
          totalWithdrawals: withdrawalStats.totalWithdrawals,
          totalWithdrawn: parseFloat(withdrawalStats.totalWithdrawn || '0'),
        },
        recentOrders,
        recentWithdrawals,
      },
    });

  } catch (error: any) {
    console.error('Get creator details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator details' },
      { status: 500 }
    );
  }
}

// Update creator
async function PUT(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id;
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const adminId = request.user!.id;

    // Validate input
    const validatedData = adminCreatorUpdateSchema.parse(body);

    // Check if creator exists
    const [existingCreator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!existingCreator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Update creator
    const [updatedCreator] = await db
      .update(creators)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId))
      .returning();

    // Log activity
    await ActivityLogger.adminAction(
      adminId,
      'CREATOR_UPDATED',
      `Updated creator: ${updatedCreator.email}`,
      { 
        ipAddress, 
        userAgent,
        creatorId,
        changes: validatedData,
      }
    );

    return NextResponse.json({
      success: true,
      creator: updatedCreator,
      message: 'Creator updated successfully',
    });

  } catch (error: any) {
    console.error('Update creator error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update creator' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET, withAuth(PUT, ['admin']) as PUT };