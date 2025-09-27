import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EnhancedLoading from '@/components/ui/enhanced-loading';
import { format, addDays, differenceInDays } from 'date-fns';
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

interface Item {
  id: string;
  title: string;
  description: string;
  daily_rate: number;
  image_url: string;
  category_id: string;
  location: string;
  condition: string;
  owner_id: string;
  deposit_amount: number;
  is_available: boolean;
  owner_profile?: {
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

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowDate, setBorrowDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchItem();
  }, [id, user, navigate]);

  const fetchItem = async () => {
    try {
      // First, fetch the item
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (itemError || !itemData) {
        console.error('Error fetching item:', itemError);
        toast({
          title: "Error",
          description: "Item not found",
          variant: "destructive",
        });
        navigate('/home');
        return;
      }

      // Fetch owner profile
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, rating, total_ratings, bio')
        .eq('user_id', itemData.owner_id)
        .single();

      // Fetch category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name, icon')
        .eq('id', itemData.category_id)
        .single();

      // Combine the data
      const combinedData = {
        ...itemData,
        owner_profile: ownerProfile || null,
        categories: categoryData || null
      };

      setItem(combinedData);
    } catch (error) {
      console.error('Error fetching item:', error);
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!borrowDate || !returnDate || !item) return 0;
    const days = differenceInDays(returnDate, borrowDate) + 1;
    return days * item.daily_rate;
  };

  const handleBorrowRequest = async () => {
    if (!borrowDate || !returnDate || !item || !user) return;

    setIsSubmitting(true);

    try {
      const days = differenceInDays(returnDate, borrowDate) + 1;
      const totalAmount = days * item.daily_rate;

      const { error } = await supabase
        .from('lending_transactions')
        .insert({
          item_id: item.id,
          borrower_id: user.id,
          lender_id: item.owner_id,
          borrow_date: borrowDate.toISOString(),
          due_date: returnDate.toISOString(),
          total_amount: totalAmount,
          deposit_amount: item.deposit_amount || 0,
          status: 'pending'
        });

      if (error) {
        console.error('Error creating borrow request:', error);
        toast({
          title: "Error",
          description: "Failed to create borrow request",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Request Sent!",
        description: "Your borrow request has been sent to the owner",
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

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Item not found</h2>
          <Button onClick={() => navigate('/home')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.owner_id;

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
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Calendar className="w-8 h-8 text-primary" />
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
                  {item.categories?.name || 'Uncategorized'}
                </Badge>
                <Badge variant={item.condition === 'new' ? 'success' : 'secondary'}>
                  {item.condition || 'Good'}
                </Badge>
                {item.is_available && (
                  <Badge variant="success">Available</Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
              <p className="text-muted-foreground text-lg">{item.description}</p>
            </div>

            {/* Price */}
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        ${item.daily_rate}
                      </span>
                      <span className="text-muted-foreground">per day</span>
                    </div>
                    {item.deposit_amount && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Deposit: ${item.deposit_amount}
                      </p>
                    )}
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
              <span>{item.location || 'Location not specified'}</span>
            </div>

            {/* Owner Info */}
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={item.owner_profile?.avatar_url} />
                      <AvatarFallback>
                        {item.owner_profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {item.owner_profile?.full_name || 'Unknown User'}
                      </h3>
                      {item.owner_profile?.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">
                            {item.owner_profile.rating.toFixed(1)} ({item.owner_profile.total_ratings || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isOwner && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Messages are available after order acceptance
                      </p>
                    </div>
                  )}
                </div>
                
                {item.owner_profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {item.owner_profile.bio}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Booking Section */}
            {!isOwner && item.is_available && (
              <Card className="card-shadow">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Select Dates</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">From</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !borrowDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {borrowDate ? format(borrowDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={borrowDate}
                            onSelect={setBorrowDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">To</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !returnDate && "text-muted-foreground"
                            )}
                            disabled={!borrowDate}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {returnDate ? format(returnDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={returnDate}
                            onSelect={setReturnDate}
                            disabled={(date) => !borrowDate || date <= borrowDate}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {borrowDate && returnDate && (
                    <div className="bg-primary/5 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{differenceInDays(returnDate, borrowDate) + 1} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily rate:</span>
                        <span>${item.daily_rate}</span>
                      </div>
                      {item.deposit_amount && (
                        <div className="flex justify-between">
                          <span>Deposit:</span>
                          <span>${item.deposit_amount}</span>
                        </div>
                      )}
                      <hr />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">
                          ${calculateTotal() + (item.deposit_amount || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleBorrowRequest}
                    disabled={!borrowDate || !returnDate || isSubmitting}
                  >
                    {isSubmitting ? "Sending Request..." : "Request to Borrow"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {isOwner && (
              <Card className="card-shadow">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">This is your item</h3>
                  <p className="text-muted-foreground mb-4">
                    You can edit or manage this listing from your profile
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/profile')}
                  >
                    Manage Listing
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

export default ItemDetail;