'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Calendar, Clock, DollarSign, MessageSquare, Shield } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface OrderDetails {
  id: string;
  orderNumber: string;
  instructions?: string;
  price: string;
  commissionAmount: string;
  creatorEarnings: string;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  deliveryFile?: string;
  deliveryFileUrl?: string;
  creatorMessage?: string;
  userResponse?: string;
  acceptedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
  shoutout: {
    id: string;
    title: string;
    description: string;
    deliveryTime: number;
    shoutoutType: {
      id: string;
      name: string;
    };
  };
}

export default function OrderDetails() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [userResponse, setUserResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const response = await apiRequest(`/api/orders/${params.id}`);
      setOrder(response.order);
      setUserResponse(response.order.userResponse || '');
    } catch (error: any) {
      toast.error('Failed to load order details');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Details</h1>
          <p className="text-gray-600">Order #{order.orderNumber}</p>
        </div>

        <div className="grid gap-8">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Order Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Payment Status</label>
                    <div className="mt-1">
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Order Date</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  {order.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Completed Date</label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{formatDate(order.completedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator & Shoutout Info */}
          <Card>
            <CardHeader>
              <CardTitle>Creator & Shoutout Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Creator</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={order.creator.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {order.creator.firstName[0]}{order.creator.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{order.creator.displayName}</h4>
                        {order.creator.isVerified && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-gray-600">{order.creator.firstName} {order.creator.lastName}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Shoutout</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">{order.shoutout.title}</span>
                      <Badge variant="outline" className="ml-2">{order.shoutout.shoutoutType.name}</Badge>
                    </div>
                    <p className="text-gray-600">{order.shoutout.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{order.shoutout.deliveryTime} hours delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          {order.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Your Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900">{order.instructions}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Creator Message */}
          {order.creatorMessage && (
            <Card>
              <CardHeader>
                <CardTitle>Message from Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-blue-900">{order.creatorMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery File */}
          {order.deliveryFile && order.deliveryFileUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Your Shoutout</CardTitle>
                <CardDescription>Download your completed shoutout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Download className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Your shoutout is ready!</p>
                      <p className="text-sm text-green-700">Click to download your personalized content</p>
                    </div>
                  </div>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <a href={order.deliveryFileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Shoutout Price</span>
                  <span className="font-medium">${order.price}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium">${order.commissionAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Creator Earnings</span>
                  <span className="font-medium">${order.creatorEarnings}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Paid</span>
                    <span className="text-lg font-bold text-green-600">${order.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                
                {order.paymentStatus === 'paid' && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium">Payment Confirmed</p>
                      <p className="text-sm text-gray-600">Payment successfully processed</p>
                    </div>
                  </div>
                )}
                
                {order.acceptedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <div>
                      <p className="font-medium">Order Accepted</p>
                      <p className="text-sm text-gray-600">{formatDate(order.acceptedAt)}</p>
                    </div>
                  </div>
                )}
                
                {order.completedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium">Order Completed</p>
                      <p className="text-sm text-gray-600">{formatDate(order.completedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}