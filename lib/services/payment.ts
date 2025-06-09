export interface PaymentVerificationResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
}

export async function verifyNOWPayment(paymentId: string): Promise<PaymentVerificationResult> {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'NOWPayments API key not configured' };
    }

    const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return { success: false, error: 'Payment verification failed' };
    }

    const paymentData = await response.json();

    return {
      success: true,
      orderId: paymentData.order_id,
      amount: paymentData.price_amount,
      currency: paymentData.price_currency,
      status: paymentData.payment_status,
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, error: 'Payment verification failed' };
  }
}

export async function createNOWPayment(orderData: {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
}) {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      throw new Error('NOWPayments API key not configured');
    }

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: orderData.amount,
        price_currency: orderData.currency,
        pay_currency: 'btc', // Default to Bitcoin, can be made configurable
        order_id: orderData.orderId,
        order_description: orderData.description,
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
}