import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Send, 
  Search,
  MessageCircle,
  Plus,
  Phone,
  Video
} from 'lucide-react';

interface ChatRoom {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string;
  last_message_at: string;
  other_user?: {
    full_name: string;
    avatar_url: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  message_type?: string;
  offer_amount?: number;
  offer_status?: string;
}

const Chat = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (targetUserId && !roomId) {
      // Create or find chat room with target user
      createOrFindChatRoom(targetUserId);
    } else {
      fetchChatRooms();
    }
    
    if (roomId) {
      fetchMessages(roomId);
    }
  }, [user, navigate, roomId, targetUserId]);

  const createOrFindChatRoom = async (otherUserId: string) => {
    try {
      // Check if chat room already exists
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`and(participant_1.eq.${user?.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user?.id})`)
        .single();

      if (existingRoom) {
        navigate(`/chat/${existingRoom.id}`);
        return;
      }

      // Create new chat room
      const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          participant_1: user?.id,
          participant_2: otherUserId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat room:', error);
        toast({
          title: "Error",
          description: "Failed to start conversation",
          variant: "destructive",
        });
        return;
      }

      navigate(`/chat/${newRoom.id}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participant_1_profile:profiles!participant_1 (
            full_name,
            avatar_url
          ),
          participant_2_profile:profiles!participant_2 (
            full_name,
            avatar_url
          )
        `)
        .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching chat rooms:', error);
        return;
      }

      if (data) {
        const roomsWithOtherUser = data.map(room => {
          const otherUser = room.participant_1 === user?.id 
            ? room.participant_2_profile 
            : room.participant_1_profile;
          return {
            ...room,
            other_user: otherUser || { full_name: 'Unknown User', avatar_url: null }
          };
        });
        setChatRooms(roomsWithOtherUser as any);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatRoomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      if (data) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: roomId,
          sender_id: user.id,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }

      // Update chat room last message
      await supabase
        .from('chat_rooms')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', roomId);

      setNewMessage('');
      fetchMessages(roomId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Chat list view
  if (!roomId) {
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
            <h1 className="text-xl font-semibold">Messages</h1>
            <div className="w-20"></div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Search */}
          <div className="mb-6 fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Chat Rooms */}
          <div className="space-y-2 slide-up">
            {chatRooms.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No conversations yet</h3>
                <p className="text-muted-foreground">
                  Start a conversation by messaging someone about their item
                </p>
                <Button
                  variant="hero"
                  onClick={() => navigate('/home')}
                >
                  Browse Items
                </Button>
              </div>
            ) : (
              chatRooms.map((room) => (
                <Card
                  key={room.id}
                  className="cursor-pointer interactive-hover card-shadow"
                  onClick={() => navigate(`/chat/${room.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={room.other_user?.avatar_url || ''} />
                        <AvatarFallback>
                          {room.other_user?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">
                            {room.other_user?.full_name || 'Unknown User'}
                          </h3>
                          {room.last_message_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(room.last_message_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          {room.last_message || 'Start a conversation...'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // Chat room view
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b card-shadow">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/chat')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>

          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentRoom?.other_user?.avatar_url || ''} />
              <AvatarFallback>
                {currentRoom?.other_user?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">
              {currentRoom?.other_user?.full_name || 'Unknown User'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-2xl">
        <div className="space-y-4 min-h-[60vh]">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Start the conversation</h3>
              <p className="text-muted-foreground">
                Send your first message to get started
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === user?.id
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Message Input */}
      <footer className="bg-card border-t p-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 flex items-center space-x-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                variant="hero"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;