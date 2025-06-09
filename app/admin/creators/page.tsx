'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Search, ArrowLeft, Shield, UserPlus, Star } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  country: string;
  avatar?: string;
  isVerified: boolean;
  isSponsored: boolean;
  commissionRate: string;
  withdrawalPermission: boolean;
  totalEarnings: string;
  availableBalance: string;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  totalRevenue: number;
}

interface Pagination {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminCreatorsPage() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    if (user?.type === 'admin') {
      loadCreators();
    }
  }, [user, searchQuery, page]);

  const loadCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await apiRequest(`/api/admin/creators?${params.toString()}`);
      setCreators(response.creators);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  if (!user || user.type !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Creator Management</h1>
          <p className="text-gray-400">Manage platform creators and their accounts</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Platform Creators
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search creators..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : creators.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No creators found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Creator</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Country</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Commission</TableHead>
                      <TableHead className="text-gray-300">Orders</TableHead>
                      <TableHead className="text-gray-300">Earnings</TableHead>
                      <TableHead className="text-gray-300">Balance</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creators.map((creator) => (
                      <TableRow key={creator.id} className="border-gray-700">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={creator.avatar} />
                              <AvatarFallback className="bg-purple-600 text-white text-xs">
                                {creator.firstName[0]}{creator.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-white">{creator.displayName}</span>
                                {creator.isVerified && <Shield className="h-3 w-3 text-blue-400" />}
                                {creator.isSponsored && <Star className="h-3 w-3 text-yellow-400 fill-current" />}
                              </div>
                              <span className="text-gray-400 text-sm">{creator.firstName} {creator.lastName}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{creator.email}</TableCell>
                        <TableCell className="text-gray-300">{creator.country}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={creator.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {creator.isVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                            {creator.isSponsored && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Sponsored
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-300">{creator.commissionRate}%</TableCell>
                        <TableCell className="text-gray-300">{creator.orderCount}</TableCell>
                        <TableCell className="text-gray-300">${parseFloat(creator.totalEarnings).toFixed(2)}</TableCell>
                        <TableCell className="text-gray-300">${parseFloat(creator.availableBalance).toFixed(2)}</TableCell>
                        <TableCell>
                          <Link href={`/admin/creators/${creator.id}`}>
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-gray-400 text-sm">
                    Page {pagination.page} • {creators.length} creators shown
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                      className="border-gray-600 text-gray-300 hover:text-white"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                      className="border-gray-600 text-gray-300 hover:text-white"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}