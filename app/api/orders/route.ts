import { NextRequest, NextResponse } from 'next/server';
import { db, orders, creatorShoutouts, creators, users, shoutoutTypes } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { orderSchema } from '@/lib/validation/schemas';
import { generateOrderNumber } from '@/lib/utils/order-number';
import { createNOWPayment } from '@/lib/services/payment';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { getClientInfo } from '@/lib/utils/request';
import { eq, desc } from 'drizzle-orm';

// Create new order
async function POST(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { ipAddress, userAgent } = getClientInfo(request);
    const userId = request.user!.id;

    // Validate input
    const validatedData = orderSchema.parse(body);

    // Get shoutout details with creator info
    const [shoutout] = await db
      .select({
        shoutout: creatorShoutouts,
        creator: {
          id: creators.id,
          displayName: creators.displayName,
          commissionRate: creators.commissionRate,
        },
      })
      .from(creatorShoutouts)
      .innerJoin(creators, eq(creatorShoutouts.creatorId, creators.id))
      .where(eq(creatorShoutouts.id, validatedData.shoutoutId))
      .limit(1);

    if (!shoutout) {
      return NextResponse.json(
        { error: 'Shoutout not found' },
        { status: 404 }
      );
    }

    if (!shoutout.shoutout.isActive) {
      return NextResponse.json(
        { error: 'Shoutout is no longer available' },
        { status: 400 }
      );
    }

    // Calculate commission and earnings
    const price = Number(shoutout.shoutout.price);
    const commissionRate = Number(shoutout.creator.commissionRate);
    const commissionAmount = (price * commissionRate) / 100;
    const creatorEarnings = price - commissionAmount;

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        creatorId: shoutout.creator.id,
        shoutoutId: validatedData.shoutoutId,
        orderNumber,
        instructions: validatedData.instructions || null,
        price: price.toString(),
        commissionRate: commissionRate.toString(),
        commissionAmount: commissionAmount.toString(),
        creatorEarnings: creatorEarnings.toString(),
        status: 'pending',
        paymentStatus: 'pending',
      })
      .returning({
        id: orders.id,
        orderNumber: orders.orderNumber,
        price: orders.price,
      });

    // Create payment with NOWPayments
    try {
      const payment = await createNOWPayment({
        orderId: newOrder.orderNumber,
        amount: price,
        currency: 'USD',
        description: `Shoutout: ${shoutout.shoutout.title} by ${shoutout.creator.displayName}`,
      });

      // Update order with payment ID
      await db
        .update(orders)
        .set({
          paymentId: payment.payment_id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, newOrder.id));

      // Log activity
      await ActivityLogger.orderCreated(userId, newOrder.id, price);

      return NextResponse.json({
        success: true,
        order: {
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          price: newOrder.price,
        },
        payment: {
          paymentId: payment.payment_id,
          paymentUrl: payment.pay_url,
          paymentAddress: payment.pay_address,
          payAmount: payment.pay_amount,
          payCurrency: payment.pay_currency,
        },
        message: 'Order created successfully',
      });

    } catch (paymentError) {
      console.error('Payment creation failed:', paymentError);
      
      // Update order status to failed
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, newOrder.id));

      return NextResponse.json(
        { error: 'Failed to create payment. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Create order error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get user's orders
async function GET(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.id;
    const { searchParams } = new URL(request.url);
    
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = (page - 1) * limit;

    // Get user's orders with creator and shoutout details
    const userOrders = await db
      .select({
        order: {
          id: orders.id,
          orderNumber: orders.orderNumber,
          instructions: orders.instructions,
          price: orders.price,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          deliveryFile: orders.deliveryFile,
          creatorMessage: orders.creatorMessage,
          acceptedAt: orders.acceptedAt,
          completedAt: orders.completedAt,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        },
        creator: {
          id: creators.id,
          displayName: creators.displayName,
          avatar: creators.avatar,
          isVerified: creators.isVerified,
        },
        shoutout: {
          id: creatorShoutouts.id,
          title: creatorShoutouts.title,
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
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      orders: userOrders,
      pagination: {
        page,
        limit,
        hasNext: userOrders.length === limit,
        hasPrev: page > 1,
      },
    });

  } catch (error: any) {
    console.error('Get user orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export { withAuth(POST, ['user']) as POST, withAuth(GET, ['user']) as GET };