import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EnhancedLoading from '@/components/ui/enhanced-loading';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Shield,
  DollarSign,
  Calendar as CalendarIcon,
  Camera,
  Phone,
  Video
} from 'lucide-react';

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  hourly_rate: number;
  duration_hours: number;
  is_available: boolean;
  image_url?: string;
  location?: string;
  category_id?: string;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
  provider_profile?: {
    full_name: string;
    avatar_url?: string;
    rating: number;
    total_ratings: number;
    bio?: string;
  } | null;
  categories?: {
    name: string;
    icon?: string;
  } | null;
}

const ServiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingDate, setBookingDate] = useState<Date | undefined>();
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProvider = user?.id === service?.provider_id;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchService();
    }
  }, [id, user, navigate]);

  const calculateTotal = () => {
    if (!duration || !service) return 0;
    return parseFloat(duration) * service.hourly_rate;
  };

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
      setDuration(String(serviceData.duration_hours));
    } catch (error) {
      console.error('Error fetching service:', error);
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingRequest = async () => {
    if (!user || !bookingDate || !bookingTime || !duration) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('service_bookings')
        .insert({
          service_id: service!.id,
          customer_id: user.id,
          provider_id: service!.provider_id,
          booking_date: format(bookingDate, 'yyyy-MM-dd'),
          booking_time: bookingTime,
          duration_hours: parseInt(duration),
          total_amount: calculateTotal(),
          status: 'pending',
          special_requests: specialRequests || null
        });

      if (error) {
        console.error('Error creating booking request:', error);
        toast({
          title: "Error",
          description: "Failed to send booking request. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Booking Request Sent!",
        description: "Your booking request has been sent to the service provider.",
      });

      // Navigate to orders page
      navigate('/orders');
    } catch (error) {
      console.error('Error creating booking request:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b sticky top-0 z-50 card-shadow">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="w-24 h-6 bg-muted rounded animate-pulse"></div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <EnhancedLoading type="profile" />
        </main>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Service Not Found</h2>
          <p className="text-muted-foreground">The service you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/services')}>Back to Services</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/services')}
            className="flex items-center space-x-2 hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Services</span>
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold gradient-text">Service Details</h1>
            <div className="w-12 h-0.5 hero-gradient rounded-full mx-auto mt-1"></div>
          </div>
          
          <div className="w-20 flex justify-end">
            {service?.provider_id === user?.id && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/edit-service/${service.id}`)}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Service Image */}
          <div className="lg:col-span-2 space-y-6">
            <div className="fade-in">
              <Card className="overflow-hidden card-shadow-hover group">
                <div className="aspect-[4/3] relative overflow-hidden">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full hero-gradient flex items-center justify-center">
                      <div className="text-center text-white">
                        <Camera className="w-20 h-20 mx-auto mb-4 opacity-70" />
                        <p className="text-lg font-medium">No Image Available</p>
                        <p className="text-sm opacity-80">Provider hasn't uploaded an image yet</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay badges */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <Badge 
                      variant={service.is_available ? "success" : "secondary"}
                      className="shadow-lg backdrop-blur-sm"
                    >
                      {service.is_available ? "Available" : "Not Available"}
                    </Badge>
                    {service.categories && (
                      <Badge variant="secondary" className="shadow-lg backdrop-blur-sm">
                        {service.categories.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Enhanced Service Info */}
            <div className="slide-up space-y-6">
              <Card className="p-6 card-shadow">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">{service.title}</h1>
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{service.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Listed {new Date(service.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-primary">${service.hourly_rate}</span>
                      <span className="text-muted-foreground">per hour</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Minimum {service.duration_hours} hour(s) required
                    </p>
                  </div>
                  
                  {service.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Provider Info Card */}
            <div className="scale-in">
              <Card className="card-shadow-hover">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                      <AvatarImage src={service.provider_profile?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {service.provider_profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{service.provider_profile?.full_name || 'Service Provider'}</h3>
                      {service.provider_profile?.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{service.provider_profile.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({service.provider_profile.total_ratings || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {service.provider_profile?.bio && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {service.provider_profile.bio}
                    </p>
                  )}
                </CardHeader>
              </Card>
            </div>

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

                    <div>
                      <Label htmlFor="special-requests">Special Requests</Label>
                      <Textarea
                        id="special-requests"
                        placeholder="Any special requirements or notes..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {bookingDate && bookingTime && duration && (
                    <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{format(bookingDate, "PPP")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{bookingTime}</span>
                      </div>
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
                          ${calculateTotal().toFixed(2)}
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