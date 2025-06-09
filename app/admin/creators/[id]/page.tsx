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
import { ArrowLeft, Shield, Save, UserPlus, ShoppingCart, DollarSign, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface CreatorDetails {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  country: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  isSponsored: boolean;
  commissionRate: string;
  withdrawalPermission: boolean;
  totalEarnings: string;
  availableBalance: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalOrders: number;
    totalRevenue: number;
    completedOrders: number;
    shoutoutCount: number;
    totalWithdrawals: number;
    totalWithdrawn: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    price: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  recentWithdrawals: Array<{
    id: string;
    amount: string;
    status: string;
    createdAt: string;
    processedAt?: string;
  }>;
}

export default function AdminCreatorDetailsPage() {
  const { user } = useAuth();
  const params = useParams();
  const [creatorDetails, setCreatorDetails] = useState<CreatorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [commissionRate, setCommissionRate] = useState('15');
  const [withdrawalPermission, setWithdrawalPermission] = useState(true);

  useEffect(() => {
    if (user?.type === 'admin' && params.id) {
      loadCreatorDetails();
    }
  }, [user, params.id]);

  const loadCreatorDetails = async () => {
    try {
      const response = await apiRequest(`/api/admin/creators/${params.id}`);
      setCreatorDetails(response.creator);
      setIsVerified(response.creator.isVerified);
      setIsSponsored(response.creator.isSponsored);
      setCommissionRate(response.creator.commissionRate);
      setWithdrawalPermission(response.creator.withdrawalPermission);
    } catch (error: any) {
      toast.error('Failed to load creator details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!creatorDetails) return;

    setSaving(true);
    try {
      await apiRequest(`/api/admin/creators/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          isVerified,
          isSponsored,
          commissionRate: parseFloat(commissionRate),
          withdrawalPermission,
        }),
      });
      
      toast.success('Creator updated successfully');
      await loadCreatorDetails();
    } catch (error: any) {
      toast.error('Failed to update creator');
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

  if (!creatorDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Creator not found</h1>
          <Link href="/admin/creators">
            <Button>Back to Creators</Button>
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
            <Link href="/admin/creators" className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Creators</span>
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
          {/* Creator Profile */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Creator Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={creatorDetails.avatar} />
                      <AvatarFallback className="bg-purple-600 text-white text-xl">
                        {creatorDetails.firstName[0]}{creatorDetails.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-white">{creatorDetails.displayName}</h2>
                        {creatorDetails.isVerified && <Shield className="h-5 w-5 text-blue-400" />}
                        {creatorDetails.isSponsored && <Star className="h-5 w-5 text-yellow-400 fill-current" />}
                      </div>
                      <p className="text-gray-300">{creatorDetails.firstName} {creatorDetails.lastName}</p>
                      <p className="text-gray-400">{creatorDetails.email}</p>
                    </div>
                  </div>

                  {creatorDetails.bio && (
                    <div>
                      <Label className="text-gray-300">Bio</Label>
                      <p className="text-white mt-1">{creatorDetails.bio}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Country</Label>
                      <p className="text-white mt-1">{creatorDetails.country}</p>
                    </div>
                    <div>
                      <Label className="text-gray-300">Joined</Label>
                      <p className="text-white mt-1">{new Date(creatorDetails.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="verified"
                        checked={isVerified}
                        onCheckedChange={setIsVerified}
                      />
                      <Label htmlFor="verified" className="text-gray-300">Verified Creator</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sponsored"
                        checked={isSponsored}
                        onCheckedChange={setIsSponsored}
                      />
                      <Label htmlFor="sponsored" className="text-gray-300">Sponsored Creator</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="withdrawal"
                        checked={withdrawalPermission}
                        onCheckedChange={setWithdrawalPermission}
                      />
                      <Label htmlFor="withdrawal" className="text-gray-300">Withdrawal Permission</Label>
                    </div>

                    <div>
                      <Label htmlFor="commission" className="text-gray-300">Commission Rate (%)</Label>
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="50"
                        step="0.01"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="mt-1 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Earnings & Statistics</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">${parseFloat(creatorDetails.totalEarnings).toFixed(2)}</div>
                        <div className="text-gray-300">Total Earnings</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">${parseFloat(creatorDetails.availableBalance).toFixed(2)}</div>
                        <div className="text-gray-300">Available Balance</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-400">{creatorDetails.stats.totalOrders}</div>
                        <div className="text-gray-300">Total Orders</div>
                      </div>
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">{creatorDetails.stats.shoutoutCount}</div>
                        <div className="text-gray-300">Active Shoutouts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders and Withdrawals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creatorDetails.recentOrders.length === 0 ? (
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
                        <TableHead className="text-gray-300">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creatorDetails.recentOrders.map((order) => (
                        <TableRow key={order.id} className="border-gray-700">
                          <TableCell className="text-white font-mono text-sm">{order.orderNumber}</TableCell>
                          <TableCell className="text-white">${order.price}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Recent Withdrawals */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Recent Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creatorDetails.recentWithdrawals.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No withdrawals found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Amount</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creatorDetails.recentWithdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id} className="border-gray-700">
                          <TableCell className="text-white">${withdrawal.amount}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(withdrawal.status)}>
                              {withdrawal.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300 text-sm">
                            {new Date(withdrawal.createdAt).toLocaleDateString()}
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
    </div>
  );
}