import { NextRequest, NextResponse } from 'next/server';
import { db, creators, orders } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { eq, ilike, desc, count, sum } from 'drizzle-orm';

// Get all creators with search and pagination
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
        ilike(creators.displayName, `%${search}%`)
      );
    }

    // Get creators
    const creatorList = await db
      .select({
        id: creators.id,
        firstName: creators.firstName,
        lastName: creators.lastName,
        displayName: creators.displayName,
        email: creators.email,
        country: creators.country,
        avatar: creators.avatar,
        isVerified: creators.isVerified,
        isSponsored: creators.isSponsored,
        commissionRate: creators.commissionRate,
        withdrawalPermission: creators.withdrawalPermission,
        totalEarnings: creators.totalEarnings,
        availableBalance: creators.availableBalance,
        createdAt: creators.createdAt,
        updatedAt: creators.updatedAt,
      })
      .from(creators)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(creators.createdAt))
      .limit(limit)
      .offset(offset);

    // Get order counts for each creator
    const creatorIds = creatorList.map(c => c.id);
    const orderCounts = await db
      .select({
        creatorId: orders.creatorId,
        orderCount: count(),
        totalRevenue: sum(orders.price),
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'paid'))
      .groupBy(orders.creatorId);

    // Combine creator data with order stats
    const creatorsWithStats = creatorList.map(creator => {
      const stats = orderCounts.find(oc => oc.creatorId === creator.id);
      return {
        ...creator,
        orderCount: stats?.orderCount || 0,
        totalRevenue: parseFloat(stats?.totalRevenue || '0'),
      };
    });

    return NextResponse.json({
      success: true,
      creators: creatorsWithStats,
      pagination: {
        page,
        limit,
        hasNext: creatorList.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get creators error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET };