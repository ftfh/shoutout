import { NextRequest, NextResponse } from 'next/server';
import { db, orders, users, creators, creatorShoutouts } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { eq, desc, and, ilike, or } from 'drizzle-orm';

// Get all orders with search and pagination
async function GET(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(users.displayName, `%${search}%`),
          ilike(creators.displayName, `%${search}%`)
        )!
      );
    }

    if (status) {
      whereConditions.push(eq(orders.status, status));
    }

    // Get orders with user and creator details
    const orderList = await db
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
          paymentId: orders.paymentId,
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
          email: users.email,
          avatar: users.avatar,
        },
        creator: {
          id: creators.id,
          displayName: creators.displayName,
          email: creators.email,
          avatar: creators.avatar,
        },
        shoutout: {
          id: creatorShoutouts.id,
          title: creatorShoutouts.title,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(creators, eq(orders.creatorId, creators.id))
      .innerJoin(creatorShoutouts, eq(orders.shoutoutId, creatorShoutouts.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      orders: orderList,
      pagination: {
        page,
        limit,
        hasNext: orderList.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET };