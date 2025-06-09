import { NextRequest, NextResponse } from 'next/server';
import { db, creators } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { passwordChangeSchema } from '@/lib/validation/schemas';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

// Change creator password
async function PUT(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const creatorId = request.user!.id;

    // Validate input
    const validatedData = passwordChangeSchema.parse(body);

    // Get current creator data
    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const passwordValid = await verifyPassword(validatedData.currentPassword, creator.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(validatedData.newPassword);

    // Update password
    await db
      .update(creators)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId));

    // Log activity
    await ActivityLogger.creatorLogin(
      creatorId,
      creator.email,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('Change creator password error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

export { withAuth(PUT, ['creator']) as PUT };