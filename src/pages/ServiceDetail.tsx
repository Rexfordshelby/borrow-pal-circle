import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  MapPin, 
  Star, 
  MessageCircle,
  Clock,
  Shield,
  Heart,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  provider_profile?: {
    full_name: string;
    avatar_url: string;
    rating: number;
    total_ratings: number;
    bio: string;
  };
  categories?: {
    name: string;
    icon: string;
  };
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchService();
  }, [id, user, navigate]);

  const fetchService = async () => {
    try {
      // First, fetch the service
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (serviceError || !serviceData) {
        console.error('Error fetching service:', serviceError);
        toast({
          title: "Error",
          description: "Service not found",
          variant: "destructive",
        });
        navigate('/services');
        return;
      }

      // Fetch provider profile
      const { data: providerProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, rating, total_ratings, bio')
        .eq('user_id', serviceData.provider_id)
        .single();

      // Fetch category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name, icon')
        .eq('id', serviceData.category_id)
        .single();

      // Combine the data
      const combinedData = {
        ...serviceData,
        provider_profile: providerProfile || null,
        categories: categoryData || null
      };

      setService(combinedData);
    } catch (error) {
      console.error('Error fetching service:', error);
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!service || !duration) return 0;
    return parseFloat(duration) * service.hourly_rate;
  };

  const handleBookingRequest = async () => {
    if (!bookingDate || !bookingTime || !service || !user) return;

    setIsSubmitting(true);

    try {
      const totalAmount = calculateTotal();

      const { error } = await supabase
        .from('service_bookings')
        .insert({
          service_id: service.id,
          customer_id: user.id,
          provider_id: service.provider_id,
          booking_date: bookingDate.toISOString().split('T')[0],
          booking_time: bookingTime,
          duration_hours: parseInt(duration),
          total_amount: totalAmount,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating booking request:', error);
        toast({
          title: "Error",
          description: "Failed to create booking request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request Sent!",
        description: "Your booking request has been sent to the service provider",
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Service not found</h2>
          <Button onClick={() => navigate('/services')}>Back to Services</Button>
        </div>
      </div>
    );
  }

  const isProvider = user?.id === service.provider_id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4 fade-in">
            <div className="aspect-square rounded-lg overflow-hidden card-shadow">
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">No image available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6 slide-up">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="secondary">
                  {service.categories?.name || 'Service'}
                </Badge>
                {service.is_available && (
                  <Badge variant="success">Available</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
              <p className="text-muted-foreground text-lg">{service.description}</p>
            </div>

            {/* Price */}
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        ${service.hourly_rate}
                      </span>
                      <span className="text-muted-foreground">per hour</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Minimum {service.duration_hours} hour(s)
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">Protected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="w-5 h-5" />
              <span>{service.location || 'Location not specified'}</span>
            </div>

            {/* Provider Info */}
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={service.provider_profile?.avatar_url} />
                      <AvatarFallback>
                        {service.provider_profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {service.provider_profile?.full_name || 'Unknown User'}
                      </h3>
                      {service.provider_profile?.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {service.provider_profile.rating.toFixed(1)} ({service.provider_profile.total_ratings || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isProvider && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Messages are available after booking acceptance
                      </p>
                    </div>
                  )}
                </div>
                
                {service.provider_profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {service.provider_profile.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Booking Section */}
            {!isProvider && service.is_available && (
              <Card className="card-shadow">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Book This Service</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !bookingDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {bookingDate ? format(bookingDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={bookingDate}
                            onSelect={setBookingDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="duration">Duration (hours)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min={service.duration_hours}
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {bookingDate && bookingTime && duration && (
                    <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{duration} hour(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hourly rate:</span>
                        <span>${service.hourly_rate}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">
                          ${calculateTotal()}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleBookingRequest}
                    disabled={!bookingDate || !bookingTime || !duration || isSubmitting}
                  >
                    {isSubmitting ? "Sending Request..." : "Request Booking"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {isProvider && (
              <Card className="card-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">This is your service</h3>
                  <p className="text-muted-foreground mb-4">
                    You can edit or manage this service from your profile
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/profile')}
                  >
                    Manage Service
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetail;