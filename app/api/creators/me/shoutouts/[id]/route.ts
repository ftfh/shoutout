import { NextRequest, NextResponse } from 'next/server';
import { db, creatorShoutouts, shoutoutTypes } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { shoutoutSchema } from '@/lib/validation/schemas';
import { eq, and } from 'drizzle-orm';

// Get single shoutout
async function GET(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shoutoutId = params.id;
    const creatorId = request.user!.id;

    const [shoutout] = await db
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
      .where(
        and(
          eq(creatorShoutouts.id, shoutoutId),
          eq(creatorShoutouts.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!shoutout) {
      return NextResponse.json(
        { error: 'Shoutout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      shoutout,
    });

  } catch (error: any) {
    console.error('Get shoutout error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shoutout' },
      { status: 500 }
    );
  }
}

// Update shoutout
async function PUT(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shoutoutId = params.id;
    const creatorId = request.user!.id;
    const body = await request.json();

    // Validate input
    const validatedData = shoutoutSchema.parse(body);

    // Verify shoutout exists and belongs to creator
    const [existingShoutout] = await db
      .select()
      .from(creatorShoutouts)
      .where(
        and(
          eq(creatorShoutouts.id, shoutoutId),
          eq(creatorShoutouts.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!existingShoutout) {
      return NextResponse.json(
        { error: 'Shoutout not found' },
        { status: 404 }
      );
    }

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

    // Update shoutout
    const [updatedShoutout] = await db
      .update(creatorShoutouts)
      .set({
        shoutoutTypeId: validatedData.shoutoutTypeId,
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price.toString(),
        deliveryTime: validatedData.deliveryTime,
        updatedAt: new Date(),
      })
      .where(eq(creatorShoutouts.id, shoutoutId))
      .returning();

    return NextResponse.json({
      success: true,
      shoutout: {
        ...updatedShoutout,
        shoutoutType,
      },
      message: 'Shoutout updated successfully',
    });

  } catch (error: any) {
    console.error('Update shoutout error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update shoutout' },
      { status: 500 }
    );
  }
}

// Delete shoutout
async function DELETE(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shoutoutId = params.id;
    const creatorId = request.user!.id;

    // Verify shoutout exists and belongs to creator
    const [existingShoutout] = await db
      .select()
      .from(creatorShoutouts)
      .where(
        and(
          eq(creatorShoutouts.id, shoutoutId),
          eq(creatorShoutouts.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!existingShoutout) {
      return NextResponse.json(
        { error: 'Shoutout not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await db
      .update(creatorShoutouts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(creatorShoutouts.id, shoutoutId));

    return NextResponse.json({
      success: true,
      message: 'Shoutout deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete shoutout error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shoutout' },
      { status: 500 }
    );
  }
}

export { 
  withAuth(GET, ['creator']) as GET, 
  withAuth(PUT, ['creator']) as PUT, 
  withAuth(DELETE, ['creator']) as DELETE 
};