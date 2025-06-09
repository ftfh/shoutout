'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, Save, User, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  dateOfBirth: string;
  country: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalOrders: number;
    totalSpent: number;
    completedOrders: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    price: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export default function AdminUserDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (user?.type === 'admin' && params.id) {
      loadUserDetails();
    }
  }, [user, params.id]);

  const loadUserDetails = async () => {
    try {
      const response = await apiRequest(`/api/admin/users/${params.id}`);
      setUserDetails(response.user);
      setIsVerified(response.user.isVerified);
    } catch (error: any) {
      toast.error('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userDetails) return;

    setSaving(true);
    try {
      await apiRequest(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isVerified,
        }),
      });
      
      toast.success('User updated successfully');
      await loadUserDetails();
    } catch (error: any) {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
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

  if (!user || user.type !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">User not found</h1>
          <Link href="/admin/users">
            <Button>Back to Users</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/users" className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Users</span>
            </Link>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          {/* User Profile */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={userDetails.avatar} />
                      <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {userDetails.firstName[0]}{userDetails.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">{userDetails.displayName}</h2>
                        {userDetails.isVerified && <Shield className="h-5 w-5 text-blue-400" />}
                      </div>
                      <p className="text-gray-300">{userDetails.firstName} {userDetails.lastName}</p>
                      <p className="text-gray-400">{userDetails.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Country</Label>
                      <p className="text-white mt-1">{userDetails.country}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Date of Birth</Label>
                      <p className="text-white mt-1">{new Date(userDetails.dateOfBirth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Joined</Label>
                      <p className="text-white mt-1">{new Date(userDetails.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Last Updated</Label>
                      <p className="text-white mt-1">{new Date(userDetails.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="verified"
                      checked={isVerified}
                      onCheckedChange={setIsVerified}
                    />
                    <Label htmlFor="verified" className="text-gray-300">Verified Account</Label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{userDetails.stats.totalOrders}</div>
                        <div className="text-gray-300">Total Orders</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">${userDetails.stats.totalSpent.toFixed(2)}</div>
                        <div className="text-gray-300">Total Spent</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">{userDetails.stats.completedOrders}</div>
                        <div className="text-gray-300">Completed Orders</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userDetails.recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No orders found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Order #</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Payment</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userDetails.recentOrders.map((order) => (
                      <TableRow key={order.id} className="border-gray-700">
                        <TableCell className="text-white font-mono">{order.orderNumber}</TableCell>
                        <TableCell className="text-white">${order.price}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.paymentStatus)}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}