'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Star, Clock, Video, Users, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';
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
      name: string;
    };
  }>;
}

export default function HomePage() {
  const { user } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFeaturedCreators();
  }, []);

  const loadFeaturedCreators = async () => {
    try {
      const response = await apiRequest('/api/creators?limit=8');
      setCreators(response.creators);
    } catch (error: any) {
      toast.error('Failed to load featured creators');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    // Redirect authenticated users to their dashboard
    if (user.type === 'admin') {
      window.location.href = '/admin';
    } else if (user.type === 'creator') {
      window.location.href = '/creator';
    } else {
      window.location.href = '/dashboard';
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShoutoutHub
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Get Personalized Shoutouts from
            <span className="block text-blue-600">Top Creators</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Book custom video messages, endorsements, and personalized content from your favorite creators.
            Perfect for birthdays, celebrations, or business promotions.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search creators or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-2xl shadow-lg"
              />
              <Button className="absolute right-2 top-2 h-10 px-6 rounded-xl">
                Search
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">500+</div>
              <div className="text-gray-600">Verified Creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">24hr</div>
              <div className="text-gray-600">Average Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Creators</h2>
            <p className="text-xl text-gray-600">Discover amazing creators ready to make your day special</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {creators.map((creator) => (
                <Card key={creator.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105">
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
                      <div className="space-y-2">
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
                    
                    <Button className="w-full mt-4 group-hover:bg-blue-600 transition-colors">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get your personalized shoutout in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Browse Creators</h3>
              <p className="text-gray-600">Explore our curated list of verified creators and find the perfect match for your needs.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Book & Pay</h3>
              <p className="text-gray-600">Choose your shoutout type, add instructions, and complete secure payment with cryptocurrency.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Receive Content</h3>
              <p className="text-gray-600">Get your personalized shoutout delivered within 24-72 hours, ready to share and enjoy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of happy customers who have received amazing personalized content
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
                <Users className="w-5 h-5 mr-2" />
                Sign Up as Customer
              </Button>
            </Link>
            <Link href="/creator/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
                <Video className="w-5 h-5 mr-2" />
                Become a Creator
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Video className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">ShoutoutHub</span>
              </div>
              <p className="text-gray-400 mb-4">
                The premium platform for personalized creator content. Connect with your favorite creators and get amazing personalized experiences.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <div className="space-y-2 text-gray-400">
                <div><Link href="/browse" className="hover:text-white transition-colors">Browse Creators</Link></div>
                <div><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></div>
                <div><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-gray-400">
                <div><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></div>
                <div><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></div>
                <div><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></div>
                <div><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ShoutoutHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}