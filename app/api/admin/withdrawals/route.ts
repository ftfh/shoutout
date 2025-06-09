import { NextRequest, NextResponse } from 'next/server';
import { db, withdrawals, creators } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, desc, and, ilike } from 'drizzle-orm';

// Get all withdrawals with search and pagination
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
        ilike(creators.displayName, `%${search}%`)
      );
    }

    if (status) {
      whereConditions.push(eq(withdrawals.status, status));
    }

    // Get withdrawals with creator details
    const withdrawalList = await db
      .select({
        withdrawal: {
          id: withdrawals.id,
          amount: withdrawals.amount,
          status: withdrawals.status,
          payoutMethod: withdrawals.payoutMethod,
          adminNotes: withdrawals.adminNotes,
          processedAt: withdrawals.processedAt,
          createdAt: withdrawals.createdAt,
          updatedAt: withdrawals.updatedAt,
        },
        creator: {
          id: creators.id,
          displayName: creators.displayName,
          email: creators.email,
          avatar: creators.avatar,
          availableBalance: creators.availableBalance,
        },
      })
      .from(withdrawals)
      .innerJoin(creators, eq(withdrawals.creatorId, creators.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(withdrawals.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      withdrawals: withdrawalList,
      pagination: {
        page,
        limit,
        hasNext: withdrawalList.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET };