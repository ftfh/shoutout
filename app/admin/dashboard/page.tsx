'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, UserPlus, ShoppingCart, DollarSign, TrendingUp, 
  AlertCircle, Shield, Settings, LogOut, Activity, FileText
} from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    totalUsers: number;
    totalCreators: number;
    totalOrders: number;
    completedOrders: number;
    pendingWithdrawals: number;
    periodUsers: number;
    periodCreators: number;
    periodOrders: number;
    periodRevenue: number;
  };
  recentActivities: Array<{
    id: string;
    userType: string;
    userId: string;
    action: string;
    description: string;
    ipAddress?: string;
    createdAt: string;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    price: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user: {
      displayName: string;
    };
    creator: {
      displayName: string;
    };
  }>;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.type === 'admin') {
      loadDashboard();
    } else {
      window.location.href = '/';
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      const response = await apiRequest('/api/admin/dashboard');
      setDashboard(response.dashboard);
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

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'creator': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user || user.type !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-yellow-500" />
                <span className="text-xl font-bold text-white">
                  Admin Dashboard
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-yellow-600 text-black">
                    {user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-300">
                  {user.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-300 hover:text-white">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Platform Overview</h1>
          <p className="text-gray-400">Monitor and manage your ShoutoutHub platform</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-gray-300 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-gray-300 data-[state=active]:text-white">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-gray-300 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-8 bg-gray-700 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : dashboard ? (
              <>
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-blue-600 border-blue-500 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Users</p>
                          <p className="text-3xl font-bold">{dashboard.stats.totalUsers}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-600 border-purple-500 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Total Creators</p>
                          <p className="text-3xl font-bold">{dashboard.stats.totalCreators}</p>
                        </div>
                        <UserPlus className="h-8 w-8 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-600 border-green-500 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Total Orders</p>
                          <p className="text-3xl font-bold">{dashboard.stats.totalOrders}</p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-600 border-yellow-500 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100 text-sm">Revenue (30d)</p>
                          <p className="text-3xl font-bold">${dashboard.stats.periodRevenue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Period Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gray-800 border-gray-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-300 text-sm">New Users (30d)</p>
                          <p className="text-2xl font-bold">{dashboard.stats.periodUsers}</p>
                        </div>
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-300 text-sm">New Creators (30d)</p>
                          <p className="text-2xl font-bold">{dashboard.stats.periodCreators}</p>
                        </div>
                        <UserPlus className="h-6 w-6 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-300 text-sm">Pending Withdrawals</p>
                          <p className="text-2xl font-bold">{dashboard.stats.pendingWithdrawals}</p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                    <CardDescription className="text-gray-400">
                      Common administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Link href="/admin/users">
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white">
                          <Users className="h-4 w-4 mr-2" />
                          Manage Users
                        </Button>
                      </Link>
                      <Link href="/admin/creators">
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Manage Creators
                        </Button>
                      </Link>
                      <Link href="/admin/withdrawals">
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Withdrawals
                        </Button>
                      </Link>
                      <Link href="/admin/settings">
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage platform users and creators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/admin/users">
                    <Button className="w-full h-24 flex flex-col justify-center">
                      <Users className="h-8 w-8 mb-2" />
                      View All Users
                    </Button>
                  </Link>
                  <Link href="/admin/creators">
                    <Button className="w-full h-24 flex flex-col justify-center" variant="outline">
                      <UserPlus className="h-8 w-8 mb-2" />
                      View All Creators
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Orders</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest platform activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recentOrders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-white">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-300">
                            {order.user.displayName} → {order.creator.displayName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 mb-2">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge className={getStatusColor(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold text-white">${order.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Platform activity logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard?.recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboard?.recentActivities.slice(0, 15).map((activity) => (
                      <div key={activity.id} className="flex items-start justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getUserTypeColor(activity.userType)}>
                              {activity.userType}
                            </Badge>
                            <span className="text-sm font-medium text-gray-300">{activity.action}</span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">{activity.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{new Date(activity.createdAt).toLocaleString()}</span>
                            {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}