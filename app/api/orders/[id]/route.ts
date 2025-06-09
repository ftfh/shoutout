import { NextRequest, NextResponse } from 'next/server';
import { db, orders, creators, creatorShoutouts, shoutoutTypes } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { getStorageService } from '@/lib/services/storage';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const userId = request.user!.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    // Get order details with creator and shoutout info
    const [order] = await db
      .select({
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          instructions: orders.instructions,
          price: orders.price,
          commissionAmount: orders.commissionAmount,
          creatorEarnings: orders.creatorEarnings,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentId: orders.paymentId,
          deliveryFile: orders.deliveryFile,
          creatorMessage: orders.creatorMessage,
          userResponse: orders.userResponse,
          acceptedAt: orders.acceptedAt,
          completedAt: orders.completedAt,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        },
        creator: {
          id: creators.id,
          firstName: creators.firstName,
          lastName: creators.lastName,
          displayName: creators.displayName,
          avatar: creators.avatar,
          isVerified: creators.isVerified,
        },
        shoutout: {
          id: creatorShoutouts.id,
          title: creatorShoutouts.title,
          description: creatorShoutouts.description,
          deliveryTime: creatorShoutouts.deliveryTime,
        },
        shoutoutType: {
          id: shoutoutTypes.id,
          name: shoutoutTypes.name,
        },
      })
      .from(orders)
      .innerJoin(creators, eq(orders.creatorId, creators.id))
      .innerJoin(creatorShoutouts, eq(orders.shoutoutId, creatorShoutouts.id))
      .innerJoin(shoutoutTypes, eq(creatorShoutouts.shoutoutTypeId, shoutoutTypes.id))
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.userId, userId)
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate download URL for delivery file if it exists
    let deliveryFileUrl = null;
    if (order.order.deliveryFile) {
      try {
        const storageService = await getStorageService();
        deliveryFileUrl = await storageService.getSignedDownloadUrl(
          order.order.deliveryFile,
          3600 // 1 hour expiry
        );
      } catch (error) {
        console.error('Failed to generate download URL:', error);
        // Continue without download URL
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order.order,
        deliveryFileUrl,
        creator: order.creator,
        shoutout: {
          ...order.shoutout,
          shoutoutType: order.shoutoutType,
        },
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

export { withAuth(GET, ['user']) as GET };