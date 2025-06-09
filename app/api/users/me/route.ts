import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { userProfileUpdateSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

// Get user profile
async function GET(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.id;

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        email: users.email,
        dateOfBirth: users.dateOfBirth,
        country: users.country,
        avatar: users.avatar,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update user profile
async function PUT(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const userId = request.user!.id;

    // Validate input
    const validatedData = userProfileUpdateSchema.parse(body);

    // Check if display name is taken by another user
    if (validatedData.displayName) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.displayName, validatedData.displayName))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].id !== userId) {
        return NextResponse.json(
          { error: 'Display name already taken' },
          { status: 400 }
        );
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        displayName: users.displayName,
        email: users.email,
        dateOfBirth: users.dateOfBirth,
        country: users.country,
        avatar: users.avatar,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
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
      user: updatedUser,
      message: 'Profile updated successfully',
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['user']) as GET, withAuth(PUT, ['user']) as PUT };