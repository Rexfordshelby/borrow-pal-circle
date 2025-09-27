import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  DollarSign, 
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  created_at: string;
  updated_at: string;
  item_id?: string;
  service_id?: string;
  borrower_id?: string;
  lender_id?: string;
  customer_id?: string;
  provider_id?: string;
  borrow_date?: string;
  due_date?: string;
  booking_date?: string;
  booking_time?: string;
  duration_hours?: number;
  actual_return_date?: string;
  total_amount: number;
  deposit_amount?: number;
  status: string;
  notes?: string;
  special_requests?: string;
  type: 'lending' | 'service';
  items?: {
    title: string;
    image_url?: string;
    daily_rate: number;
  };
  services?: {
    title: string;
    image_url?: string;
    hourly_rate: number;
  };
  borrower_profile?: {
    full_name: string;
    avatar_url?: string;
  } | null;
  lender_profile?: {
    full_name: string;
    avatar_url?: string;
  } | null;
  customer_profile?: {
    full_name: string;
    avatar_url?: string;
  } | null;
  provider_profile?: {
    full_name: string;
    avatar_url?: string;
  } | null;
}

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [borrowedItems, setBorrowedItems] = useState<Transaction[]>([]);
  const [lentItems, setLentItems] = useState<Transaction[]>([]);
  const [requestedServices, setRequestedServices] = useState<Transaction[]>([]);
  const [providedServices, setProvidedServices] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTransactions();
  }, [user, navigate]);

  const fetchTransactions = async () => {
    try {
      // Fetch borrowed items (where user is borrower)
      const { data: borrowedData, error: borrowedError } = await supabase
        .from('lending_transactions')
        .select(`
          *,
          items (
            title,
            image_url,
            daily_rate
          )
        `)
        .eq('borrower_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch lender profiles for borrowed items
      let borrowedWithProfiles: Transaction[] = [];
      if (borrowedData && !borrowedError) {
        for (const item of borrowedData) {
          const { data: lenderProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', item.lender_id)
            .single();
          
          borrowedWithProfiles.push({
            ...item,
            type: 'lending' as const,
            lender_profile: lenderProfile || null
          });
        }
        setBorrowedItems(borrowedWithProfiles);
      } else if (borrowedError) {
        console.error('Error fetching borrowed items:', borrowedError);
      }

      // Fetch lent items (where user is lender)
      const { data: lentData, error: lentError } = await supabase
        .from('lending_transactions')
        .select(`
          *,
          items (
            title,
            image_url,
            daily_rate
          )
        `)
        .eq('lender_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch borrower profiles for lent items
      let lentWithProfiles: Transaction[] = [];
      if (lentData && !lentError) {
        for (const item of lentData) {
          const { data: borrowerProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', item.borrower_id)
            .single();
          
          lentWithProfiles.push({
            ...item,
            type: 'lending' as const,
            borrower_profile: borrowerProfile || null
          });
        }
        setLentItems(lentWithProfiles);
      } else if (lentError) {
        console.error('Error fetching lent items:', lentError);
      }

      // Fetch requested services (where user is customer)
      const { data: requestedData, error: requestedError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          services (
            title,
            image_url,
            hourly_rate
          )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch provider profiles for requested services
      let requestedWithProfiles: Transaction[] = [];
      if (requestedData && !requestedError) {
        for (const service of requestedData) {
          const { data: providerProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', service.provider_id)
            .single();
          
          requestedWithProfiles.push({
            ...service,
            type: 'service' as const,
            provider_profile: providerProfile || null
          });
        }
        setRequestedServices(requestedWithProfiles);
      } else if (requestedError) {
        console.error('Error fetching requested services:', requestedError);
      }

      // Fetch provided services (where user is provider)
      const { data: providedData, error: providedError } = await supabase
        .from('service_bookings')
        .select(`
          *,
          services (
            title,
            image_url,
            hourly_rate
          )
        `)
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch customer profiles for provided services
      let providedWithProfiles: Transaction[] = [];
      if (providedData && !providedError) {
        for (const service of providedData) {
          const { data: customerProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', service.customer_id)
            .single();
          
          providedWithProfiles.push({
            ...service,
            type: 'service' as const,
            customer_profile: customerProfile || null
          });
        }
        setProvidedServices(providedWithProfiles);
      } else if (providedError) {
        console.error('Error fetching provided services:', providedError);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transaction: Transaction, newStatus: string) => {
    try {
      const table = transaction.type === 'lending' ? 'lending_transactions' : 'service_bookings';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      if (error) {
        console.error('Error updating transaction:', error);
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${transaction.type === 'lending' ? 'Order' : 'Booking'} ${newStatus}`,
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'accepted':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>;
      case 'ongoing':
        return <Badge variant="default"><Package className="w-3 h-3 mr-1" />Ongoing</Badge>;
      case 'completed':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const TransactionCard = ({ transaction, userType }: { transaction: Transaction; userType: 'requester' | 'provider' }) => {
    const isLender = userType === 'provider';
    const isServiceProvider = transaction.type === 'service' && userType === 'provider';
    const isItemOwner = transaction.type === 'lending' && userType === 'provider';
    
    const otherUser = transaction.type === 'lending' 
      ? (userType === 'requester' ? transaction.lender_profile : transaction.borrower_profile)
      : (userType === 'requester' ? transaction.provider_profile : transaction.customer_profile);
    
    const canAccept = isLender && transaction.status === 'pending';
    const canDecline = isLender && transaction.status === 'pending';
    const canComplete = transaction.status === 'accepted' || transaction.status === 'ongoing';
    const canMessage = transaction.status === 'accepted' || transaction.status === 'ongoing' || transaction.status === 'completed';

    const itemOrService = transaction.items || transaction.services;
    const chatUserId = transaction.type === 'lending' 
      ? (userType === 'requester' ? transaction.lender_id : transaction.borrower_id)
      : (userType === 'requester' ? transaction.provider_id : transaction.customer_id);

    return (
      <Card className="card-shadow interactive-hover">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {itemOrService?.image_url ? (
                <img
                  src={itemOrService.image_url}
                  alt={itemOrService.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold truncate">{itemOrService?.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.type === 'lending' ? 'Item' : 'Service'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={otherUser?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {otherUser?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {userType === 'requester' ? 'from' : 'to'} {otherUser?.full_name || 'Unknown User'}
                    </span>
                  </div>
                </div>
                {getStatusBadge(transaction.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {transaction.type === 'lending' ? (
                      `${format(new Date(transaction.borrow_date!), 'MMM dd')} - ${format(new Date(transaction.due_date!), 'MMM dd')}`
                    ) : (
                      `${format(new Date(transaction.booking_date!), 'MMM dd')} at ${transaction.booking_time}`
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>${transaction.total_amount}</span>
                  {transaction.deposit_amount && (
                    <span className="text-xs">(+${transaction.deposit_amount} deposit)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                {canMessage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/chat?user=${chatUserId}`)}
                    className="flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Message</span>
                  </Button>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Messages available after acceptance
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {canAccept && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateTransactionStatus(transaction, 'accepted')}
                    >
                      Accept
                    </Button>
                  )}
                  {canDecline && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateTransactionStatus(transaction, 'declined')}
                    >
                      Decline
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateTransactionStatus(transaction, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
          <h1 className="text-xl font-semibold">My Orders</h1>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="requested" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requested">
              Requested ({borrowedItems.length + requestedServices.length})
            </TabsTrigger>
            <TabsTrigger value="provided">
              Provided ({lentItems.length + providedServices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requested" className="space-y-4 mt-6">
            <div className="fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Items & Services You've Requested</h2>
              </div>

              {[...borrowedItems, ...requestedServices].length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No requests yet</h3>
                  <p className="text-muted-foreground">
                    Start borrowing items or booking services from your community
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="hero"
                      onClick={() => navigate('/home')}
                    >
                      Browse Items
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/services')}
                    >
                      Browse Services
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...borrowedItems, ...requestedServices]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((transaction) => (
                      <TransactionCard
                        key={`${transaction.type}-${transaction.id}`}
                        transaction={transaction}
                        userType="requester"
                      />
                    ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="provided" className="space-y-4 mt-6">
            <div className="slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Items & Services You've Provided</h2>
              </div>

              {[...lentItems, ...providedServices].length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No provided items or services</h3>
                  <p className="text-muted-foreground">
                    Share your items and services with the community
                  </p>
                  <Button
                    variant="hero"
                    onClick={() => navigate('/add-listing')}
                  >
                    Add Your First Listing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...lentItems, ...providedServices]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((transaction) => (
                      <TransactionCard
                        key={`${transaction.type}-${transaction.id}`}
                        transaction={transaction}
                        userType="provider"
                      />
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Orders;