import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { OfferDialog } from '@/components/chat/OfferDialog';
import { PaymentDialog } from '@/components/chat/PaymentDialog';
import { OfferMessage } from '@/components/chat/OfferMessage';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare,
  Phone,
  Video,
  DollarSign,
  CreditCard
} from 'lucide-react';

interface ChatRoom {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string | null;
  otherUserName?: string;
  otherUserAvatar?: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'offer' | 'payment_request';
  offer?: {
    id: string;
    amount: number;
    message: string;
    type: 'price_offer' | 'counter_offer';
    status: string;
  };
}

const Chat = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerDialogType, setOfferDialogType] = useState<'price_offer' | 'counter_offer'>('price_offer');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogAmount, setPaymentDialogAmount] = useState(0);
  const [orderContext, setOrderContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = user;

  // Real-time subscription
  useChatRealtime({
    chatRoomId: roomId,
    onMessageReceived: () => roomId && fetchMessages(roomId),
    onChatRoomUpdated: () => fetchChatRooms(),
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate('/auth');
          return;
        }

        if (targetUserId && !roomId) {
          await createOrFindChatRoom(targetUserId);
        } else {
          await fetchChatRooms();
        }

        if (roomId) {
          await fetchMessages(roomId);
          const room = await fetchRoomDetails(roomId);
          if (room) {
            const otherUserId = room.participant_1 === authUser.id ? room.participant_2 : room.participant_1;
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', otherUserId)
              .maybeSingle();
            setOtherUser(profile);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: "Failed to initialize chat",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [roomId, targetUserId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createOrFindChatRoom = async (otherUserId: string) => {
    try {
      // Prevent self-chat
      if (user?.id === otherUserId) {
        toast({
          title: "Error",
          description: "You can't chat with yourself",
          variant: "destructive"
        });
        return;
      }

      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`and(participant_1.eq.${user?.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user?.id})`);

      if (existingRooms && existingRooms.length > 0) {
        navigate(`/chat/${existingRooms[0].id}`);
        return;
      }

      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          participant_1: user?.id,
          participant_2: otherUserId,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (newRoom) navigate(`/chat/${newRoom.id}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const fetchRoomDetails = async (chatRoomId: string) => {
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', chatRoomId)
      .maybeSingle();
    return data;
  };

  const fetchChatRooms = async () => {
    try {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      if (rooms) {
        const roomsWithProfiles = await Promise.all(
          rooms.map(async (room) => {
            const otherUserId = room.participant_1 === user?.id ? room.participant_2 : room.participant_1;
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', otherUserId)
              .maybeSingle();

            return {
              ...room,
              otherUserName: profile?.full_name || 'Unknown User',
              otherUserAvatar: profile?.avatar_url
            };
          })
        );
        setChatRooms(roomsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (chatRoomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data.map(msg => {
          const offerData = msg.offer_data as any;
          return {
            id: msg.id,
            content: msg.content,
            senderId: msg.sender_id,
            timestamp: msg.created_at,
            type: msg.message_type as 'text' | 'offer' | 'payment_request',
            offer: offerData ? {
              id: msg.id,
              amount: offerData.amount || 0,
              message: offerData.message || '',
              type: offerData.type || 'price_offer',
              status: msg.negotiation_status || 'pending'
            } : undefined
          };
        }));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: roomId,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      await supabase
        .from('chat_rooms')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', roomId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleSendOffer = async (offerData: { amount: number; message: string }) => {
    if (!roomId || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: roomId,
          sender_id: currentUser.id,
          content: offerData.message || `Offer: $${offerData.amount}`,
          message_type: 'offer',
          offer_type: offerDialogType,
          offer_data: { amount: offerData.amount, message: offerData.message, type: offerDialogType },
          negotiation_status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Offer Sent",
        description: "Your offer has been sent successfully",
      });

      setOfferDialogOpen(false);
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive"
      });
    }
  };

  const handleAcceptOffer = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message?.offer) return;

      const { error } = await supabase
        .from('messages')
        .update({ negotiation_status: 'accepted' })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Offer Accepted",
        description: "Opening payment dialog...",
      });
      
      if (roomId) fetchMessages(roomId);
      
      // Auto-open payment dialog after a short delay
      setTimeout(() => {
        setPaymentDialogOpen(true);
      }, 500);
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to accept offer",
        variant: "destructive"
      });
    }
  };

  const handleDeclineOffer = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ negotiation_status: 'declined' })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Offer Declined",
        description: "The offer has been declined",
      });
      
      if (roomId) fetchMessages(roomId);
    } catch (error) {
      console.error('Error declining offer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading chats...</p>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="container mx-auto p-3 sm:p-4 pb-20">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Messages</h1>
        {chatRooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-2">Start borrowing or lending to chat with others!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {chatRooms.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/chat/${room.id}`)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={room.otherUserAvatar} />
                      <AvatarFallback>{room.otherUserName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{room.otherUserName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {room.last_message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/chat')}
          className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
          <AvatarImage src={otherUser?.avatar_url} />
          <AvatarFallback>{otherUser?.full_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm sm:text-base truncate">{otherUser?.full_name}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Online</p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {messages.map((message) => {
            const isOwn = message.senderId === currentUser?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[70%]`}>
                  {message.type === 'offer' && message.offer ? (
                    <OfferMessage
                      offer={message.offer}
                      isOwnMessage={isOwn}
                      onAccept={() => handleAcceptOffer(message.id)}
                      onDecline={() => handleDeclineOffer(message.id)}
                      onCounterOffer={() => {
                        setOfferDialogType('counter_offer');
                        setOfferDialogOpen(true);
                      }}
                      onPay={() => {
                        if (message.offer) {
                          setPaymentDialogAmount(message.offer.amount);
                          setPaymentDialogOpen(true);
                        }
                      }}
                    />
                  ) : (
                    <div
                      className={`rounded-lg p-2.5 sm:p-3 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs sm:text-sm break-words">{message.content}</p>
                      <p className="text-[10px] sm:text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-3 sm:p-4 bg-background sticky bottom-0">
        <div className="flex flex-wrap gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOfferDialogType('price_offer');
              setOfferDialogOpen(true);
            }}
            className="text-xs sm:text-sm"
          >
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Make Offer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaymentDialogOpen(true)}
            className="text-xs sm:text-sm"
          >
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Request Payment
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            className="text-sm"
          />
          <Button onClick={sendMessage} size="icon" className="h-10 w-10 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <OfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        onSubmit={handleSendOffer}
        type={offerDialogType}
        currentAmount={paymentDialogAmount}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        amount={paymentDialogAmount}
        orderDetails={orderContext}
        onSuccess={() => {
          toast({
            title: "Payment Initiated",
            description: "Payment window opened. Complete the payment to continue.",
          });
          setPaymentDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Chat;
