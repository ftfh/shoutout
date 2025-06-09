import { NextRequest, NextResponse } from 'next/server';
import { db, activityLogs } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { eq, desc, ilike, and, gte } from 'drizzle-orm';

// Get activity logs with search and pagination
async function GET(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
    const search = searchParams.get('search');
    const userType = searchParams.get('userType');
    const action = searchParams.get('action');
    const days = Number(searchParams.get('days')) || 30;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    // Date filter
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - days);
    whereConditions.push(gte(activityLogs.createdAt, dateFilter));

    if (search) {
      whereConditions.push(
        ilike(activityLogs.description, `%${search}%`)
      );
    }

    if (userType) {
      whereConditions.push(eq(activityLogs.userType, userType));
    }

    if (action) {
      whereConditions.push(ilike(activityLogs.action, `%${action}%`));
    }

    // Get activity logs
    const logs = await db
      .select({
        id: activityLogs.id,
        userType: activityLogs.userType,
        userId: activityLogs.userId,
        action: activityLogs.action,
        description: activityLogs.description,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(and(...whereConditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        hasNext: logs.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['admin']) as GET };