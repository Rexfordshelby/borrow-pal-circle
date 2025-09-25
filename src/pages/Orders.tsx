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
  item_id: string;
  borrower_id: string;
  lender_id: string;
  borrow_date: string;
  due_date: string;
  actual_return_date?: string;
  total_amount: number;
  deposit_amount?: number;
  status: string;
  notes?: string;
  items?: {
    title: string;
    image_url?: string;
    daily_rate: number;
  };
  borrower_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  lender_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [borrowedItems, setBorrowedItems] = useState<Transaction[]>([]);
  const [lentItems, setLentItems] = useState<Transaction[]>([]);
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
          ),
          lender_profile:profiles!lending_transactions_lender_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('borrower_id', user?.id)
        .order('created_at', { ascending: false });

      if (borrowedError) {
        console.error('Error fetching borrowed items:', borrowedError);
      } else if (borrowedData) {
        setBorrowedItems(borrowedData as any);
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
          ),
          borrower_profile:profiles!lending_transactions_borrower_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('lender_id', user?.id)
        .order('created_at', { ascending: false });

      if (lentError) {
        console.error('Error fetching lent items:', lentError);
      } else if (lentData) {
        setLentItems(lentData as any);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lending_transactions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

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
        description: `Transaction ${newStatus}`,
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

  const TransactionCard = ({ transaction, type }: { transaction: Transaction; type: 'borrowed' | 'lent' }) => {
    const otherUser = type === 'borrowed' ? transaction.lender_profile : transaction.borrower_profile;
    const isLender = type === 'lent';
    const canAccept = isLender && transaction.status === 'pending';
    const canDecline = isLender && transaction.status === 'pending';
    const canComplete = transaction.status === 'ongoing';

    return (
      <Card className="card-shadow interactive-hover">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {transaction.items?.image_url ? (
                <img
                  src={transaction.items.image_url}
                  alt={transaction.items.title}
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
                  <h3 className="font-semibold truncate">{transaction.items?.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={otherUser?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {otherUser?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {type === 'borrowed' ? 'from' : 'to'} {otherUser?.full_name || 'Unknown User'}
                    </span>
                  </div>
                </div>
                {getStatusBadge(transaction.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(transaction.borrow_date), 'MMM dd')} - {format(new Date(transaction.due_date), 'MMM dd')}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/chat?user=${type === 'borrowed' ? transaction.lender_id : transaction.borrower_id}`)}
                  className="flex items-center space-x-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>Message</span>
                </Button>

                <div className="flex items-center space-x-2">
                  {canAccept && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updateTransactionStatus(transaction.id, 'accepted')}
                    >
                      Accept
                    </Button>
                  )}
                  {canDecline && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => updateTransactionStatus(transaction.id, 'declined')}
                    >
                      Decline
                    </Button>
                  )}
                  {canComplete && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => updateTransactionStatus(transaction.id, 'completed')}
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
        <Tabs defaultValue="borrowed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="borrowed">
              Borrowed ({borrowedItems.length})
            </TabsTrigger>
            <TabsTrigger value="lent">
              Lent ({lentItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="borrowed" className="space-y-4 mt-6">
            <div className="fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Items You've Borrowed</h2>
              </div>

              {borrowedItems.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No borrowed items</h3>
                  <p className="text-muted-foreground">
                    Start borrowing items from your community
                  </p>
                  <Button
                    variant="hero"
                    onClick={() => navigate('/home')}
                  >
                    Browse Items
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {borrowedItems.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      type="borrowed"
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="lent" className="space-y-4 mt-6">
            <div className="slide-up">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Items You've Lent</h2>
              </div>

              {lentItems.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No lent items</h3>
                  <p className="text-muted-foreground">
                    Share your items with the community
                  </p>
                  <Button
                    variant="hero"
                    onClick={() => navigate('/add-listing')}
                  >
                    Add Your First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {lentItems.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      type="lent"
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