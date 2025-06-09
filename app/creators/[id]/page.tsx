'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Clock, Video, Shield, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

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
      id: string;
      name: string;
      description: string;
    };
  }>;
}

export default function CreatorProfile() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShoutout, setSelectedShoutout] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadCreator();
    }
  }, [params.id]);

  const loadCreator = async () => {
    try {
      const response = await apiRequest(`/api/creators/${params.id}`);
      setCreator(response.creator);
    } catch (error: any) {
      toast.error('Failed to load creator profile');
      router.push('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error('Please log in to place an order');
      router.push('/login');
      return;
    }

    if (!selectedShoutout) {
      toast.error('Please select a shoutout type');
      return;
    }

    setOrdering(true);
    try {
      const response = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          shoutoutId: selectedShoutout,
          instructions: instructions.trim() || undefined,
        }),
      });

      if (response.success) {
        toast.success('Order created successfully!');
        // Redirect to payment
        window.location.href = response.payment.paymentUrl;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Creator not found</h1>
          <Link href="/browse">
            <Button>Browse Creators</Button>
          </Link>
        </div>
      </div>
    );
  }

  const selectedShoutoutData = creator.shoutouts.find(s => s.id === selectedShoutout);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
                <span className="text-gray-600">Back to Browse</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Creator Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-32 h-32 ring-4 ring-blue-100">
                <AvatarImage src={creator.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                  {creator.firstName[0]}{creator.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900">{creator.displayName}</h1>
                  {creator.isVerified && (
                    <Shield className="w-6 h-6 text-blue-500" />
                  )}
                  {creator.isSponsored && (
                    <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  )}
                </div>
                
                <p className="text-lg text-gray-600 mb-6">{creator.firstName} {creator.lastName}</p>
                
                {creator.bio && (
                  <p className="text-gray-700 leading-relaxed mb-6">{creator.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {creator.shoutouts.map((shoutout) => (
                    <Badge key={shoutout.id} variant="secondary">
                      {shoutout.shoutoutType.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shoutouts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Shoutouts</h2>
          
          {creator.shoutouts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shoutouts available</h3>
                <p className="text-gray-600">This creator hasn't set up any shoutout offerings yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {creator.shoutouts.map((shoutout) => (
                <Card key={shoutout.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{shoutout.title}</h3>
                          <Badge variant="outline">{shoutout.shoutoutType.name}</Badge>
                        </div>
                        <p className="text-gray-600 mb-4">{shoutout.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{shoutout.deliveryTime} hours delivery</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-green-600 mb-2">${shoutout.price}</div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full"
                              onClick={() => setSelectedShoutout(shoutout.id)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Order Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Order Shoutout</DialogTitle>
                              <DialogDescription>
                                You're about to order "{selectedShoutoutData?.title}" from {creator.displayName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedShoutoutData && (
                              <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-semibold text-gray-900 mb-2">{selectedShoutoutData.title}</h4>
                                  <p className="text-sm text-gray-600 mb-2">{selectedShoutoutData.description}</p>
                                  <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-green-600">${selectedShoutoutData.price}</span>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                      <Clock className="h-4 w-4" />
                                      <span>{selectedShoutoutData.deliveryTime}h delivery</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                                  <Textarea
                                    id="instructions"
                                    placeholder="Add any special requests or instructions for your shoutout..."
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    className="mt-2"
                                    rows={3}
                                  />
                                  <p className="text-sm text-gray-500 mt-1">
                                    Be specific about names, occasions, or any special details you'd like included.
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleOrder} disabled={ordering}>
                                {ordering ? 'Processing...' : `Pay $${selectedShoutoutData?.price}`}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}