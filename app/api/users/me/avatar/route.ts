import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getStorageService } from '@/lib/services/storage';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

// Update avatar after upload
async function PUT(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { fileKey } = body;
    const { ipAddress, userAgent } = getClientInfo(request);
    const userId = request.user!.id;

    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    // Update user avatar
    const [updatedUser] = await db
      .update(users)
      .set({
        avatar: fileKey,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        avatar: users.avatar,
      });

    // Log activity
    await ActivityLogger.userLogin(
      userId,
      request.user!.email,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      avatar: updatedUser.avatar,
      message: 'Avatar updated successfully',
    });

  } catch (error: any) {
    console.error('Update avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar' },
      { status: 500 }
    );
  }
}

// Delete user avatar
async function DELETE(request: AuthenticatedRequest) {
  try {
    const { ipAddress, userAgent } = getClientInfo(request);
    const userId = request.user!.id;

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

    // Delete file from storage if exists
    if (user.avatar) {
      try {
        const storageService = await getStorageService();
        await storageService.deleteFile(user.avatar);
      } catch (error) {
        console.error('Failed to delete avatar file:', error);
        // Continue with database update even if file deletion fails
      }
    }

    // Update user avatar to null
    await db
      .update(users)
      .set({
        avatar: null,
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
      message: 'Avatar removed successfully',
    });

  } catch (error: any) {
    console.error('Delete avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to remove avatar' },
      { status: 500 }
    );
  }
}

export { withAuth(PUT, ['user']) as PUT, withAuth(DELETE, ['user']) as DELETE };