'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search, Star, Clock, Video, Filter, Shield } from 'lucide-react';
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

interface ShoutoutType {
  id: string;
  name: string;
  description: string;
}

export default function BrowseCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [shoutoutTypes, setShoutoutTypes] = useState<ShoutoutType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadShoutoutTypes();
    loadCreators();
  }, []);

  useEffect(() => {
    loadCreators();
  }, [searchQuery, selectedType, sortBy, page]);

  const loadShoutoutTypes = async () => {
    try {
      const response = await apiRequest('/api/shoutout-types');
      setShoutoutTypes(response.shoutoutTypes);
    } catch (error) {
      toast.error('Failed to load shoutout types');
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedType) params.append('shoutoutType', selectedType);
      if (priceRange[0] > 0) params.append('minPrice', priceRange[0].toString());
      if (priceRange[1] < 1000) params.append('maxPrice', priceRange[1].toString());
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '12');

      const response = await apiRequest(`/api/creators?${params.toString()}`);
      setCreators(response.creators);
    } catch (error) {
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    loadCreators();
  };

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
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Creators</h1>
          <p className="text-xl text-gray-600">Discover amazing creators and book personalized shoutouts</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Search */}
              <div className="lg:col-span-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="lg:col-span-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {shoutoutTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div className="lg:col-span-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Featured</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="delivery_time">Fastest Delivery</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Apply Filters */}
              <div className="lg:col-span-2">
                <Button onClick={applyFilters} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>
            </div>

            {/* Price Range */}
            <div className="mt-6">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Creators Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
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
        ) : creators.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No creators found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creators.map((creator) => (
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
                      <div className="flex flex-wrap gap-1 justify-center">
                        {creator.shoutouts.slice(0, 2).map((shoutout, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {shoutout.shoutoutType.name}
                          </Badge>
                        ))}
                        {creator.shoutouts.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{creator.shoutouts.length - 2} more
                          </Badge>
                        )}
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

        {/* Pagination */}
        {creators.length > 0 && (
          <div className="flex justify-center mt-12 gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={creators.length < 12}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}