'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Clock, Video, User, ShoppingCart, Settings, LogOut, Shield, Plus } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface Order {
  order: {
    id: string;
    orderNumber: string;
    instructions?: string;
    price: string;
    status: string;
    paymentStatus: string;
    deliveryFile?: string;
    creatorMessage?: string;
    acceptedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  creator: {
    id: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
  shoutout: {
    id: string;
    title: string;
    deliveryTime: number;
  };
  shoutoutType: {
    id: string;
    name: string;
  };
}

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isSponsored: boolean;
  shoutouts: Array<{
    id: string;
    title: string;
    description: string;
    price: string;
    deliveryTime: number;
    shoutoutType: {
      name: string;
    };
  }>;
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [ordersResponse, creatorsResponse] = await Promise.all([
        apiRequest('/api/orders'),
        apiRequest('/api/creators?limit=12')
      ]);
      
      setOrders(ordersResponse.orders);
      setCreators(creatorsResponse.creators);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
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

  const filteredCreators = creators.filter(creator =>
    creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Video className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  ShoutoutHub
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {user.displayName?.[0] || user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">
                  {user.displayName || user.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.displayName || 'User'}!</h1>
          <p className="text-gray-600">Manage your orders and discover amazing creators</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              My Orders
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
              <Link href="/browse">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">Start by browsing our amazing creators and booking your first shoutout!</p>
                  <Link href="/browse">
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      Browse Creators
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <Card key={order.order.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={order.creator.avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {order.creator.displayName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{order.creator.displayName}</h3>
                              {order.creator.isVerified && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{order.shoutout.title}</p>
                            <p className="text-xs text-gray-500">Order #{order.order.orderNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(order.order.status)}>
                              {order.order.status.charAt(0).toUpperCase() + order.order.status.slice(1)}
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.order.paymentStatus)}>
                              {order.order.paymentStatus.charAt(0).toUpperCase() + order.order.paymentStatus.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold text-gray-900">${order.order.price}</p>
                        </div>
                      </div>
                      
                      {order.order.creatorMessage && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-4">
                          <p className="text-sm text-blue-900">
                            <strong>Creator Message:</strong> {order.order.creatorMessage}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{order.shoutout.deliveryTime}h delivery</span>
                          </div>
                          <span>{order.shoutoutType.name}</span>
                        </div>
                        <Link href={`/orders/${order.order.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover Creators</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreators.map((creator) => (
                  <Card key={creator.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <CardContent className="p-6 text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-4 ring-4 ring-blue-100">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {creator.firstName[0]}{creator.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{creator.displayName}</h3>
                        {creator.isVerified && (
                          <Shield className="w-4 h-4 text-blue-500" />
                        )}
                        {creator.isSponsored && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      
                      {creator.bio && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{creator.bio}</p>
                      )}
                      
                      {creator.shoutouts.length > 0 && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Starting from</span>
                            <span className="font-bold text-green-600">
                              ${Math.min(...creator.shoutouts.map(s => parseFloat(s.price)))}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{Math.min(...creator.shoutouts.map(s => s.deliveryTime))}h delivery</span>
                          </div>
                        </div>
                      )}
                      
                      <Link href={`/creators/${creator.id}`}>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          View Profile
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-center">
              <Link href="/browse">
                <Button variant="outline" size="lg">
                  View All Creators
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                      {user.displayName?.[0] || user.email[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Display Name</label>
                    <Input value={user.displayName || ''} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input value={user.email} disabled />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Link href="/profile/edit">
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/profile/security">
                    <Button variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}