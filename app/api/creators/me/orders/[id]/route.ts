import { NextRequest, NextResponse } from 'next/server';
import { db, orders, users, creatorShoutouts } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { eq, and } from 'drizzle-orm';

// Get single order details
async function GET(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const creatorId = request.user!.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    // Get order details
    const [order] = await db
      .select({
        order: orders,
        user: {
          id: users.id,
          displayName: users.displayName,
          avatar: users.avatar,
          isVerified: users.isVerified,
        },
        shoutout: {
          id: creatorShoutouts.id,
          title: creatorShoutouts.title,
          description: creatorShoutouts.description,
          deliveryTime: creatorShoutouts.deliveryTime,
        },
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(creatorShoutouts, eq(orders.shoutoutId, creatorShoutouts.id))
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order.order,
        user: order.user,
        shoutout: order.shoutout,
      },
    });

  } catch (error: any) {
    console.error('Get order details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

// Update order (accept/reject/complete)
async function PUT(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const creatorId = request.user!.id;
    const body = await request.json();
    const { action, message, deliveryFile } = body;

    // Validate action
    if (!['accept', 'reject', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get current order
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order based on action
    let updateData: any = {
      updatedAt: new Date(),
    };

    if (action === 'accept') {
      if (currentOrder.status !== 'pending' || currentOrder.paymentStatus !== 'paid') {
        return NextResponse.json(
          { error: 'Order cannot be accepted in current state' },
          { status: 400 }
        );
      }
      updateData.status = 'accepted';
      updateData.acceptedAt = new Date();
      if (message) updateData.creatorMessage = message;

      // Log activity
      await ActivityLogger.orderAccepted(creatorId, orderId);

    } else if (action === 'reject') {
      if (currentOrder.status !== 'pending') {
        return NextResponse.json(
          { error: 'Order cannot be rejected in current state' },
          { status: 400 }
        );
      }
      updateData.status = 'rejected';
      if (message) updateData.creatorMessage = message;

    } else if (action === 'complete') {
      if (currentOrder.status !== 'accepted') {
        return NextResponse.json(
          { error: 'Order cannot be completed in current state' },
          { status: 400 }
        );
      }
      updateData.status = 'completed';
      updateData.completedAt = new Date();
      if (message) updateData.creatorMessage = message;
      if (deliveryFile) updateData.deliveryFile = deliveryFile;

      // Log activity
      await ActivityLogger.orderCompleted(creatorId, orderId);
    }

    // Update the order
    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${action}ed successfully`,
    });

  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export { withAuth(GET, ['creator']) as GET, withAuth(PUT, ['creator']) as PUT };