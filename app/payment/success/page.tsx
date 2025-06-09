'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('order_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Payment Successful!</CardTitle>
            <CardDescription className="text-gray-600">
              Your order has been placed successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Your creator will be notified about your order</li>
                <li>• They have 24 hours to accept your request</li>
                <li>• You'll receive an email confirmation shortly</li>
                <li>• Your shoutout will be delivered within the promised timeframe</li>
              </ul>
            </div>
            
            {orderId && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Order Number</p>
                <p className="font-mono font-semibold text-gray-900">#{orderId}</p>
              </div>
            )}
            
            <div className="space-y-3">
              {orderId && (
                <Link href={`/orders/${orderId}`} className="block">
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    View Order Details
                  </Button>
                </Link>
              )}
              
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              <p>Need help? <Link href="/support" className="text-blue-600 hover:underline">Contact Support</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}