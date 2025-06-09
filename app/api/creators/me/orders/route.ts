import { NextRequest, NextResponse } from 'next/server';
import { db, orders, users, creatorShoutouts, shoutoutTypes } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { eq, desc, and } from 'drizzle-orm';

// Get creator's orders
async function GET(request: AuthenticatedRequest) {
  try {
    const creatorId = request.user!.id;
    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(orders.creatorId, creatorId)];
    
    if (status) {
      whereConditions.push(eq(orders.status, status));
    }

    // Get creator's orders with user and shoutout details
    const creatorOrders = await db
      .select({
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          instructions: orders.instructions,
          price: orders.price,
          commissionAmount: orders.commissionAmount,
          creatorEarnings: orders.creatorEarnings,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          deliveryFile: orders.deliveryFile,
          creatorMessage: orders.creatorMessage,
          userResponse: orders.userResponse,
          acceptedAt: orders.acceptedAt,
          completedAt: orders.completedAt,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        },
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          isVerified: users.isVerified,
        },
        shoutout: {
          id: creatorShoutouts.id,
          title: creatorShoutouts.title,
          deliveryTime: creatorShoutouts.deliveryTime,
        },
        shoutoutType: {
          id: shoutoutTypes.id,
          name: shoutoutTypes.name,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(creatorShoutouts, eq(orders.shoutoutId, creatorShoutouts.id))
      .innerJoin(shoutoutTypes, eq(creatorShoutouts.shoutoutTypeId, shoutoutTypes.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      orders: creatorOrders,
      pagination: {
        page,
        limit,
        hasNext: creatorOrders.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get creator orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['creator']) as GET };