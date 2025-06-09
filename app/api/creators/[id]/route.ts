import { NextRequest, NextResponse } from 'next/server';
import { db, creators, creatorShoutouts, shoutoutTypes } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const creatorId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(creatorId)) {
      return NextResponse.json(
        { error: 'Invalid creator ID format' },
        { status: 400 }
      );
    }

    // Get creator profile
    const [creator] = await db
      .select({
        id: creators.id,
        firstName: creators.firstName,
        lastName: creators.lastName,
        displayName: creators.displayName,
        avatar: creators.avatar,
        bio: creators.bio,
        isVerified: creators.isVerified,
        isSponsored: creators.isSponsored,
        createdAt: creators.createdAt,
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

    // Get creator's active shoutouts
    const shoutouts = await db
      .select({
        id: creatorShoutouts.id,
        title: creatorShoutouts.title,
        description: creatorShoutouts.description,
        price: creatorShoutouts.price,
        deliveryTime: creatorShoutouts.deliveryTime,
        createdAt: creatorShoutouts.createdAt,
        shoutoutType: {
          id: shoutoutTypes.id,
          name: shoutoutTypes.name,
          description: shoutoutTypes.description,
        },
      })
      .from(creatorShoutouts)
      .innerJoin(shoutoutTypes, eq(creatorShoutouts.shoutoutTypeId, shoutoutTypes.id))
      .where(
        and(
          eq(creatorShoutouts.creatorId, creatorId),
          eq(creatorShoutouts.isActive, true)
        )
      )
      .orderBy(creatorShoutouts.price);

    return NextResponse.json({
      success: true,
      creator: {
        ...creator,
        shoutouts,
      },
    });

  } catch (error: any) {
    console.error('Get creator profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator profile' },
      { status: 500 }
    );
  }
}