import { NextRequest, NextResponse } from 'next/server';
import { db, creatorShoutouts, shoutoutTypes } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { shoutoutSchema } from '@/lib/validation/schemas';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, desc } from 'drizzle-orm';

// Get creator's shoutouts
async function GET(request: AuthenticatedRequest) {
  try {
    const creatorId = request.user!.id;
    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = (page - 1) * limit;

    // Get creator's shoutouts with type info
    const shoutouts = await db
      .select({
        id: creatorShoutouts.id,
        title: creatorShoutouts.title,
        description: creatorShoutouts.description,
        price: creatorShoutouts.price,
        deliveryTime: creatorShoutouts.deliveryTime,
        isActive: creatorShoutouts.isActive,
        createdAt: creatorShoutouts.createdAt,
        updatedAt: creatorShoutouts.updatedAt,
        shoutoutType: {
          id: shoutoutTypes.id,
          name: shoutoutTypes.name,
          description: shoutoutTypes.description,
        },
      })
      .from(creatorShoutouts)
      .innerJoin(shoutoutTypes, eq(creatorShoutouts.shoutoutTypeId, shoutoutTypes.id))
      .where(eq(creatorShoutouts.creatorId, creatorId))
      .orderBy(desc(creatorShoutouts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      shoutouts,
      pagination: {
        page,
        limit,
        hasNext: shoutouts.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get creator shoutouts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shoutouts' },
      { status: 500 }
    );
  }
}

// Create new shoutout
async function POST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const creatorId = request.user!.id;

    // Validate input
    const validatedData = shoutoutSchema.parse(body);

    // Verify shoutout type exists
    const [shoutoutType] = await db
      .select()
      .from(shoutoutTypes)
      .where(eq(shoutoutTypes.id, validatedData.shoutoutTypeId))
      .limit(1);

    if (!shoutoutType) {
      return NextResponse.json(
        { error: 'Invalid shoutout type' },
        { status: 400 }
      );
    }

    // Create shoutout
    const [newShoutout] = await db
      .insert(creatorShoutouts)
      .values({
        creatorId,
        shoutoutTypeId: validatedData.shoutoutTypeId,
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price.toString(),
        deliveryTime: validatedData.deliveryTime,
        isActive: true,
      })
      .returning({
        id: creatorShoutouts.id,
        title: creatorShoutouts.title,
        description: creatorShoutouts.description,
        price: creatorShoutouts.price,
        deliveryTime: creatorShoutouts.deliveryTime,
        isActive: creatorShoutouts.isActive,
        createdAt: creatorShoutouts.createdAt,
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
      shoutout: {
        ...newShoutout,
        shoutoutType,
      },
      message: 'Shoutout created successfully',
    });

  } catch (error: any) {
    console.error('Create shoutout error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create shoutout' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['creator']) as GET, withAuth(POST, ['creator']) as POST };