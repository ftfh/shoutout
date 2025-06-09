import { NextRequest, NextResponse } from 'next/server';
import { db, withdrawals, creators } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { withdrawalSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { eq, desc } from 'drizzle-orm';

// Get creator's withdrawals
async function GET(request: AuthenticatedRequest) {
  try {
    const creatorId = request.user!.id;
    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = (page - 1) * limit;

    // Get creator's withdrawals
    const creatorWithdrawals = await db
      .select({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        payoutMethod: withdrawals.payoutMethod,
        adminNotes: withdrawals.adminNotes,
        processedAt: withdrawals.processedAt,
        createdAt: withdrawals.createdAt,
      })
      .from(withdrawals)
      .where(eq(withdrawals.creatorId, creatorId))
      .orderBy(desc(withdrawals.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      withdrawals: creatorWithdrawals,
      pagination: {
        page,
        limit,
        hasNext: creatorWithdrawals.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get creator withdrawals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// Request withdrawal
async function POST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const creatorId = request.user!.id;

    // Validate input
    const validatedData = withdrawalSchema.parse(body);

    // Get creator's current balance
    const [creator] = await db
      .select({
        availableBalance: creators.availableBalance,
        withdrawalPermission: creators.withdrawalPermission,
      })
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (!creator.withdrawalPermission) {
      return NextResponse.json(
        { error: 'Withdrawal permission is disabled' },
        { status: 403 }
      );
    }

    const availableBalance = parseFloat(creator.availableBalance || '0');
    if (validatedData.amount > availableBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const [newWithdrawal] = await db
      .insert(withdrawals)
      .values({
        creatorId,
        amount: validatedData.amount.toString(),
        status: 'pending',
        payoutMethod: validatedData.payoutMethod,
      })
      .returning({
        id: withdrawals.id,
        amount: withdrawals.amount,
        status: withdrawals.status,
        payoutMethod: withdrawals.payoutMethod,
        createdAt: withdrawals.createdAt,
      });

    // Update creator's available balance
    await db
      .update(creators)
      .set({
        availableBalance: (availableBalance - validatedData.amount).toString(),
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));

    // Log activity
    await ActivityLogger.withdrawalRequested(
      creatorId,
      newWithdrawal.id,
      validatedData.amount
    );

    return NextResponse.json({
      success: true,
      withdrawal: newWithdrawal,
      message: 'Withdrawal request submitted successfully',
    });

  } catch (error: any) {
    console.error('Request withdrawal error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to request withdrawal' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['creator']) as GET, withAuth(POST, ['creator']) as POST };