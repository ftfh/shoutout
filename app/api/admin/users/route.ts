import { NextRequest, NextResponse } from 'next/server';
import { db, users, orders } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { adminUserUpdateSchema } from '@/lib/validation/schemas';
import { eq, ilike, desc, count, sum, and, inArray } from 'drizzle-orm';

// Get all users with search and pagination
async function getUsers(request: AuthenticatedRequest) {
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
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get order counts for each user more efficiently
    const userIds = userList.map((u: any) => u.id); // Added :any for now
    let orderStats: { userId: string; orderCount: number; totalSpent: string | null }[] = [];

    if (userIds.length > 0) {
      orderStats = await db
        .select({
          userId: orders.userId,
          orderCount: count(orders.id).as('orderCount'),
          totalSpent: sum(orders.price).as('totalSpent'),
        })
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, 'paid'),
            inArray(orders.userId, userIds)
          )
        )
        .groupBy(orders.userId);
    }

    // Combine user data with order stats
    const usersWithStats = userList.map((user: any) => { // Added :any for now
      const stats = orderStats.find((oc: any) => oc.userId === user.id); // Added :any for now
      return {
        ...user,
        orderCount: stats ? Number(stats.orderCount) : 0,
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

export const GET = withAuth(getUsers, ['admin']);