'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('order_id');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Payment Cancelled</CardTitle>
            <CardDescription className="text-gray-600">
              Your payment was cancelled and no charges were made
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">What happened?</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• You cancelled the payment process</li>
                <li>• No charges were made to your account</li>
                <li>• Your order was not placed</li>
                <li>• You can try again anytime</li>
              </ul>
            </div>
            
            {orderId && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Cancelled Order</p>
                <p className="font-mono font-semibold text-gray-900">#{orderId}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Link href="/browse" className="block">
                <Button className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
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