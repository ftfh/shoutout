import { NextRequest, NextResponse } from 'next/server';
import { db, withdrawals, creators } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, sql } from 'drizzle-orm';

// Update withdrawal status
async function PUT(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const withdrawalId = params.id;
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const adminId = request.user!.id;
    const { action, adminNotes } = body;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get withdrawal details
    const [withdrawal] = await db
      .select({
        withdrawal: withdrawals,
        creator: {
          id: creators.id,
          email: creators.email,
          availableBalance: creators.availableBalance,
        },
      })
      .from(withdrawals)
      .innerJoin(creators, eq(withdrawals.creatorId, creators.id))
      .where(eq(withdrawals.id, withdrawalId))
      .limit(1);

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    if (withdrawal.withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal is not in pending status' },
        { status: 400 }
      );
    }

    let updateData: any = {
      adminNotes,
      processedAt: new Date(),
      updatedAt: new Date(),
    };

    if (action === 'approve') {
      updateData.status = 'completed';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      
      // Return money to creator's available balance
      await db
        .update(creators)
        .set({
          availableBalance: sql`available_balance + ${withdrawal.withdrawal.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(creators.id, withdrawal.creator.id));
    }

    // Update withdrawal
    const [updatedWithdrawal] = await db
      .update(withdrawals)
      .set(updateData)
      .where(eq(withdrawals.id, withdrawalId))
      .returning();

    // Log activity
    await ActivityLogger.adminAction(
      adminId,
      action === 'approve' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
      `${action === 'approve' ? 'Approved' : 'Rejected'} withdrawal of $${withdrawal.withdrawal.amount} for creator: ${withdrawal.creator.email}`,
      { 
        ipAddress, 
        userAgent,
        withdrawalId,
        amount: withdrawal.withdrawal.amount,
        creatorId: withdrawal.creator.id,
        adminNotes,
      }
    );

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: `Withdrawal ${action}d successfully`,
    });

  } catch (error: any) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}

export { withAuth(PUT, ['admin']) as PUT };