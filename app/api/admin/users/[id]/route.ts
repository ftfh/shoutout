import { NextRequest, NextResponse } from 'next/server';
import { db, users, orders } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { adminUserUpdateSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, desc, count, sum } from 'drizzle-orm';

// Get single user details
async function GET(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's order statistics
    const [orderStats] = await db
      .select({
        totalOrders: count(),
        totalSpent: sum(orders.price),
        completedOrders: count(),
      })
      .from(orders)
      .where(eq(orders.userId, userId));

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
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(10);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        stats: {
          totalOrders: orderStats.totalOrders,
          totalSpent: parseFloat(orderStats.totalSpent || '0'),
          completedOrders: orderStats.completedOrders,
        },
        recentOrders,
      },
    });

  } catch (error: any) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}

// Update user
async function PUT(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const adminId = request.user!.id;

    // Validate input
    const validatedData = adminUserUpdateSchema.parse(body);

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Log activity
    await ActivityLogger.adminAction(
      adminId,
      'USER_UPDATED',
      `Updated user: ${updatedUser.email}`,
      { 
        ipAddress, 
        userAgent,
        userId,
        changes: validatedData,
      }
    );

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    });

  } catch (error: any) {
    console.error('Update user error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET, withAuth(PUT, ['admin']) as PUT };