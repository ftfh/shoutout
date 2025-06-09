import { NextRequest, NextResponse } from 'next/server';
import { db, orders, creators } from '@/lib/db';
import { verifyNOWPayment } from '@/lib/services/payment';
import { ActivityLogger } from '@/lib/services/activity-logger';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const orderId = searchParams.get('order_id');

    if (!paymentId || !orderId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error?message=Missing payment information`
      );
    }

    // Verify payment with NOWPayments
    const verification = await verifyNOWPayment(paymentId);
    
    if (!verification.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error?message=Payment verification failed`
      );
    }

    // Find order by order number
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error?message=Order not found`
      );
    }

    // Check if payment is already processed
    if (order.paymentStatus === 'paid') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${order.id}?message=Payment already processed`
      );
    }

    // Update order status
    await db
      .update(orders)
      .set({
        paymentStatus: 'paid',
        status: 'pending', // Creator needs to accept
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // Update creator's available balance
    await db
      .update(creators)
      .set({
        availableBalance: sql`available_balance + ${order.creatorEarnings}`,
        totalEarnings: sql`total_earnings + ${order.creatorEarnings}`,
        updatedAt: new Date(),
      })
      .where(eq(creators.id, order.creatorId));

    // Log activity
    await ActivityLogger.orderCreated(
      order.userId,
      order.id,
      Number(order.price)
    );

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${order.id}`
    );

  } catch (error: any) {
    console.error('Payment success callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error?message=Payment processing failed`
    );
  }
}