'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, User, ShoppingCart, DollarSign, Settings, LogOut, 
  TrendingUp, Clock, CheckCircle, AlertCircle, Plus 
} from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface DashboardStats {
  stats: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    activeShoutouts: number;
    periodOrders: number;
    periodEarnings: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    price: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    acceptedAt?: string;
    completedAt?: string;
    shoutout: {
      title: string;
    };
  }>;
  recentWithdrawals: Array<{
    id: string;
    amount: string;
    status: string;
    createdAt: string;
    processedAt?: string;
  }>;
}

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  commissionRate: string;
  totalEarnings: string;
  availableBalance: string;
  withdrawalPermission: boolean;
}

export default function CreatorDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (user?.type === 'creator') {
      loadData();
    } else {
      // Redirect non-creators
      window.location.href = '/';
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [dashboardResponse, profileResponse] = await Promise.all([
        apiRequest('/api/creators/me/dashboard'),
        apiRequest('/api/creators/me')
      ]);
      
      setDashboard(dashboardResponse.dashboard);
      setCreator(profileResponse.creator);
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.type !== 'creator') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/creator" className="flex items-center space-x-2">
                <Video className="h-8 w-8 text-purple-600" />
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Creator Studio
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-purple-600 text-white">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creator Dashboard</h1>
          <p className="text-gray-600">Manage your shoutouts, orders, and earnings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="shoutouts" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Shoutouts
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : dashboard ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Orders</p>
                          <p className="text-3xl font-bold">{dashboard.stats.totalOrders}</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Completed</p>
                          <p className="text-3xl font-bold">{dashboard.stats.completedOrders}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100 text-sm">Pending</p>
                          <p className="text-3xl font-bold">{dashboard.stats.pendingOrders}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Active Shoutouts</p>
                          <p className="text-3xl font-bold">{dashboard.stats.activeShoutouts}</p>
                        </div>
                        <Video className="h-8 w-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Earnings Card */}
                {creator && (
                  <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <p className="text-emerald-100 text-sm mb-1">Total Earnings</p>
                          <p className="text-3xl font-bold">${parseFloat(creator.totalEarnings).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-emerald-100 text-sm mb-1">Available Balance</p>
                          <p className="text-3xl font-bold">${parseFloat(creator.availableBalance).toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-emerald-100 text-sm mb-1">Commission Rate</p>
                          <p className="text-3xl font-bold">{creator.commissionRate}%</p>
                        </div>
                      </div>
                      <div className="mt-6 text-center">
                        <Link href="/creator/withdrawals">
                          <Button variant="secondary" className="bg-white text-emerald-600 hover:bg-gray-100">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Request Withdrawal
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Your latest order activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboard.recentOrders.length === 0 ? (
                        <div className="text-center py-8">
                          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">No recent orders</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dashboard.recentOrders.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{order.shoutout.title}</p>
                                <p className="text-sm text-gray-600">#{order.orderNumber}</p>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </Badge>
                                <p className="text-sm font-medium text-gray-900 mt-1">${order.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Withdrawals</CardTitle>
                      <CardDescription>Your withdrawal history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboard.recentWithdrawals.length === 0 ? (
                        <div className="text-center py-8">
                          <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600">No withdrawals yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dashboard.recentWithdrawals.map((withdrawal) => (
                            <div key={withdrawal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">${withdrawal.amount}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(withdrawal.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={getStatusColor(withdrawal.status)}>
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="orders">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Orders Management</h2>
              <Link href="/creator/orders">
                <Button>
                  View All Orders
                </Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">Manage your orders from the dedicated orders page.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shoutouts">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Shoutouts</h2>
              <Link href="/creator/shoutouts/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shoutout
                </Button>
              </Link>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600">Manage your shoutout offerings from the dedicated shoutouts page.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            {creator && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Manage your creator profile and settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-center">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={creator.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-2xl">
                        {creator.firstName[0]}{creator.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Display Name</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        {creator.displayName}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        {creator.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        {creator.firstName}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        {creator.lastName}
                      </div>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Bio</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        {creator.bio}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <Link href="/creator/profile/edit">
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                    <Link href="/creator/settings">
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}