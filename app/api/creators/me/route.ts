import { NextRequest, NextResponse } from 'next/server';
import { db, creators } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { profileUpdateSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq } from 'drizzle-orm';

// Get creator profile
async function GET(request: AuthenticatedRequest) {
  try {
    const creatorId = request.user!.id;

    const [creator] = await db
      .select({
        id: creators.id,
        firstName: creators.firstName,
        lastName: creators.lastName,
        displayName: creators.displayName,
        email: creators.email,
        dateOfBirth: creators.dateOfBirth,
        country: creators.country,
        avatar: creators.avatar,
        bio: creators.bio,
        isVerified: creators.isVerified,
        isSponsored: creators.isSponsored,
        commissionRate: creators.commissionRate,
        withdrawalPermission: creators.withdrawalPermission,
        totalEarnings: creators.totalEarnings,
        availableBalance: creators.availableBalance,
        payoutMethod: creators.payoutMethod,
        createdAt: creators.createdAt,
        updatedAt: creators.updatedAt,
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

    return NextResponse.json({ success: true, creator });

  } catch (error: any) {
    console.error('Get creator profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update creator profile
async function PUT(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const creatorId = request.user!.id;

    // Validate input
    const validatedData = profileUpdateSchema.parse(body);

    // Check if display name is taken by another creator
    if (validatedData.displayName) {
      const existingCreator = await db
        .select()
        .from(creators)
        .where(eq(creators.displayName, validatedData.displayName))
        .limit(1);

      if (existingCreator.length > 0 && existingCreator[0].id !== creatorId) {
        return NextResponse.json(
          { error: 'Display name already taken' },
          { status: 400 }
        );
      }
    }

    // Update creator
    const [updatedCreator] = await db
      .update(creators)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, creatorId))
      .returning({
        id: creators.id,
        firstName: creators.firstName,
        lastName: creators.lastName,
        displayName: creators.displayName,
        email: creators.email,
        dateOfBirth: creators.dateOfBirth,
        country: creators.country,
        avatar: creators.avatar,
        bio: creators.bio,
        isVerified: creators.isVerified,
        isSponsored: creators.isSponsored,
        commissionRate: creators.commissionRate,
        withdrawalPermission: creators.withdrawalPermission,
        totalEarnings: creators.totalEarnings,
        availableBalance: creators.availableBalance,
        payoutMethod: creators.payoutMethod,
        createdAt: creators.createdAt,
        updatedAt: creators.updatedAt,
      });

    // Log activity
    await ActivityLogger.creatorLogin(
      creatorId,
      request.user!.email,
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      creator: updatedCreator,
      message: 'Profile updated successfully',
    });

  } catch (error: any) {
    console.error('Update creator profile error:', error);
    
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

export { withAuth(GET, ['creator']) as GET, withAuth(PUT, ['creator']) as PUT };