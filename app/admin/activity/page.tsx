'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowLeft, Activity, Filter } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  userType: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminActivityPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('7');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    if (user?.type === 'admin') {
      loadLogs();
    }
  }, [user, searchQuery, userTypeFilter, actionFilter, daysFilter, page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (userTypeFilter) params.append('userType', userTypeFilter);
      if (actionFilter) params.append('action', actionFilter);
      if (daysFilter) params.append('days', daysFilter);
      params.append('page', page.toString());
      params.append('limit', '50');

      const response = await apiRequest(`/api/admin/activity-logs?${params.toString()}`);
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleUserTypeFilter = (userType: string) => {
    setUserTypeFilter(userType);
    setPage(1);
  };

  const handleActionFilter = (action: string) => {
    setActionFilter(action);
    setPage(1);
  };

  const handleDaysFilter = (days: string) => {
    setDaysFilter(days);
    setPage(1);
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'creator': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('REGISTRATION')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('CREATED') || action.includes('ACCEPTED')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('UPDATED') || action.includes('APPROVED')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (action.includes('DELETED') || action.includes('REJECTED')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
          <p className="text-gray-400">Monitor platform activity and user actions</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Platform Activity
              </CardTitle>
              <div className="flex items-center gap-4">
                <Select value={daysFilter} onValueChange={handleDaysFilter}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24h</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userTypeFilter} onValueChange={handleUserTypeFilter}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="user">Users</SelectItem>
                    <SelectItem value="creator">Creators</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activity..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4 p-4">
                      <div className="w-20 h-4 bg-gray-700 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No activity logs found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Time</TableHead>
                      <TableHead className="text-gray-300">User Type</TableHead>
                      <TableHead className="text-gray-300">Action</TableHead>
                      <TableHead className="text-gray-300">Description</TableHead>
                      <TableHead className="text-gray-300">IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="border-gray-700">
                        <TableCell className="text-gray-300 font-mono text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getUserTypeColor(log.userType)}>
                            {log.userType.charAt(0).toUpperCase() + log.userType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-md">
                          <div className="truncate" title={log.description}>
                            {log.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400 font-mono text-sm">
                          {log.ipAddress || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-gray-400 text-sm">
                    Page {pagination.page} • {logs.length} entries shown
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