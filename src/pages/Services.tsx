import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Plus, 
  MessageCircle, 
  User, 
  ShoppingBag,
  Star,
  MapPin,
  Clock,
  Wrench
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  hourly_rate: number;
  image_url: string;
  category_id: string;
  location: string;
  provider_id: string;
  is_available: boolean;
  duration_hours: number;
  rating: number;
  total_ratings: number;
  profiles?: {
    full_name: string;
    avatar_url: string;
    rating: number;
  };
  categories?: {
    name: string;
    icon: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const Services = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch services with profile and category data
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          *,
          profiles!services_provider_id_fkey (
            full_name,
            avatar_url,
            rating
          ),
          categories!services_category_id_fkey (
            name,
            icon
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (servicesData) {
        setServices(servicesData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Services</h1>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
            >
              <ShoppingBag className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/chat')}
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/orders')}
            >
              <ShoppingBag className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
            >
              <User className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              onClick={signOut}
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Search Section */}
        <div className="space-y-4 fade-in">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search for services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4 slide-up">
          <h2 className="text-xl font-semibold">Browse Service Categories</h2>
          <div className="categories-grid">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('')}
              className="flex flex-col items-center p-4 h-auto space-y-2"
            >
              <Wrench className="w-6 h-6" />
              <span className="text-sm">All</span>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-center p-4 h-auto space-y-2"
              >
                <Wrench className="w-6 h-6" />
                <span className="text-sm">{category.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="space-y-4 slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedCategory ? 'Filtered Services' : 'Available Services'}
            </h2>
            <Button
              variant="hero"
              onClick={() => navigate('/add-listing?type=service')}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Service</span>
            </Button>
          </div>

          {filteredServices.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Wrench className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No services found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Be the first to offer a service to the community!'
                }
              </p>
              <Button
                variant="hero"
                onClick={() => navigate('/add-listing?type=service')}
              >
                Add First Service
              </Button>
            </div>
          ) : (
            <div className="items-grid">
              {filteredServices.map((service) => (
                <Card
                  key={service.id}
                  className="cursor-pointer interactive-hover card-shadow"
                  onClick={() => navigate(`/service/${service.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Wrench className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm"
                    >
                      {service.categories?.name || 'Service'}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{service.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={service.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {service.profiles?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {service.profiles?.full_name || 'Unknown'}
                        </span>
                        {service.profiles?.rating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground ml-1">
                              {service.profiles.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{service.location || 'Location not set'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium text-primary">
                          ${service.hourly_rate}/hr
                        </span>
                      </div>
                    </div>

                    <Badge variant="success">
                      Available
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Services;