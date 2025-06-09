import { NextRequest, NextResponse } from 'next/server';
import { db, users, orders } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { adminUserUpdateSchema } from '@/lib/validation/schemas';
import { eq, ilike, desc, count, sum } from 'drizzle-orm';

// Get all users with search and pagination
async function GET(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    if (search) {
      whereConditions.push(
        ilike(users.displayName, `%${search}%`)
      );
    }

    // Get users
    const userList = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        email: users.email,
        country: users.country,
        avatar: users.avatar,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get order counts for each user
    const userIds = userList.map(u => u.id);
    const orderCounts = await db
      .select({
        userId: orders.userId,
        orderCount: count(),
        totalSpent: sum(orders.price),
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'))
      .groupBy(orders.userId);

    // Combine user data with order stats
    const usersWithStats = userList.map(user => {
      const stats = orderCounts.find(oc => oc.userId === user.id);
      return {
        ...user,
        orderCount: stats?.orderCount || 0,
        totalSpent: parseFloat(stats?.totalSpent || '0'),
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithStats,
      pagination: {
        page,
        limit,
        hasNext: userList.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET };