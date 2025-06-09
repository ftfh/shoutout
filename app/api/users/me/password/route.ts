import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { userPasswordChangeSchema } from '@/lib/validation/schemas';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

// Change user password
async function PUT(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const userId = request.user!.id;

    // Validate input
    const validatedData = userPasswordChangeSchema.parse(body);

    // Get current user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const passwordValid = await verifyPassword(validatedData.currentPassword, user.password);
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
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log activity
    await ActivityLogger.userLogin(
      userId,
      user.email,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    
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

export { withAuth(PUT, ['user']) as PUT };