import { NextRequest, NextResponse } from 'next/server';
import { db, orders } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      // Find order by order number and update status
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          paymentStatus: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(orders.orderNumber, orderId));
    }

    // Redirect to cancel page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancelled${orderId ? `?order_id=${orderId}` : ''}`
    );

  } catch (error: any) {
    console.error('Payment cancel callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error?message=Payment cancellation failed`
    );
  }
}