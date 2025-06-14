'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, ArrowLeft, DollarSign, Check, X, Clock } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface Withdrawal {
  withdrawal: {
    id: string;
    amount: string;
    status: string;
    payoutMethod: any;
    adminNotes?: string;
    processedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
  creator: {
    id: string;
    displayName: string;
    email: string;
    avatar?: string;
    availableBalance: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function AdminWithdrawalsPage() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    hasNext: false,
    hasPrev: false,
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.type === 'admin') {
      loadWithdrawals();
    }
  }, [user, searchQuery, statusFilter, page]);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await apiRequest(`/api/admin/withdrawals?${params.toString()}`);
      setWithdrawals(response.withdrawals);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const openActionDialog = (withdrawal: Withdrawal, action: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setAdminNotes('');
    setDialogOpen(true);
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      await apiRequest(`/api/admin/withdrawals/${selectedWithdrawal.withdrawal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          action: actionType,
          adminNotes,
        }),
      });

      toast.success(`Withdrawal ${actionType}d successfully`);
      setDialogOpen(false);
      await loadWithdrawals();
    } catch (error: any) {
      toast.error(`Failed to ${actionType} withdrawal`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Management</h1>
          <p className="text-gray-400">Review and process creator withdrawal requests</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Withdrawal Requests
              </CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No withdrawal requests found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Creator</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Payout Method</TableHead>
                      <TableHead className="text-gray-300">Requested</TableHead>
                      <TableHead className="text-gray-300">Notes</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.withdrawal.id} className="border-gray-700">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={withdrawal.creator.avatar} />
                              <AvatarFallback className="bg-purple-600 text-white text-xs">
                                {withdrawal.creator.displayName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-white">{withdrawal.creator.displayName}</div>
                              <div className="text-gray-400 text-sm">{withdrawal.creator.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          ${parseFloat(withdrawal.withdrawal.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(withdrawal.withdrawal.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(withdrawal.withdrawal.status)}
                              {withdrawal.withdrawal.status.charAt(0).toUpperCase() + withdrawal.withdrawal.status.slice(1)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {withdrawal.withdrawal.payoutMethod?.type || 'Bank'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(withdrawal.withdrawal.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate">
                          {withdrawal.withdrawal.adminNotes || '—'}
                        </TableCell>
                        <TableCell>
                          {withdrawal.withdrawal.status === 'pending' ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => openActionDialog(withdrawal, 'approve')}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openActionDialog(withdrawal, 'reject')}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <p className="text-gray-400 text-sm">
                    Page {pagination.page} • {withdrawals.length} withdrawals shown
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

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedWithdrawal && (
                <>
                  Process withdrawal of ${parseFloat(selectedWithdrawal.withdrawal.amount).toFixed(2)} for {selectedWithdrawal.creator.displayName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Withdrawal Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Creator:</span>
                    <span className="text-white">{selectedWithdrawal.creator.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white">${parseFloat(selectedWithdrawal.withdrawal.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Current Balance:</span>
                    <span className="text-white">${parseFloat(selectedWithdrawal.creator.availableBalance).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Requested:</span>
                    <span className="text-white">{new Date(selectedWithdrawal.withdrawal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="adminNotes" className="text-gray-300">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  placeholder={`Add notes for this ${actionType} action...`}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawalAction}
              disabled={processing}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `${actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}